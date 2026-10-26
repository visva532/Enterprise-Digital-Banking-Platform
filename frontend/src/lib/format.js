export function formatAccountNumber(n) {
  return n ? n.replace(/(\d{4})(?=\d)/g, "$1 ") : "";
}

export function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value || 0));
}