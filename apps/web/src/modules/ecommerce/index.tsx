import { Routes, Route } from "react-router-dom";
import EcommerceLayout from "./layouts/EcommerceLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Placeholder from "./pages/Placeholder";

/**
 * E-commerce module router. Lazy-loaded from the root App, so this whole
 * subtree (layout + pages) ships in its own chunk.
 *
 * Auth-guarded routes (cart, profile) will sit under a <RequireEcommerceAuth />
 * outlet once the auth store lands — see the architecture plan.
 */
export default function EcommerceModule() {
  return (
    <Routes>
      <Route element={<EcommerceLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route
          path="products"
          element={<Placeholder titleKey="nav.products" />}
        />
        <Route path="cart" element={<Placeholder titleKey="nav.cart" />} />
        <Route path="login" element={<Placeholder titleKey="nav.account" />} />
        {/* /ecommerce/[category] and /ecommerce/[category]/[product] */}
        <Route
          path=":category"
          element={<Placeholder titleKey="placeholder.category" />}
        />
        <Route
          path=":category/:productId"
          element={<Placeholder titleKey="placeholder.product" />}
        />
      </Route>
    </Routes>
  );
}
