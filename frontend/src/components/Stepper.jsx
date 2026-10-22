import Icon from "./Icon.jsx";

// Shared run-through for saga style walkthroughs.
export function StepList({ steps, status }) {
  return (
    <ol className="steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {steps.map((s, i) => {
        const st = status[i] || "idle";
        const label = {
          idle: "",
          active: "Running",
          done: "Done",
          failed: "Failed",
          comp: "Reversed",
        }[st];
        return (
          <li key={s.name} className={`step ${st === "idle" ? "" : `is-${st}`}`}>
            <span className="mark" aria-hidden="true">{st === "done" ? <Icon name="check" size={16} /> : st === "failed" ? <Icon name="x" size={16} /> : st === "comp" ? <Icon name="undo" size={16} /> : i + 1}</span>
            <span className="what">
              {s.name}
              <span className="sub">{s.sub}</span>
            </span>
            {label && <span className={`tag ${st === "failed" ? "bad" : st === "comp" ? "warn" : ""}`}>{label}</span>}
          </li>
        );
      })}
    </ol>
  );
}
