import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { homeForRole } from "../lib/roles.js";

// This only decides what to show. The real protection is the role check in every backend API.
export default function RoleRoute({ roles, children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}