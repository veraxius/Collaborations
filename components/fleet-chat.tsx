"use client";

import { useEffect, useRef, useState } from "react";
import { getToken } from "@/lib/api";

type ChatMessage = { role: "user" | "assistant"; content: string };

const suggestions = [
  "What expires this month?",
  "Which documents are expired?",
  "How much will renewals cost?",
];

export function FleetChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: "user", content };
    const history = messages;
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/fleet-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() ?? ""}`,
        },
        body: JSON.stringify({ message: content, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "…" },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Put the question back so the user can retry without retyping.
      setMessages((prev) => prev.slice(0, -1));
      setInput(content);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const hasConversation = messages.length > 0;

  return (
    <section className="mb-10 w-full">
      <div className="rounded-3xl border border-neutral-200/70 bg-white/90 shadow-lift backdrop-blur-xl">
        {/* Conversation (only once it exists) */}
        {hasConversation && (
          <div
            ref={scrollRef}
            className="max-h-80 space-y-3 overflow-y-auto px-5 pb-2 pt-5"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-accent-500 text-white"
                      : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl bg-neutral-100 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:240ms]" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input row */}
        <div className={`flex items-end gap-2 p-3 ${hasConversation ? "pt-2" : ""}`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask FleetGuard AI about your documents…"
            className="max-h-28 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white transition hover:bg-accent-600 disabled:opacity-40"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 19V5m0 0-6 6m6-6 6 6"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Suggestions before first message */}
        {!hasConversation && (
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={loading}
                className="rounded-full bg-neutral-100/80 px-3.5 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-800 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="px-5 pb-3 text-xs text-red-500">
            {error} — try again.
          </p>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-neutral-400">
        FleetGuard AI answers from your loaded documents, vehicles and drivers.
      </p>
    </section>
  );
}
