import { test } from "node:test";
import assert from "node:assert/strict";
import { getTemplate } from "../src/templates/registry";
import { parseExperience, type Layer } from "../src/schemas/experience";
import { resolveBinding, safeUrl } from "../src/utils/binding";
import { resolveTypography } from "../src/typography/TypographyPresets";
test("both templates use the same schema and resolve customer bindings", async () => {
  for (const id of ["botanical", "minimal"]) {
    const experience = await getTemplate(id);
    assert.equal(experience.scenes.length, 8); assert.equal(experience.id, id);
    assert.equal(resolveBinding(experience.content, "couple.names"), "Adrian & Isabella");
    assert.equal(resolveBinding(experience.content, "gallery.0.caption"), experience.content.gallery[0].caption);
    assert.equal(resolveBinding(experience.content, "couple.__proto__", "safe"), "safe");
    assert.equal(resolveBinding(experience.content, "missing.value", "fallback"), "fallback");
  }
});
test("typography merge honors preset, layer override, then responsive override", async () => {
  const experience = await getTemplate();
  const layer: Layer = { id: "name", type: "text", position: [0, 0, 0], stylePreset: "heroName", textStyle: { color: "#fff", fontSize: 0.8 }, responsive: { mobile: { textStyle: { fontSize: 0.55 } } } };
  const style = resolveTypography(layer, experience, "mobile");
  assert.equal(style.fontFamily, "Cormorant"); assert.equal(style.color, "#fff"); assert.equal(style.fontSize, 0.55);
  assert.equal(resolveTypography(layer, experience, "desktop").fontSize, 0.8);
});
test("invalid imported documents cannot omit cameras or reuse scene IDs", async () => {
  const experience = await getTemplate();
  assert.throws(() => parseExperience({ ...experience, cameraPath: [] }), /Missing camera/);
  assert.throws(() => parseExperience({ ...experience, scenes: [experience.scenes[0], experience.scenes[0]] }), /Duplicate scene/);
  assert.throws(() => parseExperience({ ...experience, version: 2 }));
});
test("URLs reject executable and protocol-relative links", () => {
  assert.equal(safeUrl("javascript:alert(1)"), undefined); assert.equal(safeUrl("//evil.test/a"), undefined);
  assert.equal(safeUrl("/assets/photo.webp"), "/assets/photo.webp"); assert.equal(safeUrl("https://maps.google.com/"), "https://maps.google.com/");
});
