import { useEffect, useRef, useState } from "react";
import { submitFeedback } from "../api";

export function CitizenPage({ user }) {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef(null);
  const successRef = useRef(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitted(false);
    setIsSubmitting(true);
    try {
      await submitFeedback({ nric: user.nric, name: user.name, message });
      setSubmitted(true);
      setMessage("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-heading">
        <div className="eyebrow">Public feedback</div>
        <h1>What would you like us to know?</h1>
        <p>Tell us about an issue, an idea, or a positive experience in your community.</p>
      </div>
      <section className="form-card">
        {submitted && (
          <div ref={successRef} className="success-banner" role="status" aria-live="polite" tabIndex="-1">
            Thank you. Your feedback has been received.
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label htmlFor="feedback-message">Your feedback
            <textarea
              id="feedback-message"
              name="message"
              rows="7"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Share your feedback here..."
              aria-describedby={error ? "feedback-help feedback-error" : "feedback-help"}
              aria-invalid={Boolean(error)}
              required
            />
          </label>
          <div className="form-footer">
            <span id="feedback-help" className="muted">Please do not include sensitive personal information.</span>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting feedback…" : "Submit feedback"}
            </button>
          </div>
          {error && (
            <p ref={errorRef} id="feedback-error" className="error-message" role="alert" aria-live="assertive" tabIndex="-1">
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
