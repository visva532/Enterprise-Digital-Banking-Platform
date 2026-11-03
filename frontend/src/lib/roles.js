export const SIGN_IN_OPTIONS = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "TELLER", label: "Teller" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
];

export function homeForRole(role) {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "MANAGER":
      return "/manager";
    case "TELLER":
      return "/teller";
    default:
      return "/accounts";
  }
}

export function isStaff(role) {
  return role === "ADMIN" || role === "MANAGER" || role === "TELLER";
}