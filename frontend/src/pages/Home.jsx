import { Link } from "react-router-dom";
import { useEffect } from "react";
import Icon from "../components/Icon.jsx";

import { sections } from "../components/Layout.jsx";
import { site } from "../config.js";

export default function Home() {
  useEffect(() => {
    document.title = `${site.name} | Digital banking platform`;
  }, []);
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>Accounts, payments, loans and KYC on one platform.</h1>
            <p className="lead">
              FinCore Nexus connects customer onboarding, everyday accounts, money transfers and lending. Every action is checked, recorded and traceable.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/payments">
                See how a transfer works
                <Icon name="arrow" size={18} />
              </Link>
              
            </div>
          </div>
          
        </div>
      </section>

      <section className="block">
        <div className="container">
          <div className="block-head">
            <h2>Explore the platform</h2>
            <p>Each area has a working walkthrough. Pick one to see how it behaves.</p>
          </div>
          <nav className="rows" aria-label="Platform areas">
            {sections.map((s) => (
              <Link key={s.to} to={s.to} className="row-link">
                <span className="ico"><Icon name={s.icon} /></span>
                <span className="name">{s.label}</span>
                <span className="desc">{s.blurb}</span>
                <Icon name="arrow" className="go"/>
              </Link>
            ))}
          </nav>
        </div>
      </section>
    </>
  );
}
