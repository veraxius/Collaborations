"use client";

import { useActionState } from "react";
import {
  submitContactForm,
  type ContactFormState,
} from "@/app/(marketing)/contact/actions";
import { SUPPORT_EMAIL } from "@/components/marketing/config";

const FLEET_SIZE_OPTIONS = [
  "1–5 trucks",
  "6–15 trucks",
  "16–50 trucks",
  "51–100 trucks",
  "More than 100 trucks",
];

const initialState: ContactFormState = { status: "idle" };

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1.5 text-sm text-alert-red">{error}</p>;
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialState
  );

  if (state.status === "success") {
    return (
      <div className="mk-card p-8" role="status">
        <p className="font-condensed text-2xl font-semibold text-compliance-green">
          Message sent.
        </p>
        <p className="mt-2 text-asphalt/80">
          We&apos;ll get back to you within one business day.
        </p>
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="mk-card space-y-5 p-8" noValidate>
      {state.status === "error" && !state.fieldErrors && (
        <p
          role="alert"
          className="rounded-[14px] border border-alert-red/30 bg-alert-red/5 px-4 py-3 text-sm text-alert-red"
        >
          {state.message ??
            (SUPPORT_EMAIL ? (
              <>
                Something went wrong and your message wasn&apos;t sent. Please
                try again, or email us directly at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                  {SUPPORT_EMAIL}
                </a>
                .
              </>
            ) : (
              <>
                Something went wrong and your message wasn&apos;t sent. Please
                try again.
              </>
            ))}
        </p>
      )}

      {/* Honeypot — hidden from real users, tempting to bots */}
      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="contact-name" className="mk-label">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="mk-input"
          aria-invalid={Boolean(errors.name)}
        />
        <FieldError error={errors.name} />
      </div>

      <div>
        <label htmlFor="contact-email" className="mk-label">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mk-input"
          aria-invalid={Boolean(errors.email)}
        />
        <FieldError error={errors.email} />
      </div>

      <div>
        <label htmlFor="contact-company" className="mk-label">
          Company <span className="font-normal text-asphalt/50">(optional)</span>
        </label>
        <input
          id="contact-company"
          name="company"
          type="text"
          autoComplete="organization"
          className="mk-input"
        />
      </div>

      <div>
        <label htmlFor="contact-fleet-size" className="mk-label">
          Fleet size
        </label>
        <select
          id="contact-fleet-size"
          name="fleetSize"
          required
          defaultValue=""
          className="mk-input"
          aria-invalid={Boolean(errors.fleetSize)}
        >
          <option value="" disabled>
            Select fleet size
          </option>
          {FLEET_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FieldError error={errors.fleetSize} />
      </div>

      <div>
        <label htmlFor="contact-message" className="mk-label">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className="mk-input resize-y"
          aria-invalid={Boolean(errors.message)}
        />
        <FieldError error={errors.message} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mk-btn mk-btn-primary w-full disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
