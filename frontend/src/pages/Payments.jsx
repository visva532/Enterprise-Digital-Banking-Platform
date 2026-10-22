import { useEffect, useRef, useState } from "react";
import PageHead from "../components/PageHead.jsx";
import Icon from "../components/Icon.jsx";
import { StepList } from "../components/Stepper.jsx";

const rails = [
  { id: "imps", name: "IMPS", text: "Immediate Payment Service. Money reaches the beneficiary within seconds, at any hour, including weekends.", fits: ["Urgent transfers", "Payments outside banking hours"] },
  { id: "neft", name: "NEFT", text: "National Electronic Funds Transfer. Payments are grouped and settled in batches through the day.", fits: ["Routine transfers", "Payments that are not time critical"] },
  { id: "upi", name: "UPI", text: "Unified Payments Interface. The sender pays to a virtual payment address instead of typing full account details.", fits: ["Everyday payments from a phone", "Paying someone who shared an address"] },
];

const steps = [
  { name: "Fraud check", sub: "The Fraud Service scores the transfer as pass or block." },
  { name: "Debit source account", sub: "Balance is checked and the debit is committed in one transaction." },
  { name: "Send to payment network", sub: "The IMPS, NEFT or UPI instruction is sent and a PaymentInitiated event is published." },
  { name: "Credit and settle", sub: "The network confirms with a reference number and the beneficiary is credited." },
  { name: "Notify the customer", sub: "A PaymentCompleted event triggers an SMS or email, and an audit record is written." },
];

const scenarios = [
  { id: "ok", label: "Transfer succeeds" },
  { id: "net", label: "Network fails after debit" },
  { id: "fraud", label: "Fraud check blocks it" },
];

function frames(kind) {
  const idle = ["idle", "idle", "idle", "idle", "idle"];
  const f = [];
  const push = (arr, msg, tone = "") => f.push({ status: [...arr], msg, tone });
  let s = [...idle];
  if (kind === "fraud") {
    s[0] = "active"; push(s, "Scoring the transfer.");
    s[0] = "failed"; push(s, "Blocked by the fraud check. Nothing was debited, so there is nothing to reverse.", "bad");
    return f;
  }
  for (let i = 0; i < 5; i++) {
    if (kind === "net" && i === 3) {
      s[3] = "active"; push(s, "Waiting for the payment network.");
      s[3] = "failed"; push(s, "The network did not confirm in time. The debit already happened, so the saga must undo it.", "bad");
      s[1] = "comp"; push(s, "Compensation: the debit is refunded and a PaymentFailed event is published. The customer is told the transfer failed.", "warn");
      return f;
    }
    s[i] = "active"; push(s, steps[i].name + ".");
    s[i] = "done"; push(s, steps[i].name + " complete.");
  }
  push(s, "Transfer complete. The customer gets a receipt and the audit log has the full record.", "ok");
  return f;
}

export default function Payments() {
  const [rail, setRail] = useState("imps");
  const [scn, setScn] = useState("ok");
  const [frame, setFrame] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);
  const list = frames(scn);
  const cur = frame >= 0 ? list[Math.min(frame, list.length - 1)] : null;

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setInterval(() => {
      setFrame((f) => {
        if (f >= list.length - 1) {
          setPlaying(false);
          return f;
        }
        return f + 1;
      });
    }, 850);
    return () => clearInterval(timer.current);
  }, [playing, scn]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (id) => {
    setScn(id);
    setFrame(-1);
    setPlaying(false);
  };
  const run = () => {
    setFrame(0);
    setPlaying(true);
  };
  const r = rails.find((x) => x.id === rail);

  return (
    <>
      <PageHead
        title="Payments"
        lead="A transfer is a chain of steps across services. If a later step fails, earlier steps are undone so the customer is never left short."
      />

      <section className="block">
        <div className="container">
          <div className="block-head"><h2>Choose a payment rail</h2></div>
          <div className="tabs" role="tablist" aria-label="Payment rails">
            {rails.map((x) => (
              <button key={x.id} role="tab" type="button" className="tab" aria-selected={rail === x.id} onClick={() => setRail(x.id)}>
                {x.name}
              </button>
            ))}
          </div>
          <div className="panel detail" role="tabpanel" style={{ maxWidth: 720 }}>
            <h3>{r.name}</h3>
            <p>{r.text}</p>
            <ul>
              {r.fits.map((f) => (
                <li key={f}><Icon name="check" size={18} /><span>{f}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <div className="block-head">
            <h2>Walk through a transfer</h2>
            <p>This is a walkthrough of the saga, not a live payment. Choose an outcome and run it.</p>
          </div>
          <div className="controls">
            <div className="tabs" style={{ margin: 0 }} role="group" aria-label="Outcome">
              {scenarios.map((x) => (
                <button key={x.id} type="button" className="tab" aria-pressed={scn === x.id} onClick={() => pick(x.id)}>
                  {x.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-primary" onClick={run} disabled={playing}>
              <Icon name={frame >= 0 && !playing ? "replay" : "play"} size={16} />
              {playing ? "Running" : frame >= 0 ? "Run again" : "Run transfer"}
            </button>
          </div>
          <div className="two-col">
            <StepList steps={steps} status={cur ? cur.status : []} />
            <div>
              <p className={`status-line ${cur?.tone === "ok" ? "ok" : cur?.tone === "bad" ? "bad" : ""}`} aria-live="polite">
                {cur ? cur.msg : "Press Run transfer to start."}
              </p>
              <p className="note">
                Each step is a separate service call or Kafka event. Because a bank cannot lock every service at once, the saga pattern pairs each step with an undo action instead.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
