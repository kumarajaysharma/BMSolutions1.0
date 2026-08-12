/**
 * middleware.ts  ← project root (same level as package.json)
 *
 * Next.js Edge Middleware entry point.
 * Delegates all routing, auth, and security logic to src/proxy.ts.
 *
 * DO NOT add business logic here. All changes go to src/proxy.ts.
 */

import { proxy, config } from "./src/proxy";
export const middleware = proxy;
export { config };
