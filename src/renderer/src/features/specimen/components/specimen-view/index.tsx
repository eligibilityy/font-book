import { Menu } from "@base-ui/react/menu";
import { Select } from "@base-ui/react/select";
import {
  type Classification,
  classificationLabels,
  classifications,
} from "@shared/classification";
import type { Style } from "@shared/contracts/library";
import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { sampleFontFamily } from "@/shared/font-faces/registry";
import { useStyleFace } from "@/shared/font-faces/use-style-face";
import controls from "@/shared/ui/controls.module.css";
import { IconButton } from "@/shared/ui/icon-button";
import {
  CheckIcon,
  ChevronDownIcon,
  InspectorIcon,
  PaperInkIcon,
  PlusIcon,
  StarIcon,
} from "@/shared/ui/icons";
import { LabeledSlider } from "@/shared/ui/labeled-slider";
import {
  type AxisValues,
  defaultAxisValues,
  matchingInstance,
  variationStyle,
} from "../../axes";
import { Inspector } from "../inspector";
import styles from "./styles.module.css";

export interface SpecimenSettings {
  size: number;
  lineHeight: number;
  tracking: number;
  paperReversed: boolean;
  inspectorOpen: boolean;
}

interface SpecimenViewProps {
  /** The Family's Styles, in picker order. */
  styles: Style[];
  style: Style;
  familyName: string;
  onStyleChange: (style: Style) => void;
  sampleText: string;
  onSampleTextChange: (text: string) => void;
  settings: SpecimenSettings;
  onSettingsChange: (changes: Partial<SpecimenSettings>) => void;
  classification: Classification;
  isClassificationGuess: boolean;
  onClassificationChange: (classification: Classification | null) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** Renders the Add to Collection popover around the given trigger button. */
  renderAddToCollection: (trigger: React.ReactElement) => React.ReactNode;
  /** For Styles installed twice: each copy's own Font folder name, for the picker. */
  duplicateFolders: ReadonlyMap<string, string>;
  /** For Styles installed twice: where the other copy is, for About this Style. */
  otherCopyFolders: ReadonlyMap<string, string>;
  fileManagerName: string;
  onShowInFolder: (style: Style) => void;
  /** Puts this Style in the Pairing, with the Axis values it has here. */
  onUseAs: (role: "heading" | "body", axisValues: AxisValues) => void;
  onOpenPairing: () => void;
  onBack: () => void;
  regionRef: React.RefObject<HTMLElement | null>;
}

/** Judge one Style properly: its Sample text large, with every control at hand. */
export function SpecimenView(props: SpecimenViewProps): React.JSX.Element {
  const { style, settings, onSettingsChange } = props;
  const status = useStyleFace(style, { priority: true });
  const [axisValues, setAxisValues] = useState<AxisValues>(() =>
    defaultAxisValues(style),
  );
  const [matchOpticalSize, setMatchOpticalSize] = useState(true);
  const [axesFor, setAxesFor] = useState(style.id);
  const textRef = useRef<HTMLTextAreaElement | null>(null);

  // A new Style starts at its own defaults (adjusting state while rendering,
  // instead of an effect, so the old Style's Axes never show for a frame).
  if (axesFor !== style.id) {
    setAxesFor(style.id);
    setAxisValues(defaultAxisValues(style));
    setMatchOpticalSize(true);
  }

  // The text column narrows the moment the inspector opens and widens only
  // after it has slid away: two reflows, never one per animation frame.
  const [hasInspectorSpace, setHasInspectorSpace] = useState(
    settings.inspectorOpen,
  );
  if (settings.inspectorOpen && !hasInspectorSpace) setHasInspectorSpace(true);

  const showLoading = useDelayedFlag(status === "loading", 150);
  const ink = settings.paperReversed
    ? "var(--specimen-paper)"
    : "var(--specimen-ink)";
  const paper = settings.paperReversed
    ? "var(--specimen-ink)"
    : "var(--specimen-paper)";

  return (
    <section
      ref={props.regionRef}
      className={styles.specimen}
      aria-label={`Specimen of ${style.familyName} ${style.styleName}`}
      tabIndex={-1}
      onKeyDown={(event) => {
        // Keys from menus and popovers (rendered in portals, outside this
        // element) and from text fields are theirs, not the Specimen's.
        const target = event.target;
        if (
          !(target instanceof HTMLElement) ||
          !event.currentTarget.contains(target)
        )
          return;
        if (
          target.matches("input, textarea, [role='slider']") ||
          event.defaultPrevented
        )
          return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        if (event.key === "Escape") {
          event.preventDefault();
          props.onBack();
        } else if (event.key === "f" || event.key === "F") {
          event.preventDefault();
          props.onToggleFavorite();
        }
      }}
    >
      <SpecimenHeader
        {...props}
        axisValues={axisValues}
        onAxisValuesChange={setAxisValues}
      />

      <div className={styles.body}>
        <div
          className={styles.paper}
          style={{ background: paper, color: ink }}
          data-inspector-space={hasInspectorSpace ? "" : undefined}
        >
          {status === "ready" ? (
            <textarea
              ref={textRef}
              className={styles.text}
              value={props.sampleText}
              placeholder={`${style.familyName} ${style.styleName}`}
              aria-label={`Sample text, in ${style.familyName} ${style.styleName}`}
              dir="auto"
              spellCheck={false}
              rows={1}
              style={{
                fontFamily: sampleFontFamily(style.id),
                fontSize: settings.size,
                lineHeight: settings.lineHeight,
                letterSpacing: `${settings.tracking / 1000}em`,
                ...variationStyle(style, axisValues, matchOpticalSize),
              }}
              onChange={(event) =>
                // Sample text is one line that wraps: pasted line breaks become spaces.
                props.onSampleTextChange(
                  event.target.value.replace(/\s*\n\s*/g, " "),
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  props.regionRef.current?.focus();
                }
              }}
            />
          ) : (
            <SpecimenMessage
              status={status}
              showLoading={showLoading}
              style={style}
              fileManagerName={props.fileManagerName}
              onShowInFolder={() => props.onShowInFolder(style)}
            />
          )}
        </div>

        <Inspector
          open={settings.inspectorOpen}
          style={style}
          settings={settings}
          onSettingsChange={onSettingsChange}
          axisValues={axisValues}
          onAxisValuesChange={setAxisValues}
          matchOpticalSize={matchOpticalSize}
          onMatchOpticalSizeChange={setMatchOpticalSize}
          duplicateFolder={props.otherCopyFolders.get(style.id) ?? null}
          fileManagerName={props.fileManagerName}
          onShowInFolder={() => props.onShowInFolder(style)}
          onExitComplete={() => setHasInspectorSpace(false)}
        />
      </div>
    </section>
  );
}

function SpecimenHeader({
  styles: familyStyles,
  style,
  familyName,
  onStyleChange,
  settings,
  onSettingsChange,
  classification,
  isClassificationGuess,
  onClassificationChange,
  isFavorite,
  onToggleFavorite,
  renderAddToCollection,
  duplicateFolders,
  axisValues,
  onAxisValuesChange,
  onUseAs,
  onOpenPairing,
}: SpecimenViewProps & {
  axisValues: AxisValues;
  onAxisValuesChange: (values: AxisValues) => void;
}): React.JSX.Element {
  const [starScope, animateStar] = useAnimate<HTMLSpanElement>();
  const prefersReducedMotion = useReducedMotion();

  return (
    <header className={styles.header}>
      <div className={styles.headerRow}>
        <h1 className={styles.familyName} title={familyName}>
          {familyName}
        </h1>
        <ClassificationButton
          classification={classification}
          isGuess={isClassificationGuess}
          onChange={onClassificationChange}
        />
        <div className={styles.actions}>
          <PairMenu
            onUseAs={(role) => onUseAs(role, axisValues)}
            onOpenPairing={onOpenPairing}
          />
          <IconButton
            label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            aria-pressed={isFavorite}
            onClick={() => {
              // The pop plays on click only; the F key and un-starring are instant.
              if (!isFavorite && !prefersReducedMotion && starScope.current) {
                void animateStar(
                  starScope.current,
                  { scale: [1, 1.15, 1] },
                  { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
                );
              }
              onToggleFavorite();
            }}
          >
            <span ref={starScope} className={styles.star}>
              <StarIcon filled={isFavorite} />
            </span>
          </IconButton>
          {renderAddToCollection(
            <IconButton label="Add to Collection">
              <PlusIcon />
            </IconButton>,
          )}
          <IconButton
            label="Reverse Paper and Ink"
            aria-pressed={settings.paperReversed}
            onClick={() =>
              onSettingsChange({ paperReversed: !settings.paperReversed })
            }
          >
            <PaperInkIcon />
          </IconButton>
          <IconButton
            label={settings.inspectorOpen ? "Hide Inspector" : "Show Inspector"}
            aria-pressed={settings.inspectorOpen}
            onClick={() =>
              onSettingsChange({ inspectorOpen: !settings.inspectorOpen })
            }
          >
            <InspectorIcon />
          </IconButton>
        </div>
      </div>
      <div className={styles.headerRow}>
        <StylePicker
          styles={familyStyles}
          style={style}
          axisValues={axisValues}
          duplicateFolders={duplicateFolders}
          onChange={(next, values) => {
            onStyleChange(next);
            if (values) onAxisValuesChange(values);
          }}
        />
        {style.axes.length > 0 && (
          <button
            type="button"
            className={controls.textButton}
            onClick={() => onSettingsChange({ inspectorOpen: true })}
          >
            {style.axes.length === 1 ? "1 Axis" : `${style.axes.length} Axes`}
          </button>
        )}
        <div className={styles.size}>
          <LabeledSlider
            label="Size"
            hideLabel
            value={settings.size}
            min={8}
            max={300}
            defaultValue={64}
            format={(value) => `${value} px`}
            onChange={(size) => onSettingsChange({ size })}
          />
        </div>
      </div>
    </header>
  );
}

const instanceSeparator = "\u0000";

/**
 * The Family's Styles in weight order. A variable Style lists its Named
 * instances under it; choosing one moves the Axis sliders.
 */
function StylePicker({
  styles: familyStyles,
  style,
  axisValues,
  duplicateFolders,
  onChange,
}: {
  styles: Style[];
  style: Style;
  axisValues: AxisValues;
  duplicateFolders: ReadonlyMap<string, string>;
  onChange: (style: Style, values: AxisValues | null) => void;
}): React.JSX.Element {
  const options = useMemo(() => {
    const list: {
      value: string;
      label: string;
      style: Style;
      values: AxisValues | null;
      indent: boolean;
    }[] = [];
    for (const familyStyle of familyStyles) {
      const folder = duplicateFolders.get(familyStyle.id);
      list.push({
        value: familyStyle.id,
        label: folder
          ? `${familyStyle.styleName}, ${folder}`
          : familyStyle.styleName,
        style: familyStyle,
        values: null,
        indent: false,
      });
      for (const instance of familyStyle.namedInstances) {
        list.push({
          value: `${familyStyle.id}${instanceSeparator}${instance.name}`,
          label: instance.name,
          style: familyStyle,
          values: {
            ...defaultAxisValues(familyStyle),
            ...instance.coordinates,
          },
          indent: true,
        });
      }
    }
    return list;
  }, [familyStyles, duplicateFolders]);

  const instance = matchingInstance(style, axisValues);
  const value = instance
    ? `${style.id}${instanceSeparator}${instance.name}`
    : style.id;
  const items = Object.fromEntries(
    options.map((option) => [option.value, option.label]),
  );
  // The trigger says which Named instance the Axes match, or "Custom".
  if (style.namedInstances.length > 0) {
    items[style.id] =
      `${style.styleName}, ${instance ? instance.name : "Custom"}`;
  }

  return (
    <Select.Root
      items={items}
      value={value}
      onValueChange={(next) => {
        const option = options.find((candidate) => candidate.value === next);
        if (option)
          onChange(
            option.style,
            option.values ?? defaultAxisValues(option.style),
          );
      }}
    >
      <Select.Trigger className={controls.selectTrigger} aria-label="Style">
        <Select.Value className={controls.selectValue} />
        <Select.Icon className={controls.selectIcon}>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className={controls.positioner}
          sideOffset={4}
          alignItemWithTrigger={false}
          align="start"
        >
          <Select.Popup className={controls.popup}>
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className={controls.item}
                  style={option.indent ? { paddingLeft: 28 } : undefined}
                >
                  <span className={controls.itemIndicator}>
                    <Select.ItemIndicator>
                      <CheckIcon />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemText className={controls.itemLabel}>
                    {option.label}
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

/** "Pair": put this Style in the Pairing as its heading or its body. */
function PairMenu({
  onUseAs,
  onOpenPairing,
}: {
  onUseAs: (role: "heading" | "body") => void;
  onOpenPairing: () => void;
}): React.JSX.Element {
  return (
    <Menu.Root>
      <Menu.Trigger className={controls.textButton}>
        Pair
        <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={controls.positioner}
          sideOffset={4}
          align="end"
        >
          <Menu.Popup className={controls.popup}>
            <Menu.Item
              className={controls.item}
              onClick={() => onUseAs("heading")}
            >
              <span className={controls.itemLabel}>Use as Heading</span>
            </Menu.Item>
            <Menu.Item
              className={controls.item}
              onClick={() => onUseAs("body")}
            >
              <span className={controls.itemLabel}>Use as Body</span>
            </Menu.Item>
            <Menu.Separator className={controls.separator} />
            <Menu.Item className={controls.item} onClick={onOpenPairing}>
              <span className={controls.itemLabel}>Open Pairing</span>
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const GUESS = "guess";

function ClassificationButton({
  classification,
  isGuess,
  onChange,
}: {
  classification: Classification;
  isGuess: boolean;
  onChange: (classification: Classification | null) => void;
}): React.JSX.Element {
  return (
    <Menu.Root>
      <Menu.Trigger
        className={controls.textButton}
        aria-label="Set Classification"
      >
        <span className={isGuess ? styles.guess : undefined}>
          {classificationLabels[classification]}
          {isGuess && ", guessed"}
        </span>
        <ChevronDownIcon />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          className={controls.positioner}
          sideOffset={4}
          align="start"
        >
          <Menu.Popup className={controls.popup}>
            <Menu.RadioGroup
              value={isGuess ? GUESS : classification}
              onValueChange={(value) => {
                if (value === GUESS) onChange(null);
                const chosen = classifications.find(
                  (option) => option === value,
                );
                if (chosen) onChange(chosen);
              }}
            >
              {classifications.map((option) => (
                <Menu.RadioItem
                  key={option}
                  value={option}
                  className={controls.item}
                >
                  <span className={controls.itemIndicator}>
                    <Menu.RadioItemIndicator>
                      <CheckIcon />
                    </Menu.RadioItemIndicator>
                  </span>
                  {classificationLabels[option]}
                </Menu.RadioItem>
              ))}
              <Menu.Separator className={controls.separator} />
              <Menu.RadioItem value={GUESS} className={controls.item}>
                <span className={controls.itemIndicator}>
                  <Menu.RadioItemIndicator>
                    <CheckIcon />
                  </Menu.RadioItemIndicator>
                </span>
                Use Guess from Font File
              </Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function SpecimenMessage({
  status,
  showLoading,
  style,
  fileManagerName,
  onShowInFolder,
}: {
  status: string;
  showLoading: boolean;
  style: Style;
  fileManagerName: string;
  onShowInFolder: () => void;
}): React.JSX.Element {
  const name = `${style.familyName} ${style.styleName}`;
  if (status === "loading") {
    // Nothing for the first 150ms, so a fast load never flashes a message.
    return (
      <p className={styles.message}>
        {showLoading ? `Loading ${name}...` : ""}
      </p>
    );
  }
  if (status === "missing") {
    return (
      <div className={styles.message}>
        <p className={styles.messageTitle}>{name}</p>
        <p>
          This Style's Font file is no longer in your Font folders. It may have
          been moved or removed.
        </p>
      </div>
    );
  }
  return (
    <div className={styles.message}>
      <p className={styles.messageTitle}>{name}</p>
      <p>
        This Style can't be previewed. The Font file may be damaged, or use a
        format Book can't draw.
      </p>
      <button
        type="button"
        className={controls.button}
        onClick={onShowInFolder}
      >
        Show in {fileManagerName}
      </button>
    </div>
  );
}

/** True once `active` has stayed true for `delayMs`. */
function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [isLate, setIsLate] = useState(false);
  useEffect(() => {
    if (!active) {
      setIsLate(false);
      return;
    }
    const timer = setTimeout(() => setIsLate(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);
  return isLate;
}
