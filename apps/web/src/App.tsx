import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FullPageSpinner } from "./components/FullPageSpinner";
import LandingPage from "./pages/LandingPage";

// Domain modules are code-split so the storefront/CRM ship as separate chunks.
const EcommerceModule = lazy(() => import("./modules/ecommerce"));
// const CRMModule = lazy(() => import("./modules/crm"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ecommerce/*" element={<EcommerceModule />} />
          {/* <Route path="/crm/*" element={<CRMModule />} /> */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
