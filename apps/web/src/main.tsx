import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { queryClient } from "./services/queryClient";
import { enableMocking } from "./mocks";

// Wait for the MSW worker (dev only) before mounting so the first queries are
// intercepted rather than hitting the network.
enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>
          <App />
        </Suspense>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
