import { NewsletterForm } from "./NewsletterForm";

export function Newsletter() {
  return (
    <section id="newsletter" className="newsletter" aria-labelledby="newsletter-h">
      <div className="newsletter__copy">
        <h2 id="newsletter-h">One good idea in your inbox every Sunday</h2>
        <p>A short note with the week&apos;s best story and one small thing to try. Unsubscribe any time.</p>
      </div>
      <NewsletterForm />
    </section>
  );
}
