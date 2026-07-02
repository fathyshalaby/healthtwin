import "fake-indexeddb/auto";
// vitest-axe@0.1.0: register matchers explicitly (extend-expect is a runtime no-op).
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";

expect.extend(matchers);
