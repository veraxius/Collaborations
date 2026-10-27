import jwt from "jsonwebtoken";
import { fingerprint } from "./tokens.js";

/**
 * Session tokens. The payload carries the company, the role and a fingerprint
 * of the password hash: changing or resetting a password signs out every
 * session of that user. Team members are re-checked in the database on every
 * request, so removing a member or changing a role takes effect immediately.
 */
export function signToken(company, member = null) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign(
    {
      companyId: company.id,
      email: member ? member.email : company.email,
      role: member ? member.role : "owner",
      memberId: member ? member.id : undefined,
      pv: fingerprint(member ? member.passwordHash : company.passwordHash),
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

/** Build the auth middleware around a Prisma client (injected so it can be tested). */
export function makeRequireAuth(prisma) {
  return async function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!payload?.companyId || !payload.pv) return res.status(401).json({ error: "Unauthorized" });

    try {
      if (payload.memberId) {
        const member = await prisma.teamMember.findUnique({ where: { id: payload.memberId } });
        if (
          !member ||
          member.companyId !== payload.companyId ||
          !member.passwordHash ||
          fingerprint(member.passwordHash) !== payload.pv
        ) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        req.role = member.role;
        req.email = member.email;
        req.userName = member.name;
        req.memberId = member.id;
      } else {
        const company = await prisma.company.findUnique({
          where: { id: payload.companyId },
          select: { id: true, email: true, name: true, passwordHash: true },
        });
        if (!company || fingerprint(company.passwordHash) !== payload.pv) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        req.role = "owner";
        req.email = company.email;
        req.userName = company.name;
      }
      req.companyId = payload.companyId;
      return next();
    } catch (err) {
      console.error("[auth]", err);
      return res.status(500).json({ error: "Server error" });
    }
  };
}

/** Viewers are read-only. */
export function requireWrite(req, res, next) {
  if (req.role === "viewer") return res.status(403).json({ error: "Your role is read-only." });
  return next();
}

/** Only the account owner (billing, team, company settings). */
export function requireOwner(req, res, next) {
  if (req.role !== "owner") return res.status(403).json({ error: "Only the account owner can do this." });
  return next();
}
