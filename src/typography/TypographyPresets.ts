import type { Breakpoint, Layer, TextStyle, WeddingExperience } from "@/schemas/experience";
export function resolveTypography(layer: Layer, experience: WeddingExperience, breakpoint: Breakpoint): TextStyle {
  return { ...experience.theme.typography.body, ...experience.theme.typography[layer.stylePreset ?? ""], ...layer.textStyle, ...layer.responsive?.[breakpoint]?.textStyle };
}
export function resolveLayer(layer: Layer, breakpoint: Breakpoint): Layer {
  const override = layer.responsive?.[breakpoint];
  return { ...layer, ...override, textStyle: { ...layer.textStyle, ...override?.textStyle } };
}
