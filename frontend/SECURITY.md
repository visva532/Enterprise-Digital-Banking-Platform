# Security notes

Audit date: 2026-10-19. Scope: this repository, which is a static React front-end. It has no server code, no database, no API keys and no forms that send data anywhere.

## Done in this repository

| Area | Result |
| --- | --- |
| Dependencies | `npm audit` reported 4 issues (vite and esbuild, react-router). Upgraded to vite 8, plugin-react 6 and react-router-dom 7. Now 0 vulnerabilities. Node 20.19 or newer is required (set in `package.json` engines). |
| Secrets in code | None found in `src`, `public`, config files or the built bundle. The few matches for words like "token" are page copy. |
| Environment variables | None are used. `npm run prelaunch` fails if any `VITE_` variable with KEY, SECRET, TOKEN, PASSWORD or PRIVATE in its name is added, because every `VITE_` value ships to the browser. |
| Exposed files | `.gitignore` now excludes `.env*`, keys and logs. Source maps are off. Prelaunch fails if a `.env` file, `.map` file or secret pattern appears in the project or `dist/`. |
| Security headers | `public/_headers`: strict Content Security Policy (scripts, styles, fonts, images and connections from our own origin only), HSTS, nosniff, frame blocking, referrer policy, permissions policy, cross-origin isolation. Tested in a real browser across all pages and interactions with zero violations. One bug found and fixed: small fonts were inlined as data URIs and blocked by the policy, so inlining is now off in `vite.config.js`. |
| Debug mode | Production build contains no `console` calls or `debugger` statements and no dev tooling. |
| Unneeded code | No unused dependencies. Only 3 runtime packages. No third party scripts, fonts or trackers. |
| Open redirects | All internal links are fixed paths. The one external link, the sign-in URL, comes from `src/config.js`, must be https, and is checked by prelaunch. |
| Passwords | The front-end never asks for or handles a password. Sign in is handed to Keycloak. |
| XSS | No `dangerouslySetInnerHTML`, `eval` or HTML built from strings. React escapes all output. |

## Not applicable here, and what to do on the backend

These items need server code, which is not in this repository. Nothing was faked. When the Spring Boot services exist, check them against this list.

- **Authentication and authorisation.** Validate the Keycloak JWT in the gateway and again in each service. Check the role on every endpoint (`@PreAuthorize`), and check ownership on every object, so a customer can only read their own accounts. Hiding a button in the UI does not protect anything.
- **Rate limiting.** Spring Cloud Gateway has a Redis rate limiter. Use tight limits on login, transfers and KYC uploads, and add Keycloak brute force protection.
- **Input validation.** Use Bean Validation on every request DTO, parameterised queries only (no string-built SQL), file type and size limits on KYC uploads, and amounts as `BigDecimal`.
- **API endpoints.** HTTPS only, CORS limited to the exact site origin, no wildcard, short-lived access tokens, and idempotency keys on payment endpoints.
- **Database.** Private network only, a separate least-privilege user per service, no superuser in application config, encrypted backups, and the audit table writable by insert only.
- **Passwords.** Keycloak hashes them (PBKDF2 or argon2 per realm policy). Do not store passwords in your own tables.
- **Secrets.** Keep them in Kubernetes Secrets or a vault, never in the repository or the image.
- **Debug mode.** Set `spring.profiles.active=prod`, expose only `health` from Actuator, and turn off stack traces in error responses.
- **Cost settings.** Not applicable to a static site. When you choose a host or cloud, set a budget alert and a spending cap on day one.

## When the front-end gets connected

- Add the API and Keycloak origins to `connect-src` in `public/_headers`, and to `form-action` if a form posts to them.
- The liveness check will need the camera. Change `camera=()` to `camera=(self)` in the Permissions-Policy line.
- Re-run the browser test. Any new origin you forget will show up as a blocked request.

## Things only you can do

1. **Git history.** This folder is not a git repository, so there was no history to check. Once it is one, run `gitleaks detect` (or `trufflehog git file://.`) on the full history before the first push to a public host. If any real secret was ever committed, rotate it. Deleting the file is not enough.
2. **Deploy over HTTPS only** and confirm the headers arrive: `curl -I https://your-domain/`. `_headers` is read by Netlify and Cloudflare Pages. On nginx or another host, copy the same values into the server config.
3. **Run `npm run build && npm run prelaunch`** before every release.
4. This audit covers what is in the repository. It is not a penetration test, and the finished system should get one before real customer money moves through it.
