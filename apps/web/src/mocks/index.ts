/**
 * Starts the MSW worker in development so the storefront has data without a
 * running backend. The worker module is dynamically imported so MSW is never
 * bundled into the production build.
 *
 * Disable by setting VITE_ENABLE_MSW=false in your .env.
 */
export async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_ENABLE_MSW === "false") return;

  const { worker } = await import("./browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}
