import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Accounts from "./pages/Accounts.jsx";
import Payments from "./pages/Payments.jsx";
import Loans from "./pages/Loans.jsx";
import Kyc from "./pages/Kyc.jsx";
import Security from "./pages/Security.jsx";
import Architecture from "./pages/Architecture.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import NotFound from "./pages/NotFound.jsx";


export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="payments" element={<Payments />} />
        <Route path="loans" element={<Loans />} />
        <Route path="kyc" element={<Kyc />} />
        <Route path="security" element={<Security />} />
        <Route path="architecture" element={<Architecture />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="signup" element={<SignUp />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
