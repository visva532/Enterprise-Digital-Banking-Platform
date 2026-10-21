import { Link } from "react-router-dom";
import { useEffect } from "react";
import { site } from "../config.js";

export default function NotFound() {
  useEffect(() => { document.title = `Page not found | ${site.name}`; }, []);
  return (
    <section className="not-found">
      <div className="container">
        <h1>Page not found</h1>
        <p>The address may be mistyped or the page may have moved. Go back to the start or pick a section from the menu.</p>
        <Link className="btn btn-primary" to="/">Back to home</Link>
      </div>
    </section>
  );
}
