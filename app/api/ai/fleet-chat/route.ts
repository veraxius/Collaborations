import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type Doc = {
  id: string;
  title: string;
  type: string;
  referenceNumber?: string | null;
  issuer?: string | null;
  issuedAt?: string | null;
  expiresAt: string;
  cost?: number | null;
  currency?: string;
  notes?: string | null;
  fileName?: string | null;
  vehicle?: { name: string; plate: string; make?: string | null; model?: string | null } | null;
  driver?: { name: string; licenseNumber?: string | null } | null;
};

type DashboardData = {
  counts: { expired: number; expiring: number; ok: number };
  score: number;
  vehicleCount: number;
  driverCount: number;
  documents: Doc[];
};

const HOURLY_LIMIT = 40;
const usage = new Map<string, number[]>();

function allowRequest(companyId: string): boolean {
  const now = Date.now();
  const recent = (usage.get(companyId) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= HOURLY_LIMIT) {
    usage.set(companyId, recent);
    return false;
  }
  recent.push(now);
  usage.set(companyId, recent);
  return true;
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

/**
 * Models to try, in order. Groq retires models from time to time, so the
 * first one that works is remembered and the others are only tried when a
 * model is reported as missing. Set GROQ_MODEL to force a specific one.
 */
const MODELS = [process.env.GROQ_MODEL, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"].filter(
  (m): m is string => Boolean(m)
);
let workingModel: string | null = null;

function isModelUnavailable(err: unknown): boolean {
  const e = err as { status?: number; message?: string } | null;
  return e?.status === 404 || /model_not_found|model_decommissioned|decommissioned|does not exist/i.test(e?.message ?? "");
}

async function completeWithFallback(groq: Groq, messages: Msg[]): Promise<string> {
  const order = workingModel ? [workingModel, ...MODELS.filter((m) => m !== workingModel)] : MODELS;
  let lastError: unknown;
  for (const model of order) {
    try {
      // gpt-oss models "think" before answering: keep that short so replies stay fast.
      const params = {
        model,
        messages,
        temperature: 0.3,
        max_completion_tokens: 2048,
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
      };
      const completion = await groq.chat.completions.create(params as unknown as Parameters<typeof groq.chat.completions.create>[0]);
      const text = (completion as { choices: { message?: { content?: string | null } }[] }).choices[0]?.message?.content ?? "";
      workingModel = model;
      // Some models return their reasoning inline: never show it to the customer.
      return text
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .replace(/[   ]/g, " ") // non-breaking spaces some models emit
        .replace(/[‐‑‒]/g, "-") // non-breaking hyphens
        .trim();
    } catch (err) {
      lastError = err;
      if (!isModelUnavailable(err)) throw err; // a real problem: do not hide it behind a retry
      if (model === workingModel) workingModel = null;
    }
  }
  throw lastError ?? new Error("No AI model is available");
}

function getBackendBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
}

/** Compact, token-friendly snapshot of every document the company has. */
function describeDocuments(docs: Doc[]): string {
  if (docs.length === 0) return "The company has no documents loaded yet.";
  const today = new Date();
  return docs
    .map((d) => {
      const expires = new Date(d.expiresAt);
      const days = Math.ceil((expires.getTime() - today.getTime()) / 86_400_000);
      const status = days < 0 ? `EXPIRED ${-days}d ago` : `expires in ${days}d`;
      const parts = [
        `- "${d.title}" [${d.type}] ${status} (${d.expiresAt.slice(0, 10)})`,
        d.vehicle ? `vehicle: ${d.vehicle.name} plate ${d.vehicle.plate}` : null,
        d.driver ? `driver: ${d.driver.name}${d.driver.licenseNumber ? ` lic ${d.driver.licenseNumber}` : ""}` : null,
        d.issuer ? `issuer: ${d.issuer}` : null,
        d.referenceNumber ? `ref: ${d.referenceNumber}` : null,
        d.issuedAt ? `issued: ${d.issuedAt.slice(0, 10)}` : null,
        d.cost != null ? `cost: ${d.cost} ${d.currency || "USD"}` : null,
        d.fileName ? "has attached file" : "no file attached",
        d.notes ? `notes: ${d.notes}` : null,
      ].filter(Boolean);
      return parts.join(" | ");
    })
    .join("\n");
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }

    // Reuse the FleetGuard JWT the browser already has: forward it to the
    // Express backend so the chat only ever sees this company's data.
    const auth = request.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      message?: string;
      history?: ChatMessage[];
    };
    const message = body.message?.trim();
    const history = (body.history ?? []).slice(-12);

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    // AI assistant is a Fleet-plan feature; also cap usage to protect the API budget.
    const meRes = await fetch(`${getBackendBase()}/api/me`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (meRes.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = meRes.ok ? ((await meRes.json()) as { company?: { id: string; plan?: string } }) : null;
    if (!me?.company) {
      return NextResponse.json({ error: "Could not verify your account" }, { status: 502 });
    }
    if (me.company.plan !== "pro") {
      return NextResponse.json(
        { error: "The AI assistant is included in the Fleet plan. Upgrade to use it." },
        { status: 402 }
      );
    }
    if (!allowRequest(me.company.id)) {
      return NextResponse.json(
        { error: "You've reached the hourly limit for the assistant. Try again soon." },
        { status: 429 }
      );
    }

    const dashRes = await fetch(`${getBackendBase()}/api/dashboard`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
    if (dashRes.status === 401) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!dashRes.ok) {
      return NextResponse.json(
        { error: "Could not load fleet data" },
        { status: 502 }
      );
    }
    const dash = (await dashRes.json()) as DashboardData;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const reply = await completeWithFallback(groq, [
        {
          role: "system",
          content: `You are FleetGuard AI, the compliance assistant built into the FleetGuard dashboard. You answer questions about the company's fleet documents: insurance policies, inspections, licenses, permits, their expiry dates, costs, issuers, vehicles and drivers.

TODAY: ${new Date().toISOString().slice(0, 10)}

FLEET SUMMARY:
- Fleet health score: ${dash.score}/100
- ${dash.counts.expired} expired, ${dash.counts.expiring} expiring within 30 days, ${dash.counts.ok} up to date
- ${dash.vehicleCount} vehicles, ${dash.driverCount} drivers, ${dash.documents.length} documents

ALL DOCUMENTS (complete list, one per line):
${describeDocuments(dash.documents)}

RULES:
- Answer ONLY with information from the data above. If something isn't there, say you don't have that data — never invent documents, dates or amounts.
- Be concise and concrete: cite document titles, dates and amounts exactly as they appear.
- When asked about totals or counts, compute them from the list.
- If the user asks about a document's file contents (the attached PDF/photo), explain that you can see its registered data (dates, cost, issuer, reference, notes) but not read inside the attached file.
- Always reply in English.
- Plain text only, no markdown headers. Short lists with "-" are fine.`,
        },
        ...history,
        { role: "user", content: message },
    ]);

    return NextResponse.json({ reply });
  } catch (error) {
    // The provider's raw error can name models and accounts: log it, show something friendly.
    console.error("[fleet-chat]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please try again in a moment." },
      { status: 502 }
    );
  }
}
