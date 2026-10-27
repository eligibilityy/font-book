import type { Style } from "@shared/contracts/library";
import type { Pairing } from "@shared/contracts/storage";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  axisLabel,
  defaultAxisValues,
  variationStyle,
} from "@/features/specimen";
import { sampleFontFamily } from "@/shared/font-faces/registry";
import { useStyleFace } from "@/shared/font-faces/use-style-face";
import { DURATION, EASE_IN_OUT, EASE_OUT } from "@/shared/motion";
import controls from "@/shared/ui/controls.module.css";
import { IconButton } from "@/shared/ui/icon-button";
import {
  ExportIcon,
  InspectorIcon,
  PaperInkIcon,
  SwapIcon,
} from "@/shared/ui/icons";
import { LabeledSlider } from "@/shared/ui/labeled-slider";
import {
  type PairingRole,
  type ResolvedSlot,
  resolveSlot,
  roleLabels,
  swapRoles,
} from "../../pairing";
import styles from "./styles.module.css";

const SUBHEAD = "Notes on a heading and a body set together";
const PARAGRAPH =
  "A heading sets the voice of a page; the text beneath it carries the reading for minutes at a time. When the two belong together, neither asks for attention and the page simply reads. Look for a shared rhythm: similar proportions, or a contrast clear enough to look deliberate rather than accidental. Then read a few lines at the size they will really be used.";
const CAPTION = "Set in Book. Sizes and weights are adjustable per role.";

interface PairingViewProps {
  pairing: Pairing;
  onPairingChange: (change: (pairing: Pairing) => Pairing) => void;
  stylesById: ReadonlyMap<string, Style>;
  sampleText: string;
  paperReversed: boolean;
  onPaperReversedChange: (reversed: boolean) => void;
  inspectorOpen: boolean;
  onInspectorOpenChange: (open: boolean) => void;
  onOpenSpecimen: (style: Style) => void;
  /** Export PNG of the page as it looks now. */
  onExport: () => void;
  onBack: () => void;
  regionRef: React.RefObject<HTMLElement | null>;
}

/**
 * A heading Style and a body Style on one page, to judge them together:
 * headline and subhead in the heading, a paragraph and caption in the body.
 */
export function PairingView({
  pairing,
  onPairingChange,
  stylesById,
  sampleText,
  paperReversed,
  onPaperReversedChange,
  inspectorOpen,
  onInspectorOpenChange,
  onOpenSpecimen,
  onExport,
  onBack,
  regionRef,
}: PairingViewProps): React.JSX.Element {
  const heading = resolveSlot(pairing.heading, stylesById);
  const body = resolveSlot(pairing.body, stylesById);

  // Same rule as the Specimen: the page narrows once when the controls open
  // and widens once after they have slid away, never on every frame.
  const [hasInspectorSpace, setHasInspectorSpace] = useState(inspectorOpen);
  if (inspectorOpen && !hasInspectorSpace) setHasInspectorSpace(true);

  const ink = paperReversed ? "var(--specimen-paper)" : "var(--specimen-ink)";
  const paper = paperReversed ? "var(--specimen-ink)" : "var(--specimen-paper)";

  return (
    <section
      ref={regionRef}
      className={styles.pairing}
      aria-label="Pairing"
      tabIndex={-1}
      onKeyDown={(event) => {
        const target = event.target;
        if (
          !(target instanceof HTMLElement) ||
          !event.currentTarget.contains(target) ||
          target.matches("input, textarea, [role='slider']") ||
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey
        )
          return;
        if (event.key === "Escape") {
          event.preventDefault();
          onBack();
        }
      }}
    >
      <header className={styles.header}>
        <div className={styles.roles}>
          {/* Keyed by Style, so after Swap each name slides to its new place. */}
          {(["heading", "body"] as const).map((role, index) => {
            const slot = role === "heading" ? heading : body;
            return (
              <motion.div
                key={slotKey(slot, role)}
                layout="position"
                transition={{ duration: DURATION.base, ease: EASE_IN_OUT }}
                className={styles.roleSlot}
                style={{ order: index * 2 }}
              >
                <RoleName
                  pairingRole={role}
                  slot={slot}
                  onOpenSpecimen={onOpenSpecimen}
                />
              </motion.div>
            );
          })}
          <span className={styles.swap}>
            <IconButton
              label="Swap Heading and Body"
              disabled={heading.status === "empty" && body.status === "empty"}
              onClick={() => onPairingChange(swapRoles)}
            >
              <SwapIcon />
            </IconButton>
          </span>
        </div>
        <div className={styles.actions}>
          <IconButton
            label="Reverse Paper and Ink"
            aria-pressed={paperReversed}
            onClick={() => onPaperReversedChange(!paperReversed)}
          >
            <PaperInkIcon />
          </IconButton>
          <IconButton
            label={inspectorOpen ? "Hide Inspector" : "Show Inspector"}
            aria-pressed={inspectorOpen}
            onClick={() => onInspectorOpenChange(!inspectorOpen)}
          >
            <InspectorIcon />
          </IconButton>
          <IconButton
            label="Export PNG"
            disabled={heading.status === "empty" && body.status === "empty"}
            onClick={onExport}
          >
            <ExportIcon />
          </IconButton>
        </div>
      </header>

      <div className={styles.body}>
        {/* data-export-region: what Export PNG pictures (features/export). */}
        <div
          className={styles.paper}
          style={{ background: paper, color: ink }}
          data-inspector-space={hasInspectorSpace ? "" : undefined}
          data-export-region=""
        >
          <article className={styles.page}>
            <RoleText
              pairingRole="heading"
              slot={heading}
              lines={[
                {
                  className: styles.headline,
                  text: sampleText,
                  size: pairing.headingSize,
                  lineHeight: pairing.headingLineHeight,
                },
                {
                  className: styles.subhead,
                  text: SUBHEAD,
                  size: Math.round(pairing.headingSize / 2),
                  lineHeight: pairing.headingLineHeight + 0.1,
                },
              ]}
            />
            <RoleText
              pairingRole="body"
              slot={body}
              lines={[
                {
                  className: styles.paragraph,
                  text: PARAGRAPH,
                  size: pairing.bodySize,
                  lineHeight: pairing.bodyLineHeight,
                },
                {
                  className: styles.caption,
                  text: CAPTION,
                  size: Math.max(8, Math.round(pairing.bodySize * 0.75)),
                  lineHeight: pairing.bodyLineHeight,
                },
              ]}
            />
          </article>
        </div>

        <AnimatePresence
          initial={false}
          onExitComplete={() => setHasInspectorSpace(false)}
        >
          {inspectorOpen && (
            <motion.aside
              key="pairing-inspector"
              className={styles.inspector}
              aria-label="Inspector"
              initial={{ x: "100%", opacity: 0 }}
              animate={{
                x: 0,
                opacity: 1,
                transition: { duration: DURATION.slow, ease: EASE_OUT },
              }}
              exit={{
                x: "100%",
                opacity: 0,
                transition: { duration: DURATION.base, ease: EASE_OUT },
              }}
            >
              <RoleControls
                pairingRole="heading"
                slot={heading}
                size={pairing.headingSize}
                sizeRange={[16, 160]}
                defaultSize={48}
                lineHeight={pairing.headingLineHeight}
                lineHeightRange={[0.8, 2]}
                defaultLineHeight={1.1}
                onChange={(changes) =>
                  onPairingChange((previous) => ({
                    ...previous,
                    headingSize: changes.size ?? previous.headingSize,
                    headingLineHeight:
                      changes.lineHeight ?? previous.headingLineHeight,
                    heading: changes.axisValues
                      ? { ...previous.heading, axisValues: changes.axisValues }
                      : previous.heading,
                  }))
                }
              />
              <RoleControls
                pairingRole="body"
                slot={body}
                size={pairing.bodySize}
                sizeRange={[8, 32]}
                defaultSize={16}
                lineHeight={pairing.bodyLineHeight}
                lineHeightRange={[1, 2.4]}
                defaultLineHeight={1.5}
                onChange={(changes) =>
                  onPairingChange((previous) => ({
                    ...previous,
                    bodySize: changes.size ?? previous.bodySize,
                    bodyLineHeight:
                      changes.lineHeight ?? previous.bodyLineHeight,
                    body: changes.axisValues
                      ? { ...previous.body, axisValues: changes.axisValues }
                      : previous.body,
                  }))
                }
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function slotKey(slot: ResolvedSlot, role: PairingRole): string {
  if (slot.status === "ready") return slot.style.id;
  if (slot.status === "missing") return slot.ref.styleId;
  return `empty-${role}`;
}

/** "Heading" above the Style's name, which opens its Specimen. */
function RoleName({
  pairingRole: role,
  slot,
  onOpenSpecimen,
}: {
  pairingRole: PairingRole;
  slot: ResolvedSlot;
  onOpenSpecimen: (style: Style) => void;
}): React.JSX.Element {
  return (
    <>
      <span className={styles.roleLabel}>{roleLabels[role]}</span>
      {slot.status === "ready" ? (
        <button
          type="button"
          className={styles.roleName}
          title={`Open the Specimen of ${slot.style.familyName} ${slot.style.styleName}`}
          onClick={() => onOpenSpecimen(slot.style)}
        >
          {slot.style.familyName} {slot.style.styleName}
        </button>
      ) : (
        <span className={styles.roleEmpty}>
          {slot.status === "missing"
            ? `${slot.ref.familyName} ${slot.ref.styleName}, missing`
            : "Not chosen yet"}
        </span>
      )}
    </>
  );
}

interface TextLine {
  className: string | undefined;
  text: string;
  size: number;
  lineHeight: number;
}

/** One role's lines on the page, or why they can't be drawn. */
function RoleText({
  pairingRole: role,
  slot,
  lines,
}: {
  pairingRole: PairingRole;
  slot: ResolvedSlot;
  lines: TextLine[];
}): React.JSX.Element {
  const status = useStyleFace(slot.status === "ready" ? slot.style : null, {
    priority: true,
  });

  if (slot.status === "empty") {
    return (
      <p className={styles.message}>
        Open a Specimen and choose Use as {roleLabels[role]}.
      </p>
    );
  }
  if (slot.status === "missing" || status === "missing") {
    return (
      <p className={styles.message}>
        This Style's Font file is no longer in your Font folders. It may have
        been moved or removed.
      </p>
    );
  }
  if (status === "failed") {
    return (
      <p className={styles.message}>
        This Style can't be previewed. The Font file may be damaged, or use a
        format Book can't draw.
      </p>
    );
  }
  if (status !== "ready") {
    return <div className={styles.loading} aria-busy="true" />;
  }

  const { style, axisValues } = slot;
  return (
    <div className={styles.role}>
      {lines.map((line) => (
        <p
          key={line.className}
          className={line.className}
          dir="auto"
          style={{
            fontFamily: sampleFontFamily(style.id),
            fontSize: line.size,
            lineHeight: line.lineHeight,
            // opsz follows each line's size; the other Axes come from the role.
            ...variationStyle(style, axisValues, true),
          }}
        >
          {line.text || `${style.familyName} ${style.styleName}`}
        </p>
      ))}
    </div>
  );
}

/** One role's section in the inspector: size, line height, and its Axes. */
function RoleControls({
  pairingRole: role,
  slot,
  size,
  sizeRange,
  defaultSize,
  lineHeight,
  lineHeightRange,
  defaultLineHeight,
  onChange,
}: {
  pairingRole: PairingRole;
  slot: ResolvedSlot;
  size: number;
  sizeRange: [number, number];
  defaultSize: number;
  lineHeight: number;
  lineHeightRange: [number, number];
  defaultLineHeight: number;
  onChange: (changes: {
    size?: number;
    lineHeight?: number;
    axisValues?: Record<string, number>;
  }) => void;
}): React.JSX.Element {
  const style = slot.status === "ready" ? slot.style : null;
  const axisValues = slot.status === "ready" ? slot.axisValues : {};
  // Optical size follows each line's size by itself, so it has no slider here.
  const axes = style?.axes.filter((axis) => axis.tag !== "opsz") ?? [];

  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{roleLabels[role]}</h2>
        {style && axes.length > 0 && (
          <button
            type="button"
            className={controls.textButton}
            onClick={() => onChange({ axisValues: defaultAxisValues(style) })}
          >
            Reset Axes
          </button>
        )}
      </header>
      <div className={styles.sectionBody}>
        <LabeledSlider
          label="Size"
          value={size}
          min={sizeRange[0]}
          max={sizeRange[1]}
          defaultValue={defaultSize}
          format={(value) => `${value} px`}
          onChange={(next) => onChange({ size: next })}
        />
        <LabeledSlider
          label="Line height"
          value={lineHeight}
          min={lineHeightRange[0]}
          max={lineHeightRange[1]}
          step={0.01}
          defaultValue={defaultLineHeight}
          format={(value) => value.toFixed(2)}
          onChange={(next) => onChange({ lineHeight: next })}
        />
        {axes.map((axis) => (
          <LabeledSlider
            key={axis.tag}
            label={axisLabel(axis)}
            value={axisValues[axis.tag] ?? axis.default}
            min={axis.min}
            max={axis.max}
            step={axis.max - axis.min <= 2 ? 0.01 : 1}
            defaultValue={axis.default}
            format={(value) => String(Math.round(value * 100) / 100)}
            onChange={(value) =>
              onChange({ axisValues: { ...axisValues, [axis.tag]: value } })
            }
          />
        ))}
      </div>
    </section>
  );
}
