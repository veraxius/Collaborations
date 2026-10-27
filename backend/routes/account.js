import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { signToken, requireOwner } from "../lib/auth.js";
import { signPurposeToken, verifyPurposeToken } from "../lib/tokens.js";
import { emailConfigured, sendEmail } from "../lib/email.js";
import { emailShell, appUrl } from "../lib/email-templates.js";
import { escapeHtml } from "../lib/security.js";
import { ALLOW_REGISTRATION, BRAND_NAME, IS_PRIVATE } from "../lib/brand.js";
import { VERTICALS, oneOf } from "../lib/expiry.js";
import { companyIsPaid, ownerUser, publicCompany } from "../lib/company.js";
import { teamLimit } from "../lib/plan.js";
import { cleanUsdot, mcs150NextDue } from "../lib/deadlines.js";
import { isValidEmail, parseEmails, parseOffsets } from "../lib/reminder-config.js";
import { lookupCarrier, DotLookupError } from "../lib/dot.js";

const MAX_PASSWORD_BYTES = 72; // bcrypt ignores everything after 72 bytes
const MAX_TEAM = 10;

function passwordProblem(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) return "Password is too long (72 bytes at most).";
  return null;
}

/**
 * Account, sign-in, team and billing routes. Everything the app needs is
 * injected so the same code runs in production and in tests.
 */
export function registerAccountRoutes(app, { prisma, requireAuth, limiters, uploadDir, mail = sendEmail }) {
  // A fixed hash to compare against when the email is unknown, so response
  // time does not reveal which emails have accounts.
  const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

  const userOf = (req, company) =>
    req.role === "owner" ? ownerUser(company) : { email: req.email, name: req.userName, role: req.role };

  async function sendVerification(company) {
    const token = signPurposeToken("verify", company.id, company.email, "7d");
    const link = `${appUrl()}/verify-email?id=${encodeURIComponent(company.id)}&token=${encodeURIComponent(token)}`;
    await mail(
      company.email,
      `[${BRAND_NAME}] Confirm your email`,
      emailShell({
        heading: "Confirm your email",
        bodyHtml: `<p>Welcome to ${escapeHtml(BRAND_NAME)}. Confirm your email so we can send you document reminders.</p>`,
        cta: { label: "Confirm email", url: link },
        footer: "This link expires in 7 days. If you didn't create this account, you can ignore this email.",
      })
    );
  }

  async function sendInvite(company, member) {
    const token = signPurposeToken("invite", member.id, member.passwordHash, "7d");
    const link = `${appUrl()}/accept-invite?id=${encodeURIComponent(member.id)}&token=${encodeURIComponent(token)}`;
    await mail(
      member.email,
      `[${BRAND_NAME}] ${company.name} invited you`,
      emailShell({
        heading: `Join ${company.name}`,
        bodyHtml: `<p>${escapeHtml(company.name)} added you to ${escapeHtml(BRAND_NAME)} as <strong>${escapeHtml(member.role)}</strong>. Choose a password to get started.</p>`,
        cta: { label: "Accept invitation", url: link },
        footer: "This link expires in 7 days.",
      })
    );
  }

  // ---------- Sign up / sign in ----------
  app.post("/api/auth/register", limiters.auth, async (req, res) => {
    try {
      const name = String(req.body.name ?? "").trim();
      const email = String(req.body.email ?? "").trim().toLowerCase();
      const password = String(req.body.password ?? "");
      if (!name || name.length > 120) return res.status(400).json({ error: "Enter your company name." });
      if (!isValidEmail(email)) return res.status(400).json({ error: "Enter a valid email." });
      const problem = passwordProblem(password);
      if (problem) return res.status(400).json({ error: problem });

      if (IS_PRIVATE && !ALLOW_REGISTRATION && (await prisma.company.count()) > 0) {
        return res.status(403).json({ error: "Registration is closed for this installation." });
      }
      const [existingCompany, existingMember] = await Promise.all([
        prisma.company.findUnique({ where: { email } }),
        prisma.teamMember.findUnique({ where: { email } }),
      ]);
      if (existingCompany || existingMember) {
        return res.status(400).json({ error: "An account with that email already exists." });
      }

      const usdot = cleanUsdot(req.body.usdot);
      // Without a real email provider (local development) or on a private
      // install nobody could ever confirm the address, so it counts as verified.
      const verifiedNow = IS_PRIVATE || !emailConfigured();
      const company = await prisma.company.create({
        data: {
          name,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          vertical: oneOf(String(req.body.vertical ?? "trucking"), VERTICALS, "trucking"),
          usdot,
          emailVerified: verifiedNow,
          trialEndsAt: new Date(), // legacy column, not used
        },
      });

      // A USDOT number gives the first useful reminder for free: the MCS-150 update.
      if (usdot) {
        const due = mcs150NextDue(usdot);
        if (due) {
          try {
            await prisma.document.create({
              data: {
                companyId: company.id,
                title: "MCS-150 biennial update",
                type: "mcs150",
                issuer: "FMCSA",
                expiresAt: new Date(`${due}T12:00:00Z`),
                notes: `Calculated from USDOT ${usdot}. Due by the last day of the month.`,
              },
            });
          } catch (err) {
            console.error("[register] could not create the MCS-150 reminder:", err?.message ?? err);
          }
        }
      }

      if (!verifiedNow) {
        try {
          await sendVerification(company);
        } catch (err) {
          console.error("[register] verification email failed:", err?.message ?? err);
        }
      }
      return res.status(201).json({ token: signToken(company), company: publicCompany(company) });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/login", limiters.auth, async (req, res) => {
    try {
      const email = String(req.body.email ?? "").trim().toLowerCase();
      const password = String(req.body.password ?? "");
      const company = await prisma.company.findUnique({ where: { email } });
      const member = company ? null : await prisma.teamMember.findUnique({ where: { email } });
      const subject = company ?? (member && member.passwordHash ? member : null);
      const ok = await bcrypt.compare(password, subject?.passwordHash || DUMMY_HASH);
      if (!subject || !ok) return res.status(401).json({ error: "Invalid email or password." });

      if (company) return res.json({ token: signToken(company), company: publicCompany(company) });
      const owner = await prisma.company.findUnique({ where: { id: member.companyId } });
      if (!owner) return res.status(401).json({ error: "Invalid email or password." });
      const user = { email: member.email, name: member.name, role: member.role };
      return res.json({ token: signToken(owner, member), company: publicCompany(owner, user) });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // ---------- Password reset and invitations ----------
  app.post("/api/auth/forgot", limiters.reset, async (req, res) => {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const generic = { ok: true }; // identical answer whether or not the account exists
    try {
      if (!email) return res.json(generic);
      const company = await prisma.company.findUnique({ where: { email } });
      if (company) {
        const token = signPurposeToken("reset", company.id, company.passwordHash, "1h");
        const link = `${appUrl()}/reset-password?id=${encodeURIComponent(company.id)}&k=c&token=${encodeURIComponent(token)}`;
        await mail(
          company.email,
          `[${BRAND_NAME}] Reset your password`,
          emailShell({
            heading: "Reset your password",
            bodyHtml: `<p>We received a request to reset the password for ${escapeHtml(company.name)}.</p>`,
            cta: { label: "Choose a new password", url: link },
            footer: "This link expires in 1 hour. If you didn't ask for it, you can ignore this email.",
          })
        );
        return res.json(generic);
      }
      const member = await prisma.teamMember.findUnique({ where: { email } });
      if (member) {
        const owner = await prisma.company.findUnique({ where: { id: member.companyId } });
        if (owner && !member.passwordHash) {
          await sendInvite(owner, member); // never accepted: send the invitation again
        } else if (owner) {
          const token = signPurposeToken("reset", member.id, member.passwordHash, "1h");
          const link = `${appUrl()}/reset-password?id=${encodeURIComponent(member.id)}&k=m&token=${encodeURIComponent(token)}`;
          await mail(
            member.email,
            `[${BRAND_NAME}] Reset your password`,
            emailShell({
              heading: "Reset your password",
              bodyHtml: `<p>We received a request to reset your ${escapeHtml(BRAND_NAME)} password.</p>`,
              cta: { label: "Choose a new password", url: link },
              footer: "This link expires in 1 hour. If you didn't ask for it, you can ignore this email.",
            })
          );
        }
      }
    } catch (err) {
      console.error("[forgot]", err?.message ?? err);
    }
    return res.json(generic);
  });

  app.post("/api/auth/reset", limiters.reset, async (req, res) => {
    const id = String(req.body.id ?? "");
    const token = String(req.body.token ?? "");
    const password = String(req.body.password ?? "");
    const isMember = String(req.body.kind ?? "c") === "m";
    const problem = passwordProblem(password);
    if (problem) return res.status(400).json({ error: problem });
    const invalid = () => res.status(400).json({ error: "This reset link is invalid or has expired." });
    if (!id) return invalid();

    try {
      if (isMember) {
        const member = await prisma.teamMember.findUnique({ where: { id } });
        if (!member || !member.passwordHash || !verifyPurposeToken(token, "reset", member.id, member.passwordHash)) {
          return invalid();
        }
        const updated = await prisma.teamMember.update({
          where: { id: member.id },
          data: { passwordHash: await bcrypt.hash(password, 10) },
        });
        const owner = await prisma.company.findUnique({ where: { id: member.companyId } });
        if (!owner) return invalid();
        const user = { email: updated.email, name: updated.name, role: updated.role };
        return res.json({ token: signToken(owner, updated), company: publicCompany(owner, user) });
      }
      const company = await prisma.company.findUnique({ where: { id } });
      if (!company || !verifyPurposeToken(token, "reset", company.id, company.passwordHash)) return invalid();
      const updated = await prisma.company.update({
        where: { id: company.id },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      });
      return res.json({ token: signToken(updated), company: publicCompany(updated) });
    } catch (err) {
      console.error("[reset]", err?.message ?? err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/accept-invite", limiters.reset, async (req, res) => {
    const id = String(req.body.id ?? "");
    const token = String(req.body.token ?? "");
    const password = String(req.body.password ?? "");
    const problem = passwordProblem(password);
    if (problem) return res.status(400).json({ error: problem });
    const invalid = () => res.status(400).json({ error: "This invitation is invalid or has expired." });
    try {
      const member = id ? await prisma.teamMember.findUnique({ where: { id } }) : null;
      if (!member || !verifyPurposeToken(token, "invite", member.id, member.passwordHash)) return invalid();
      const updated = await prisma.teamMember.update({
        where: { id: member.id },
        data: { passwordHash: await bcrypt.hash(password, 10) },
      });
      const owner = await prisma.company.findUnique({ where: { id: member.companyId } });
      if (!owner) return invalid();
      const user = { email: updated.email, name: updated.name, role: updated.role };
      return res.json({ token: signToken(owner, updated), company: publicCompany(owner, user) });
    } catch (err) {
      console.error("[accept-invite]", err?.message ?? err);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // ---------- Email verification ----------
  app.post("/api/auth/verify", limiters.reset, async (req, res) => {
    const id = String(req.body.id ?? "");
    const token = String(req.body.token ?? "");
    const company = id ? await prisma.company.findUnique({ where: { id } }) : null;
    if (!company || !verifyPurposeToken(token, "verify", company.id, company.email)) {
      return res.status(400).json({ error: "This confirmation link is invalid or has expired." });
    }
    if (!company.emailVerified) {
      await prisma.company.update({ where: { id: company.id }, data: { emailVerified: true } });
    }
    return res.json({ ok: true });
  });

  app.post("/api/auth/resend-verification", requireAuth, requireOwner, limiters.reset, async (req, res) => {
    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    if (!company) return res.status(401).json({ error: "Unauthorized" });
    if (company.emailVerified) return res.json({ ok: true });
    try {
      await sendVerification(company);
      return res.json({ ok: true });
    } catch (err) {
      console.error("[resend-verification]", err?.message ?? err);
      return res.status(502).json({ error: "We couldn't send the email. Try again in a few minutes." });
    }
  });

  // ---------- Current user and company settings ----------
  app.get("/api/me", requireAuth, async (req, res) => {
    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    if (!company) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ company: publicCompany(company, userOf(req, company)) });
  });

  app.patch("/api/me", requireAuth, requireOwner, async (req, res) => {
    const name = String(req.body.name ?? "").trim();
    if (!name || name.length > 120) return res.status(400).json({ error: "Company name is required." });
    let usdot;
    if (req.body.usdot !== undefined) {
      const raw = String(req.body.usdot ?? "").trim();
      usdot = raw === "" ? null : cleanUsdot(raw);
      if (raw !== "" && !usdot) return res.status(400).json({ error: "Enter a valid USDOT number (3 to 9 digits)." });
    }
    const company = await prisma.company.update({
      where: { id: req.companyId },
      data: {
        name,
        contactName: String(req.body.contactName ?? "").trim().slice(0, 120) || null,
        phone: String(req.body.phone ?? "").trim().slice(0, 40) || null,
        country: String(req.body.country ?? "").trim().slice(0, 80) || null,
        ...(req.body.vertical !== undefined ? { vertical: oneOf(String(req.body.vertical), VERTICALS, "trucking") } : {}),
        ...(usdot !== undefined ? { usdot } : {}),
      },
    });
    return res.json({ company: publicCompany(company, userOf(req, company)) });
  });

  app.patch("/api/settings/notifications", requireAuth, requireOwner, async (req, res) => {
    const data = {};
    if (req.body.reminderOffsets !== undefined) {
      const offsets = parseOffsets(req.body.reminderOffsets);
      if (!offsets) {
        return res.status(400).json({ error: "Reminder days must be 1 to 6 whole numbers between 1 and 365, for example 30, 15, 7, 1." });
      }
      data.reminderOffsets = offsets.join(",");
    }
    if (req.body.reminderEmails !== undefined) {
      const emails = parseEmails(req.body.reminderEmails);
      if (!emails) return res.status(400).json({ error: "Enter up to 5 valid email addresses, separated by commas." });
      data.reminderEmails = emails.join(",");
    }
    if (req.body.notifyDrivers !== undefined) data.notifyDrivers = Boolean(req.body.notifyDrivers);
    if (req.body.weeklyDigest !== undefined) data.weeklyDigest = Boolean(req.body.weeklyDigest);
    const company = await prisma.company.update({ where: { id: req.companyId }, data });
    return res.json({ company: publicCompany(company, userOf(req, company)) });
  });

  app.post("/api/me/password", requireAuth, limiters.reset, async (req, res) => {
    const current = String(req.body.current ?? "");
    const next = String(req.body.next ?? "");
    const problem = passwordProblem(next);
    if (problem) return res.status(400).json({ error: problem });

    if (req.role === "owner") {
      const company = await prisma.company.findUnique({ where: { id: req.companyId } });
      if (!company || !(await bcrypt.compare(current, company.passwordHash))) {
        return res.status(400).json({ error: "Current password is incorrect." });
      }
      const updated = await prisma.company.update({
        where: { id: company.id },
        data: { passwordHash: await bcrypt.hash(next, 10) },
      });
      // Every other session is signed out; this one gets a fresh token.
      return res.json({ ok: true, token: signToken(updated) });
    }
    const member = await prisma.teamMember.findUnique({ where: { id: req.memberId } });
    if (!member || !(await bcrypt.compare(current, member.passwordHash))) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }
    const updated = await prisma.teamMember.update({
      where: { id: member.id },
      data: { passwordHash: await bcrypt.hash(next, 10) },
    });
    const owner = await prisma.company.findUnique({ where: { id: member.companyId } });
    return res.json({ ok: true, token: signToken(owner, updated) });
  });

  // Permanently delete the account and everything in it (owner only, password required).
  app.delete("/api/me", requireAuth, requireOwner, limiters.reset, async (req, res) => {
    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    if (!company || !(await bcrypt.compare(String(req.body.password ?? ""), company.passwordHash))) {
      return res.status(400).json({ error: "Password is incorrect." });
    }
    const files = await prisma.document.findMany({
      where: { companyId: company.id, fileName: { not: null } },
      select: { fileName: true },
    });
    await prisma.company.delete({ where: { id: company.id } }); // cascades to everything else
    if (uploadDir) {
      for (const { fileName } of files) {
        if (fileName && !/[\\/]|\.\./.test(fileName)) fs.promises.unlink(path.join(uploadDir, fileName)).catch(() => {});
      }
    }
    return res.json({ ok: true });
  });

  // ---------- Team ----------
  app.get("/api/team", requireAuth, requireOwner, async (req, res) => {
    const members = await prisma.teamMember.findMany({ where: { companyId: req.companyId }, orderBy: { createdAt: "asc" } });
    res.json({
      members: members.map((m) => ({ id: m.id, email: m.email, name: m.name, role: m.role, accepted: Boolean(m.passwordHash), createdAt: m.createdAt })),
    });
  });

  app.post("/api/team", requireAuth, requireOwner, async (req, res) => {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const name = String(req.body.name ?? "").trim();
    const role = String(req.body.role ?? "viewer");
    if (!isValidEmail(email)) return res.status(400).json({ error: "Enter a valid email." });
    if (!name || name.length > 120) return res.status(400).json({ error: "Enter the person's name." });
    if (!["manager", "viewer"].includes(role)) return res.status(400).json({ error: "Role must be manager or viewer." });

    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    if (!company) return res.status(401).json({ error: "Unauthorized" });
    const count = await prisma.teamMember.count({ where: { companyId: company.id } });
    const limit = Math.min(teamLimit(company, { isPrivate: IS_PRIVATE }), MAX_TEAM);
    if (count >= limit) {
      return res.status(402).json({
        code: "plan_limit",
        error: companyIsPaid(company)
          ? `You can invite up to ${MAX_TEAM} team members.`
          : `The free plan includes ${limit} team member${limit === 1 ? "" : "s"}. Upgrade to FleetGuard for more.`,
      });
    }
    const [takenCompany, takenMember] = await Promise.all([
      prisma.company.findUnique({ where: { email } }),
      prisma.teamMember.findUnique({ where: { email } }),
    ]);
    if (takenCompany || takenMember) return res.status(400).json({ error: "That email already has an account." });

    const member = await prisma.teamMember.create({ data: { companyId: company.id, email, name, role } });
    let emailSent = true;
    try {
      await sendInvite(company, member);
    } catch (err) {
      emailSent = false;
      console.error("[team] invitation email failed:", err?.message ?? err);
    }
    return res.status(201).json({
      member: { id: member.id, email: member.email, name: member.name, role: member.role, accepted: false },
      emailSent,
    });
  });

  app.post("/api/team/:id/resend", requireAuth, requireOwner, limiters.reset, async (req, res) => {
    const member = await prisma.teamMember.findFirst({ where: { id: req.params.id, companyId: req.companyId } });
    if (!member) return res.status(404).json({ error: "Not found" });
    if (member.passwordHash) return res.status(400).json({ error: "This person already accepted the invitation." });
    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    try {
      await sendInvite(company, member);
      return res.json({ ok: true });
    } catch (err) {
      console.error("[team] resend failed:", err?.message ?? err);
      return res.status(502).json({ error: "We couldn't send the email. Try again in a few minutes." });
    }
  });

  app.patch("/api/team/:id", requireAuth, requireOwner, async (req, res) => {
    const role = String(req.body.role ?? "");
    if (!["manager", "viewer"].includes(role)) return res.status(400).json({ error: "Role must be manager or viewer." });
    const { count } = await prisma.teamMember.updateMany({ where: { id: req.params.id, companyId: req.companyId }, data: { role } });
    if (!count) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  });

  app.delete("/api/team/:id", requireAuth, requireOwner, async (req, res) => {
    const { count } = await prisma.teamMember.deleteMany({ where: { id: req.params.id, companyId: req.companyId } });
    if (!count) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  });

  // ---------- Billing (read only; changes happen in the Lemon Squeezy portal) ----------
  app.get("/api/billing", requireAuth, requireOwner, async (req, res) => {
    const company = await prisma.company.findUnique({ where: { id: req.companyId } });
    if (!company) return res.status(401).json({ error: "Unauthorized" });
    return res.json({
      plan: companyIsPaid(company) ? "pro" : "free",
      status: company.subscriptionStatus,
      renewsAt: company.planRenewsAt,
      endsAt: company.planEndsAt,
      portalUrl: company.lsPortalUrl,
      privateInstall: IS_PRIVATE,
    });
  });

  // ---------- USDOT lookup (used by the sign-up form) ----------
  app.get("/api/dot/:usdot", limiters.dot, async (req, res) => {
    try {
      const carrier = await lookupCarrier(req.params.usdot);
      if (!carrier) return res.status(404).json({ error: "We couldn't find that USDOT number." });
      return res.json({ carrier });
    } catch (err) {
      if (err instanceof DotLookupError) {
        const status = err.code === "bad_usdot" ? 400 : err.code === "not_configured" ? 503 : 502;
        return res.status(status).json({ error: err.message, code: err.code });
      }
      console.error("[dot]", err?.message ?? err);
      return res.status(500).json({ error: "Server error" });
    }
  });
}
