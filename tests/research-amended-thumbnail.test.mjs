import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { applyDesignCorrection } from "../src/research-design-amendments.js";
import { researchThumbnail } from "../scripts/research-thumbnail.mjs";

test("156 corrected thumbnail overrides the frozen stale legend and prints rounded53 with conditional90", async () => {
  const designs = JSON.parse(await fs.readFile(new URL("../research/designs/design-registry.json", import.meta.url))).designs;
  const original = designs.find(design => design.conceptId === "156-8");
  const proposal = JSON.parse(await fs.readFile(new URL("../data-updates/design-proposals/156-8-rounded-percentage.json", import.meta.url)));
  const design = applyDesignCorrection(original, proposal);
  const dataset = JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`, import.meta.url)));
  const svg = researchThumbnail({ conceptId: "156-8", design, dataset, datasetSha256: design.datasetBindings[0].sha256 });
  const description = svg.match(/<desc>(.*?)<\/desc>/s)[1];
  assert.match(description, /Rounded primary-report 53% of surveyed workers/);
  assert.match(description, /90% of respondents who knew client location/);
  assert.match(description, /outside Latin America and the Caribbean/);
  assert.match(description, /do not multiply/);
  assert.match(svg, />Rounded 53 percent of surveyed workers<\/text>/);
  assert.match(svg, />90 percent of respondents who know client location<\/text>/);
  assert.doesNotMatch(svg, /(?:&gt;\s*53|over[\s-]*53)/i);
  assert.notEqual(description, original.legend);
  assert.equal(design.legend, original.legend, "immutable source design stays intact");
});
