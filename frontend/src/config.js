// Launch settings. Fill every empty value before going live.
// Run `npm run prelaunch` to see what is still missing.
export const site = {
  name: "FinCore Nexus",
  legalName: "FinCore Nexus", // registered company name, used in Privacy and Terms
  domain: "localhost:5173", // custom domain without protocol, for example "bank.yourcompany.com"
  contactEmail: "support@fincorenexus.com", // address for privacy and legal requests
  effectiveDate: "2026-10-21", // date the policies take effect, format YYYY-MM-DD
  governingLaw: "the laws of India", // for example "the laws of India"
  loginUrl: "", // Keycloak login URL. Leave empty until the auth service is live.
  currency: "INR",
  locale: "en-IN",
};
