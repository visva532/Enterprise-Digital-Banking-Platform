# FinCore Nexus web

React 18, React Router and Vite. Fonts are bundled, so no third party requests are made.

    npm install
    npm run dev        # local development
    npm run build      # production build in dist/
    npm run prelaunch  # blocks launch until the checklist below is complete

## Launch checklist

1. Fill every value in `src/config.js` (legal name, domain, contact email, effective date, governing law, Keycloak login URL).
2. Have a lawyer review `src/pages/Privacy.jsx` and `src/pages/Terms.jsx`. They are drafts that match what the site does today.
3. Deploy `dist/` to a host that serves `index.html` for unknown paths (`public/_redirects` covers Netlify and Cloudflare Pages). Add your domain in the host's dashboard, then create the DNS record it shows you (CNAME for a subdomain, A or ALIAS for the root).
4. Run `npm run build && npm run prelaunch`. It must print "Pre-launch checks passed."

Security notes and the backend checklist are in `SECURITY.md`. Node 20.19 or newer is required.

Favicon files are in `public/`. The site carries no AI or builder badge, and the check script fails if one appears.
