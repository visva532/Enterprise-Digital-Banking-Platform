import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

const stages = [
  { t: "Customer request", d: "The web client sends the action, such as a transfer, together with the signed-in user's token." },
  { t: "API gateway", d: "The gateway checks the token with Keycloak, applies the user's role and rate limits, then routes the call to the right service." },
  { t: "Kafka event", d: "The action is published as an event so services react in a fixed order and nothing is lost if one of them is busy." },
  { t: "Service processing", d: "Account, Loan, Payment or Customer Service picks up the event and applies its business rules." },
  { t: "PostgreSQL write", d: "The result is saved in one database transaction, so a change is either fully applied or not applied at all." },
  { t: "Redis cache update", d: "The cached balance is refreshed so the next read is fast and matches what the database holds." },
  { t: "Response and audit", d: "The customer receives the outcome and an append-only audit entry is written for the action." },
];

export default function Pipeline() {
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setInterval(() => {
      setActive((a) => {
        if (a >= stages.length - 1) {
          setRunning(false);
          return a;
        }
        return a + 1;
      });
    }, 1100);
    return () => clearInterval(timer.current);
  }, [running]);

  const run = () => {
    setActive(0);
    setRunning(true);
  };

  return (
    <div className="panel pipe">
      <div className="pipe-top">
        <h2>How a request travels</h2>
        <button type="button" className="btn btn-quiet" onClick={run} disabled={running}>
          <Icon name={active === stages.length - 1 && !running ? "replay" : "play"} size={16} />
          {running ? "Running" : active === stages.length - 1 ? "Run again" : "Follow a request"}
        </button>
      </div>
      <div className="pipe-list" style={{ "--i": active }}>
        <div className="pipe-rail" aria-hidden="true" />
        <div className="pipe-dot" aria-hidden="true" />
        {stages.map((s, i) => (
          <button
            key={s.t}
            type="button"
            className={`pipe-row ${i === active ? "is-active" : ""}`}
            aria-current={i === active ? "step" : undefined}
            onClick={() => {
              setRunning(false);
              setActive(i);
            }}
          >
            <span className="n">{i + 1}</span>
            <span className="t">{s.t}</span>
          </button>
        ))}
      </div>
      <p className="pipe-detail" aria-live="polite">
        <strong>{stages[active].t}</strong>
        {stages[active].d}
      </p>
    </div>
  );
}
