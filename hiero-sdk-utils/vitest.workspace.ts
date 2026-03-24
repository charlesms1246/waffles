// vitest.workspace.ts
import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/core",
  "packages/mirror-node",
  "packages/scheduled-tx",
  "packages/react",
]);
