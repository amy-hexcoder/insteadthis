"use client";

import { useState } from "react";

/**
 * Newsletter signup. Not connected to an email provider yet:
 * replace the body of `subscribe` with a call to your provider
 * (Buttondown, ConvertKit, Mailchimp, a route handler, etc.).
 */
async function subscribe(email: string): Promise<void> {
  void email;
  throw new Error("not-connected");
}

export function NewsletterForm({ idPrefix = "nl" }: { idPrefix?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  return (
    <form
      className="newsletter__form"
      onSubmit={async (e) => {
        e.preventDefault();
        const email = String(new FormData(e.currentTarget).get("email") || "");
        setState("sending");
        try {
          await subscribe(email);
          setState("done");
        } catch {
          setState("error");
        }
      }}
    >
      <label htmlFor={`${idPrefix}-email`}>Email address</label>
      <div className="newsletter__row">
        <input id={`${idPrefix}-email`} name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
        <button type="submit" className="button button--dark" disabled={state === "sending"}>
          {state === "sending" ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      <p className="newsletter__status" role="status">
        {state === "done" && "You're subscribed. See you Sunday."}
        {state === "error" && "Signups aren't open yet. Please check back soon."}
      </p>
    </form>
  );
}
