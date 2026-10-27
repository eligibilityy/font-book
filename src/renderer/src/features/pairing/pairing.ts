import type { Style } from "@shared/contracts/library";
import type { Pairing, StyleRef } from "@shared/contracts/storage";

export type PairingRole = "heading" | "body";

export const roleLabels: Record<PairingRole, string> = {
  heading: "Heading",
  body: "Body",
};

/**
 * Puts a Style in one role, with the Axis values it had in the Specimen, so a
 * variable Style she set to SemiBold arrives as SemiBold.
 */
export function assignRole(
  pairing: Pairing,
  role: PairingRole,
  style: StyleRef,
  axisValues: Record<string, number>,
): Pairing {
  return { ...pairing, [role]: { style, axisValues } };
}

/** Trades the two Styles. Sizes and line heights stay with their role. */
export function swapRoles(pairing: Pairing): Pairing {
  return { ...pairing, heading: pairing.body, body: pairing.heading };
}

/**
 * Where a role stands: nothing chosen yet, chosen but its Font file is gone,
 * or ready to draw.
 */
export type ResolvedSlot =
  | { status: "empty" }
  | { status: "missing"; ref: StyleRef }
  | { status: "ready"; style: Style; axisValues: Record<string, number> };

export function resolveSlot(
  slot: Pairing["heading"],
  stylesById: ReadonlyMap<string, Style>,
): ResolvedSlot {
  if (!slot.style) return { status: "empty" };
  const style = stylesById.get(slot.style.styleId);
  return style
    ? { status: "ready", style, axisValues: slot.axisValues }
    : { status: "missing", ref: slot.style };
}
