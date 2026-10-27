import { Switch } from "@base-ui/react/switch";
import type { Axis, Embedding, Style } from "@shared/contracts/library";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { EASE_OUT } from "@/shared/motion";
import controls from "@/shared/ui/controls.module.css";
import { LabeledSlider } from "@/shared/ui/labeled-slider";
import { type AxisValues, axisLabel, defaultAxisValues } from "../../axes";
import type { SpecimenSettings } from "../specimen-view";
import styles from "./styles.module.css";

interface InspectorProps {
  open: boolean;
  style: Style;
  settings: SpecimenSettings;
  onSettingsChange: (changes: Partial<SpecimenSettings>) => void;
  axisValues: AxisValues;
  onAxisValuesChange: (values: AxisValues) => void;
  matchOpticalSize: boolean;
  onMatchOpticalSizeChange: (match: boolean) => void;
  duplicateFolder: string | null;
  fileManagerName: string;
  onShowInFolder: () => void;
  /** After the slide-out finishes, so the text can widen in one step. */
  onExitComplete: () => void;
}

/**
 * Depth on demand: Text, Axes, and About this Style, in a panel on the
 * Specimen's right edge. It slides in over 280ms and out over 180ms.
 */
export function Inspector(props: InspectorProps): React.JSX.Element {
  return (
    <AnimatePresence initial={false} onExitComplete={props.onExitComplete}>
      {props.open && (
        <motion.aside
          key="inspector"
          className={styles.inspector}
          aria-label="Inspector"
          initial={{ x: "100%", opacity: 0 }}
          animate={{
            x: 0,
            opacity: 1,
            transition: { duration: 0.28, ease: EASE_OUT },
          }}
          exit={{
            x: "100%",
            opacity: 0,
            transition: { duration: 0.18, ease: EASE_OUT },
          }}
        >
          <InspectorSections {...props} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function InspectorSections({
  style,
  settings,
  onSettingsChange,
  axisValues,
  onAxisValuesChange,
  matchOpticalSize,
  onMatchOpticalSizeChange,
  duplicateFolder,
  fileManagerName,
  onShowInFolder,
}: InspectorProps): React.JSX.Element {
  return (
    <>
      <Section title="Text">
        <LabeledSlider
          label="Line height"
          value={settings.lineHeight}
          min={0.8}
          max={2}
          step={0.01}
          defaultValue={1.1}
          format={(value) => value.toFixed(2)}
          onChange={(lineHeight) => onSettingsChange({ lineHeight })}
        />
        <LabeledSlider
          label="Tracking"
          value={settings.tracking}
          min={-100}
          max={300}
          defaultValue={0}
          onChange={(tracking) => onSettingsChange({ tracking })}
        />
      </Section>

      {style.axes.length > 0 && (
        <Section
          title="Axes"
          action={
            <button
              type="button"
              className={controls.textButton}
              onClick={() => {
                onAxisValuesChange(defaultAxisValues(style));
                onMatchOpticalSizeChange(true);
              }}
            >
              Reset Axes
            </button>
          }
        >
          {style.axes.map((axis) => {
            const isOpticalSize = axis.tag === "opsz";
            const isFollowingSize = isOpticalSize && matchOpticalSize;
            return (
              <div key={axis.tag} className={styles.axis}>
                <LabeledSlider
                  label={axisSliderLabel(axis)}
                  value={
                    isFollowingSize
                      ? Math.min(axis.max, Math.max(axis.min, settings.size))
                      : (axisValues[axis.tag] ?? axis.default)
                  }
                  min={axis.min}
                  max={axis.max}
                  step={axis.max - axis.min <= 2 ? 0.01 : 1}
                  defaultValue={axis.default}
                  disabled={isFollowingSize}
                  format={(value) => String(Math.round(value * 100) / 100)}
                  onChange={(value) =>
                    onAxisValuesChange({ ...axisValues, [axis.tag]: value })
                  }
                />
                {isOpticalSize && (
                  <div className={styles.switchRow}>
                    <Switch.Root
                      className={controls.switch}
                      aria-labelledby={`${axis.tag}-match-size`}
                      checked={matchOpticalSize}
                      onCheckedChange={(checked) =>
                        onMatchOpticalSizeChange(checked)
                      }
                    >
                      <Switch.Thumb className={controls.switchThumb} />
                    </Switch.Root>
                    <span id={`${axis.tag}-match-size`}>Match Size</span>
                  </div>
                )}
              </div>
            );
          })}
        </Section>
      )}

      <Section title="About this Style">
        <AboutThisStyle
          style={style}
          duplicateFolder={duplicateFolder}
          fileManagerName={fileManagerName}
          onShowInFolder={onShowInFolder}
        />
      </Section>
    </>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {action}
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

/** "Weight wght"; just "MONO" when the Font file names an Axis by its tag. */
function axisSliderLabel(axis: Axis): string {
  const label = axisLabel(axis);
  return label.toLowerCase() === axis.tag.toLowerCase()
    ? axis.tag
    : `${label} ${axis.tag}`;
}

const embeddingLabels: Record<Embedding, string> = {
  installable: "Installable",
  editable: "Editable",
  "preview-and-print": "Preview and print",
  restricted: "Restricted",
};

/** The Font file's own credits, shown as written. Book never judges a license. */
function AboutThisStyle({
  style,
  duplicateFolder,
  fileManagerName,
  onShowInFolder,
}: {
  style: Style;
  duplicateFolder: string | null;
  fileManagerName: string;
  onShowInFolder: () => void;
}): React.JSX.Element {
  const [showFullLicense, setShowFullLicense] = useState(false);
  const fields: [string, string | null][] = [
    ["Designer", style.designer],
    ["Foundry", style.foundry],
    ["Version", style.version],
    ["Copyright", style.copyright],
  ];

  return (
    <>
      <dl className={styles.about}>
        {fields.map(([label, value]) =>
          value ? (
            <div key={label} className={styles.field}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ) : null,
        )}
        {style.license && (
          <div className={styles.field}>
            <dt>License</dt>
            <dd className={showFullLicense ? undefined : styles.clamped}>
              {style.license}
            </dd>
            {style.license.length > 200 && (
              <button
                type="button"
                className={controls.textButton}
                onClick={() => setShowFullLicense((shown) => !shown)}
              >
                {showFullLicense ? "Show Less" : "Show More"}
              </button>
            )}
          </div>
        )}
        {style.licenseUrl && (
          <div className={styles.field}>
            <dt>License URL</dt>
            <dd>{style.licenseUrl}</dd>
          </div>
        )}
        <div className={styles.field}>
          <dt>Embedding</dt>
          <dd>{embeddingLabels[style.embedding]}</dd>
        </div>
        <div className={styles.field}>
          <dt>Font file</dt>
          <dd>{style.fontFile.name}</dd>
        </div>
        <div className={styles.field}>
          <dt>Font folder</dt>
          <dd>{style.fontFile.folderPath}</dd>
        </div>
        {duplicateFolder && (
          <div className={styles.field}>
            <dd>Another copy is in {duplicateFolder}</dd>
          </div>
        )}
      </dl>
      <button
        type="button"
        className={controls.button}
        onClick={onShowInFolder}
      >
        Show in {fileManagerName}
      </button>
    </>
  );
}
