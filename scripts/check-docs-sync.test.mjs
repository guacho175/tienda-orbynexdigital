import assert from "node:assert/strict";
import test from "node:test";

import {
  collectUndocumentedEndpoints,
  evaluateImpact,
  extractMarkdownLinks,
  hasValidNoImpactReason,
} from "./check-docs-sync.mjs";

test("extrae enlaces Markdown sin títulos", () => {
  assert.deepEqual(
    extractMarkdownLinks("[Uno](docs/README.md) y [Dos](<docs/archivo con espacios.md>)"),
    ["docs/README.md", "docs/archivo con espacios.md"],
  );
});

test("exige una justificación explícita de impacto nulo", () => {
  assert.equal(
    hasValidNoImpactReason("Docs-impact: none - cambio interno sin contrato observable"),
    true,
  );
  assert.equal(hasValidNoImpactReason("Docs-impact: none"), false);
});

test("detecta endpoints ausentes de la referencia", () => {
  assert.deepEqual(
    collectUndocumentedEndpoints(
      ["api/flow/confirm.ts", "api/account/link-orders.ts"],
      "Contrato de api/flow/confirm.ts",
    ),
    ["api/account/link-orders.ts"],
  );
});

test("mapea cambios de código a su documentación", () => {
  assert.equal(evaluateImpact(["api/flow/confirm.ts"]).length, 2);
  assert.deepEqual(
    evaluateImpact([
      "api/flow/confirm.ts",
      "docs/technical/05-payment-flow.md",
      "docs/technical/08-api-reference.md",
    ]),
    [],
  );
});
