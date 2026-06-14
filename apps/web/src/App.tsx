import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FullPageSpinner } from "./components/FullPageSpinner";
import LandingPage from "./pages/LandingPage";
import { useAuthStore } from "./services/authStore";

// Domain modules are code-split so the storefront/CRM ship as separate chunks.
const EcommerceModule = lazy(() => import("./modules/ecommerce"));
const CrmModule = lazy(() => import("./modules/crm"));

function App() {
  // Rehydrate the session from the HttpOnly cookie once on startup.
  const bootstrap = useAuthStore((s) => s.bootstrap);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/ecommerce/*" element={<EcommerceModule />} />
          <Route path="/crm/*" element={<CrmModule />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
