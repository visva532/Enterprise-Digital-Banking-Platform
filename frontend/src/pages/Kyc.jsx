import { useState } from "react";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";

const steps = [
  { t: "Upload documents", text: "The customer uploads identity documents, for example Aadhaar and PAN. The file is stored and the case moves to Documents uploaded.", ok: "Moves to OCR.", bad: "Unreadable files are returned to the customer to upload again." },
  { t: "Read the documents", text: "OCR reads the name, number and date of birth from each document and compares them with what the customer entered.", ok: "A match moves the case to OCR verified.", bad: "A mismatch rejects the case with the reason shown." },
  { t: "Match the face", text: "A selfie is compared with the photo on the identity document and given a similarity score.", ok: "A score at or above the threshold passes.", bad: "A score below the threshold fails the face check." },
  { t: "Check liveness", text: "The system confirms a real person is in front of the camera, not a photo or a recording.", ok: "A live person passes.", bad: "A failed check stops the case." },
  { t: "Assess risk", text: "The case is given a risk level using the checks so far and compliance rules.", ok: "Low risk is verified automatically.", bad: "Medium or high risk goes to a person for manual review, who can approve or reject." },
  { t: "Record the decision", text: "The outcome, the scores and who or what decided are written to the audit log. The customer's KYC status updates, which lets their account become active.", ok: "Verified.", bad: "The log entry cannot be edited afterwards." },
];

export default function Kyc() {
  const [i, setI] = useState(0);
  const s = steps[i];
  const pct = ((i + 1) / steps.length) * 100;
  return (
    <>
      <PageHead
        title="KYC"
        lead="Know your customer checks run in a fixed order. Step through them to see what passes, what fails and what needs a person."
      />
      <section className="block">
        <div className="container">
          <div className="two-col">
            <div>
              <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1} aria-label="KYC progress">
                <span style={{ width: `${pct}%` }} />
              </div>
              <ol className="steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {steps.map((x, k) => (
                  <li key={x.t}>
                    <button
                      type="button"
                      className={`step ${k < i ? "is-done" : k === i ? "is-active" : ""}`}
                      style={{ width: "100%", textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }}
                      aria-current={k === i ? "step" : undefined}
                      onClick={() => setI(k)}
                    >
                      <span className="mark" aria-hidden="true">{k < i ? <Icon name="check" size={16} /> : k + 1}</span>
                      <span className="what">{x.t}</span>
                      <span />
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <div className="panel detail" aria-live="polite">
                <p className="tag" style={{ marginBottom: 10 }}>Step {i + 1} of {steps.length}</p>
                <h3>{s.t}</h3>
                <p>{s.text}</p>
                <ul>
                  <li><Icon name="check" size={18} /><span>{s.ok}</span></li>
                  <li><Icon name="alert" size={18} /><span>{s.bad}</span></li>
                </ul>
              </div>
              <div className="controls" style={{ marginTop: 16 }}>
                <button type="button" className="btn btn-quiet" onClick={() => setI((v) => Math.max(0, v - 1))} disabled={i === 0}>Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setI((v) => Math.min(steps.length - 1, v + 1))} disabled={i === steps.length - 1}>
                  Next step
                  <Icon name="arrow" size={16} />
                </button>
                {i > 0 && <button type="button" className="btn btn-quiet" onClick={() => setI(0)}>Start over</button>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
