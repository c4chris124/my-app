import { Outlet } from "react-router-dom";
import { EcommerceNavbar } from "../components/EcommerceNavbar";
import { EcommerceFooter } from "../components/EcommerceFooter";

/**
 * Shell for the whole e-commerce module: sticky-feel navbar, routed content,
 * and footer. Child routes render through <Outlet />.
 */
export default function EcommerceLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <EcommerceNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <EcommerceFooter />
    </div>
  );
}
