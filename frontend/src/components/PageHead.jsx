import { useEffect } from "react";
import { site } from "../config.js";

export default function PageHead({ title, lead, children }) {
  useEffect(() => {
    document.title = title ? `${title} | ${site.name}` : site.name;
  }, [title]);
  return (
    <section className="page-head">
      <div className="container">
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
