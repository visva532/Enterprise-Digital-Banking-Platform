import Legal from "../components/Legal.jsx";
import { site } from "../config.js";

const who = site.legalName || site.name;
const law = site.governingLaw
  ? [`These terms are governed by ${site.governingLaw}. Courts there have jurisdiction over disputes, unless the law gives you the right to go elsewhere.`]
  : ["The governing law and courts that apply to these terms are stated here."];
const contact = site.contactEmail ? [`Questions about these terms can be sent to ${site.contactEmail}.`] : ["Contact details for questions about these terms are published on this page."];

const sections = [
  { h: "Agreeing to these terms", p: [`These terms are an agreement between you and ${who}. By using this website or our banking services you accept them. If you do not accept them, please do not use the services.`] },
  { h: "Who can use the services", p: ["You must be an adult who can enter a contract, or the lawful guardian of someone opening an account for a minor. You must give accurate information and keep it up to date."] },
  { h: "Your account and sign-in", p: ["Keep your sign-in details private. You are responsible for activity carried out with them. Tell us straight away if you think someone else has access to your account."] },
  { h: "Identity checks", p: ["We must verify who you are before we open an account and at other times the law requires. We may ask for documents, a selfie and other details, and we may limit or close an account if checks cannot be completed."] },
  { h: "Payments and transfers", l: [
    "You must have enough available balance to make a transfer.",
    "We run a fraud check on each transfer. We may delay or block a transfer that looks unusual, and we will tell you when we do.",
    "Transfers over IMPS, NEFT and UPI follow the timings and rules of those networks. Once a transfer has been completed and credited it generally cannot be recalled.",
    "If a transfer fails after your account has been debited, we reverse the debit.",
  ] },
  { h: "Loans", p: ["Loans are subject to credit assessment and approval. Calculators and examples on this website are illustrations, not offers. The terms of a loan, including rate, fees and schedule, are those stated in your loan agreement."] },
  { h: "Fees", p: ["Any fees that apply to an account or service will be shown to you before you commit to it."] },
  { h: "Acceptable use", p: ["You must not use the services for anything unlawful, to move money you know to be the proceeds of crime, to interfere with the systems, or to try to access another person's account or data."] },
  { h: "Availability", p: ["We work to keep the services running, but they may be interrupted for maintenance, security reasons or events outside our control."] },
  { h: "Our responsibility", p: ["We are responsible for losses that we cause through our own negligence or breach of these terms, and for anything the law does not allow us to exclude. We are not responsible for losses caused by events outside our reasonable control or by you sharing your sign-in details."] },
  { h: "Intellectual property", p: ["The website, its design and its software belong to us or our licensors. You may use them to access the services but not to copy or resell them."] },
  { h: "Ending the agreement", p: ["You can close your account at any time, subject to settling what you owe. We may suspend or close an account where the law requires, where you break these terms, or where we reasonably suspect fraud."] },
  { h: "Changes to these terms", p: ["We may update these terms. We will post the new version here with a new effective date and tell account holders about material changes in advance."] },
  { h: "Governing law", p: law },
  { h: "Contact us", p: contact },
];

export default function Terms() {
  return <Legal title="Terms and conditions" lead="The rules for using this website and our banking services." sections={sections} />;
}
