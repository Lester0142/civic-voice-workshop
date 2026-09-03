import { useState } from "react";
import { submitFeedback } from "../api";

const MAX_FEEDBACK_LENGTH = 500;

export function CitizenPage({ user }) {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (message.length > MAX_FEEDBACK_LENGTH) {
      setError(`Feedback must be ${MAX_FEEDBACK_LENGTH} characters or fewer.`);
      return;
    }
    try {
      await submitFeedback({ nric: user.nric, name: user.name, message });
      setSubmitted(true);
      setMessage("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleSubmitAnother() {
    setSubmitted(false);
    setError("");
    setMessage("");
  }

  return (
    <main className="page-shell">
      <div className="page-heading">
        <div className="eyebrow">Public feedback</div>
        <h1>What would you like us to know?</h1>
        <p>Tell us about an issue, an idea, or a positive experience in your community.</p>
      </div>
      <section className="form-card">
        {submitted ? (
          <div className="success-panel">
            <div className="success-banner">Thank you. Your feedback has been received.</div>
            <p className="muted">Would you like to share another item?</p>
            <button className="primary-button" type="button" onClick={handleSubmitAnother}>Submit another feedback</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Your feedback
              <textarea
                rows="7"
                value={message}
                maxLength={MAX_FEEDBACK_LENGTH}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Share your feedback here..."
                aria-describedby="feedback-character-count"
              />
            </label>
            <div className="form-footer">
              <div>
                <div id="feedback-character-count" className="character-count">
                  {message.length} / {MAX_FEEDBACK_LENGTH} characters
                </div>
                <span className="muted">Please do not include sensitive personal information.</span>
              </div>
              <button className="primary-button">Submit feedback</button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
