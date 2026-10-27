import type { Axis, NamedInstance, Style } from "@shared/contracts/library";

export type AxisValues = Record<string, number>;

/** The parts of a Style these functions read. */
type VariableStyle = Pick<Style, "axes" | "namedInstances">;

/** Registered Axis tags get a plain name; others use the name from the Font file. */
const REGISTERED_AXIS_NAMES: Record<string, string> = {
  wght: "Weight",
  wdth: "Width",
  opsz: "Optical size",
  slnt: "Slant",
  ital: "Italic",
};

export function axisLabel(axis: Axis): string {
  return REGISTERED_AXIS_NAMES[axis.tag] ?? (axis.name || axis.tag);
}

export function defaultAxisValues(style: VariableStyle): AxisValues {
  return Object.fromEntries(style.axes.map((axis) => [axis.tag, axis.default]));
}

/** The Named instance whose coordinates the values match exactly, if any. */
export function matchingInstance(
  style: VariableStyle,
  values: AxisValues,
): NamedInstance | undefined {
  return style.namedInstances.find((instance) =>
    style.axes.every((axis) => {
      const wanted = instance.coordinates[axis.tag] ?? axis.default;
      return Math.abs((values[axis.tag] ?? axis.default) - wanted) < 0.01;
    }),
  );
}

/**
 * The CSS for a variable Style's Axes. Axes are driven only through
 * font-variation-settings, never font-weight, so the browser can't fake a
 * weight (edge case R4). While "Match Size" is on, `opsz` is left out and
 * follows the font size by itself.
 */
export function variationStyle(
  style: VariableStyle,
  values: AxisValues,
  matchOpticalSize: boolean,
): React.CSSProperties {
  if (style.axes.length === 0) return {};
  const settings = style.axes
    .filter((axis) => !(axis.tag === "opsz" && matchOpticalSize))
    .map((axis) => `"${axis.tag}" ${round(values[axis.tag] ?? axis.default)}`)
    .join(", ");
  const hasOpticalSize = style.axes.some((axis) => axis.tag === "opsz");
  return {
    fontVariationSettings: settings === "" ? "normal" : settings,
    fontOpticalSizing: hasOpticalSize && !matchOpticalSize ? "none" : "auto",
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
