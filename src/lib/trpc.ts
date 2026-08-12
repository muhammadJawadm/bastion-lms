import { createTRPCReact } from "@trpc/react-query";
import type { AnyRouter } from "@trpc/server";

// Untyped on purpose: this project has no backend yet (frontend-only build,
// UI review phase). The `as any` is a deliberate escape hatch so every
// existing trpc.* call site still compiles without a real router shape to
// check against. Once a backend exists, replace `AnyRouter` with its real
// `AppRouter` type for full end-to-end type safety again.
export const trpc = createTRPCReact<AnyRouter>() as any;
