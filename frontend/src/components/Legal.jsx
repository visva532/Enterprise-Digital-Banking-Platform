import PageHead from "./PageHead.jsx";
import { site } from "../config.js";

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function Legal({ title, lead, sections }) {
  const date = formatDate(site.effectiveDate);
  return (
    <>
      <PageHead title={title} lead={lead} />
      <div className="container">
        <article className="prose">
          {date && <p className="meta">Effective {date}</p>}
          <nav className="toc" aria-label="On this page">
            <strong>On this page</strong>
            <ol>
              {sections.map((s, i) => (
                <li key={s.h}><a href={`#s${i + 1}`}>{s.h}</a></li>
              ))}
            </ol>
          </nav>
          {sections.map((s, i) => (
            <section key={s.h} id={`s${i + 1}`}>
              <h2>{s.h}</h2>
              {s.p?.map((t) => <p key={t}>{t}</p>)}
              {s.l && <ul>{s.l.map((t) => <li key={t}>{t}</li>)}</ul>}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
