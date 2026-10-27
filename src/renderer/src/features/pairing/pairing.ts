import type { Style } from "@shared/contracts/library";
import type { Pairing, StyleRef } from "@shared/contracts/storage";
import { familyKey } from "@/features/library";

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
 * The next or previous candidate after `current`, for stepping a role through
 * the list she came from. A Family row's candidate is its Representative
 * Style, so `current` matches its own Style first, then any Style of the
 * same Family. Stops at the ends instead of wrapping: a jump from Zapfino
 * back to Academy Engraved would lose her place.
 */
export function stepCandidate(
  candidates: readonly Style[],
  current: Style | null,
  delta: number,
): Style | null {
  if (candidates.length === 0) return null;
  const index = current
    ? (() => {
        const byId = candidates.findIndex((style) => style.id === current.id);
        if (byId >= 0) return byId;
        const key = familyKey(current.familyName);
        return candidates.findIndex(
          (style) => familyKey(style.familyName) === key,
        );
      })()
    : -1;
  if (index === -1) {
    return (delta > 0 ? candidates[0] : candidates.at(-1)) ?? null;
  }
  const next = Math.min(candidates.length - 1, Math.max(0, index + delta));
  return candidates[next] ?? null;
}

/** The next or previous Style in its Family, wrapping like Quick preview. */
export function stepStyle(
  familyStyles: readonly Style[],
  current: Style,
  delta: number,
): Style {
  const index = familyStyles.findIndex((style) => style.id === current.id);
  if (index === -1) return current;
  const length = familyStyles.length;
  return familyStyles[(index + delta + length) % length] ?? current;
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
