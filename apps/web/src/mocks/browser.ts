import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** Browser-side MSW worker. Started conditionally from ./index. */
export const worker = setupWorker(...handlers);
