import { parseExperience, type WeddingExperience } from "@/schemas/experience";
import content from "./demo-content.json";
export const templateOptions = [{ id: "botanical", name: "Botanical Reverie", category: "Botanical · Romantic", color: "#7b8867" }, { id: "minimal", name: "Modern Vow", category: "Minimal · Editorial", color: "#a88b73" }];
const loaders = {
  botanical: () => Promise.all([import("./botanical/template.json"), import("./botanical/scene.json"), import("./botanical/camera.json"), import("./botanical/theme.json"), import("./botanical/fonts.json")]),
  minimal: () => Promise.all([import("./minimal/template.json"), import("./minimal/scene.json"), import("./minimal/camera.json"), import("./minimal/theme.json"), import("./minimal/fonts.json")]),
};
export async function getTemplate(id = "botanical"): Promise<WeddingExperience> {
  const [template, scenes, cameraPath, theme, fonts] = await loaders[id === "minimal" ? "minimal" : "botanical"]();
  return parseExperience({ ...template.default, scenes: scenes.default, cameraPath: cameraPath.default, theme: theme.default, fonts: fonts.default, content });
}
export async function getCinematicTemplate(): Promise<WeddingExperience> {
  const [base, { default: story }] = await Promise.all([getTemplate(), import("./botanical/story.json")]);
  return parseExperience({ ...base, ...story, id: "botanical-story", description: "A continuous illustrated journey: a letter, two souls, and a forever." });
}
export async function getWoodlandTemplate(): Promise<WeddingExperience> {
  const [base, { default: world }] = await Promise.all([getTemplate(), import("./botanical/woodland.json")]);
  return parseExperience({ ...base, ...world, id: "woodland-reverie", name: "Woodland Reverie", description: "Through the forest, into the garden, along the river, and beyond the clouds." });
}
