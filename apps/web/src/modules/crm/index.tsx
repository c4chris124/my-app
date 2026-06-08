import { Routes, Route, Navigate } from "react-router-dom";
import CrmLayout from "./layouts/CrmLayout";
import RequireCrmAuth from "./guards/RequireCrmAuth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Catalogs from "./pages/Catalogs";
import Sessions from "./pages/Sessions";

/**
 * CRM module router. Lazy-loaded from the root App so it ships as its own chunk.
 * `/crm/login` is public; everything else sits behind <RequireCrmAuth /> inside
 * the dashboard layout.
 */
export default function CrmModule() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequireCrmAuth />}>
        <Route element={<CrmLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="catalogs" element={<Catalogs />} />
          <Route path="sessions" element={<Sessions />} />
        </Route>
      </Route>
    </Routes>
  );
}
