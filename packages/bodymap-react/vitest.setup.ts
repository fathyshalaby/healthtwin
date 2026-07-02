// vitest-axe@0.1.0: the "extend-expect" entry is a runtime no-op (types only),
// so register the matchers explicitly.
import * as matchers from "vitest-axe/matchers";
import { expect } from "vitest";

expect.extend(matchers);
