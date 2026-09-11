import { test } from "node:test";
import assert from "node:assert/strict";
import { getCinematicTemplate, getWoodlandTemplate } from "../src/templates/registry";
import { parseExperience } from "../src/schemas/experience";
import { projectWorld, smoothRange } from "../src/scene-engine/story/projection";
import { residentScenes, scenePhase } from "../src/scene-engine/story/lifecycle";
import { buildLayerTrack, motionDefaults } from "../src/scene-engine/story/MasterTimeline";

test("world camera advances continuously along a single axis through six fixed scenes", async () => {
  const world = await getWoodlandTemplate();
  assert.equal(world.scenes.length, 6);
  assert.ok(world.story?.world);
  for (let i = 0; i < world.scenes.length; i++) {
    const scene = world.scenes[i]; assert.equal(scene.position[0], 0); assert.equal(scene.position[1], 0);
    if (i) assert.ok(scene.position[2] < world.scenes[i - 1].position[2]);
    for (const layer of scene.layers.filter(layer => layer.renderer === "webgl")) {
      assert.ok(!layer.keyframes?.some(key => key.opacity !== undefined && key.opacity !== 1), `${layer.id} must not fade scenery by chapter`);
    }
  }
  for (let i = 1; i < world.cameraPath.length; i++) { assert.ok(world.cameraPath[i].at! > world.cameraPath[i - 1].at!); assert.ok(world.cameraPath[i].position[2] < world.cameraPath[i - 1].position[2]); }
});
test("perspective preserves a visible future world and increases parallax on approach", () => {
  const near = projectWorld([3, 1, 0], { x: 0, y: 0, z: 14 }, 14);
  const far = projectWorld([3, 1, -24], { x: 0, y: 0, z: 14 }, 14);
  assert.ok(near.visible && far.visible); assert.ok(near.scale > far.scale); assert.ok(near.x > far.x);
  const approached = projectWorld([3, 1, -24], { x: 0, y: 0, z: -10 }, 14);
  assert.equal(approached.scale, near.scale);
  assert.equal(projectWorld([0, 0, 0], { x: 0, y: 0, z: -1 }, 14).visible, false);
  assert.equal(smoothRange(3, 7, 3), 0); assert.equal(smoothRange(3, 7, 7), 1);
});
test("GSAP tracks seek forward and backward identically, including exact endpoints", () => {
  const state = { ...motionDefaults };
  const timeline = buildLayerTrack(state, [{ at: 0, x: -2, scale: 0.7 }, { at: 0.5, x: 0, scale: 1 }, { at: 1, x: 2, scale: 1.8 }], { start: 0.2, enterEnd: 0.3, anchor: 0.5, exitStart: 0.7, end: 0.8 }, false);
  try {
    timeline.pause().totalTime(0.4); const sample = { x: state.x, scale: state.scale };
    timeline.totalTime(0.8); assert.equal(state.x, 2);
    timeline.totalTime(0.4); assert.deepEqual({ x: state.x, scale: state.scale }, sample);
    timeline.totalTime(0); assert.equal(state.x, -2);
  } finally { timeline.kill(); }
});
test("original slice retains overlapping lifecycle and validates malformed ranges", async () => {
  const slice = await getCinematicTemplate();
  assert.equal(residentScenes(slice.scenes, 0.3, 0).length, 2);
  assert.equal(scenePhase(slice.scenes[1].lifecycle!, 0.48), "hold");
  assert.throws(() => parseExperience({ ...slice, scenes: [{ ...slice.scenes[0], lifecycle: { start: 0.5, enterEnd: 0.2, anchor: 0.3, exitStart: 0.6, end: 0.9 } }] }));
});
