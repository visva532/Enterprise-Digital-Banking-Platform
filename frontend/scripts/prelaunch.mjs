// Run with: npm run prelaunch   (after `npm run build`)
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { site } from "../src/config.js";

const problems = [];
const need = (key, why) => {
  if (!String(site[key] ?? "").trim()) problems.push(`config: "${key}" is empty (${why})`);
};
need("legalName", "shown in Privacy, Terms and the footer");
need("domain", "your custom domain, used for canonical tags");
need("contactEmail", "privacy and legal contact");
need("effectiveDate", "policy effective date, YYYY-MM-DD");
need("governingLaw", "used in Terms");
need("loginUrl", "Keycloak login address for the Sign in page");
if (site.domain && /^https?:\/\//.test(site.domain)) problems.push('config: "domain" must not include http(s)://');

for (const f of ["public/favicon.svg", "public/apple-touch-icon.png"]) {
  if (!existsSync(f)) problems.push(`missing ${f}`);
}

// Scan source and build output for banned patterns.
const bad = [
  [/—/, "em dash"],
  [/–/, "en dash"],
  [/\p{Extended_Pictographic}/u, "emoji"],
  [/made with|built with (ai|claude)|generated (by|with) (ai|claude)|lovable|bolt\.new|v0\.dev|created with/i, "AI or builder tag"],
  [/linear-gradient|radial-gradient|conic-gradient/i, "gradient"],
];
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    statSync(p).isDirectory() ? walk(p, out) : /\.(jsx?|css|html|svg|txt)$/.test(n) && out.push(p);
  }
  return out;
};
for (const file of [...walk("src"), ...walk("public"), "index.html", ...walk("dist").filter((f) => !f.includes("fonts") && !/assets[\\/].*\.js$/.test(f))]) {
  const text = readFileSync(file, "utf8");
  for (const [re, name] of bad) if (re.test(text)) problems.push(`${file}: contains ${name}`);
}
// Security checks
if (site.loginUrl && !/^https:\/\//.test(site.loginUrl)) problems.push('config: "loginUrl" must start with https://');
if (!existsSync(".gitignore") || !/^\.env/m.test(readFileSync(".gitignore", "utf8"))) problems.push(".gitignore must ignore .env files");
if (!existsSync("public/_headers") || !/Content-Security-Policy/.test(readFileSync("public/_headers", "utf8"))) problems.push("public/_headers is missing or has no Content-Security-Policy");
for (const f of readdirSync(".")) if (/^\.env(\.|$)/.test(f) && f !== ".env.example") problems.push(`${f} exists in the project folder, make sure it is not committed or deployed`);

// Anything named VITE_ is bundled into public JavaScript. Never put secrets in one.
for (const file of walk("src")) {
  const t = readFileSync(file, "utf8");
  for (const m of t.matchAll(/import\.meta\.env\.(VITE_\w+)/g)) {
    if (/KEY|SECRET|TOKEN|PASSWORD|PRIVATE/i.test(m[1])) problems.push(`${file}: ${m[1]} would be public in the browser bundle`);
  }
}

// Secret patterns in the built output, including JavaScript bundles.
const secretPatterns = [
  [/AKIA[0-9A-Z]{16}/, "AWS access key"],
  [/sk-[A-Za-z0-9]{32,}/, "API secret key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/ghp_[A-Za-z0-9]{30,}/, "GitHub token"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/AIza[0-9A-Za-z_-]{35}/, "Google API key"],
];
const allDist = (d, out = []) => { if (!existsSync(d)) return out; for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? allDist(p, out) : out.push(p); } return out; };
for (const f of allDist("dist")) {
  if (f.endsWith(".map")) problems.push(`${f}: source maps must not be deployed`);
  if (/\.(woff2?|png|jpg|ico)$/.test(f)) continue;
  const t = readFileSync(f, "utf8");
  for (const [re, name] of secretPatterns) if (re.test(t)) problems.push(`${f}: looks like a ${name}`);
}

// Known vulnerabilities in dependencies.
try {
  execSync("npm audit --audit-level=moderate", { stdio: "pipe" });
} catch (e) {
  const out = String(e.stdout || "") + String(e.stderr || "");
  if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|audit endpoint/i.test(out)) console.log("Warning: could not reach the npm audit service, run `npm audit` yourself.");
  else problems.push("npm audit found vulnerabilities, run `npm audit` for details");
}

if (!existsSync("dist")) problems.push("dist/ not found, run `npm run build` first");

if (problems.length) {
  console.log("Not ready to launch:\n" + problems.map((p) => " - " + p).join("\n"));
  process.exit(1);
}
console.log("Pre-launch checks passed.");
