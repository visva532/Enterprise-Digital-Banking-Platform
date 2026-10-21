import Legal from "../components/Legal.jsx";
import { site } from "../config.js";

const who = site.legalName || site.name;
const contact = site.contactEmail
  ? [`Email ${site.contactEmail} with any question about this policy or to make a request about your data.`]
  : ["Contact details for privacy requests are published on this page."];

const sections = [
  { h: "Who this policy covers", p: [
    `This policy explains how ${who} ("we", "us") handles personal information when you visit this website and when you use our digital banking services.`,
  ] },
  { h: "What this website collects", p: [
    "Browsing this website does not require an account. We do not use advertising trackers, analytics scripts or third party cookies on it, and the fonts it uses are served from our own site.",
    "Our hosting provider may keep standard server logs, such as IP address, browser type and the pages requested, for security and to keep the service running.",
  ] },
  { h: "What we collect when you use banking services", p: ["When you open an account or use our services, we collect the information needed to provide them and to meet legal duties:"], l: [
    "Identity details: name, date of birth, contact details and identity document numbers.",
    "Verification data: images of identity documents, a selfie, the result of the face match and liveness checks, and your risk level.",
    "Account and transaction data: account numbers, balances, transfers, beneficiaries, loan applications and repayments.",
    "Technical data: device and connection details used for security and fraud detection.",
    "Records of your actions and of staff actions on your account, kept in an audit log.",
  ] },
  { h: "How we use it", l: [
    "To verify who you are and open and run your account.",
    "To process payments, transfers and loans.",
    "To detect and prevent fraud and other misuse.",
    "To send service messages such as payment confirmations by SMS or email.",
    "To meet banking, tax, anti-money-laundering and other legal obligations.",
  ] },
  { h: "Who we share it with", p: ["We share information only where it is needed to deliver the service or required by law:"], l: [
    "Payment networks and partner banks, to carry out transfers.",
    "Credit bureaus, to assess loan applications.",
    "Service providers that send messages or host our systems, under contract and only for our purposes.",
    "Regulators, courts and law enforcement, when legally required.",
  ], },
  { h: "How long we keep it", p: ["We keep information for as long as you hold an account and afterwards for the periods that banking and record keeping laws require. When a retention period ends, we delete or anonymise the data."] },
  { h: "How we protect it", p: ["Access is limited by role, sign-in is handled by a dedicated identity service, sensitive actions are recorded in an append-only audit log, and data is protected in transit. No system is perfectly secure, so we also monitor for misuse and respond to incidents."] },
  { h: "Your choices and rights", p: ["Depending on where you live, you may have the right to access the information we hold about you, correct it, ask us to delete it, object to some uses, or withdraw consent where we rely on it. Some information must be kept to meet legal duties, and we will explain this if it applies to your request."] },
  { h: "Children", p: ["Our services are for adults. We do not knowingly collect information from children outside of accounts opened lawfully on their behalf."] },
  { h: "Changes to this policy", p: ["If we change this policy we will update this page and the effective date. If a change is significant we will tell account holders directly."] },
  { h: "Contact us", p: contact },
];

export default function Privacy() {
  return <Legal title="Privacy policy" lead="What we collect, why we collect it, and the choices you have." sections={sections} />;
}
