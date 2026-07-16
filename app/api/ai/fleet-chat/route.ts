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

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
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
      ],
    });

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content ?? "",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
