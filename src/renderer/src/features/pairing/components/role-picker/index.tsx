import { Combobox } from "@base-ui/react/combobox";
import { Select } from "@base-ui/react/select";
import type { Style } from "@shared/contracts/library";
import type { Family } from "@/features/library";
import controls from "@/shared/ui/controls.module.css";
import { IconButton } from "@/shared/ui/icon-button";
import { CheckIcon, ChevronDownIcon, OpenIcon } from "@/shared/ui/icons";
import { type PairingRole, type ResolvedSlot, roleLabels } from "../../pairing";
import styles from "./styles.module.css";

/**
 * Closing a popup focuses the Pairing page itself. Given the page as a
 * target, Base UI would focus the first control inside it instead, so focus
 * moves after the popup has finished, and Base UI is told to leave it.
 */
function focusLater(target: React.RefObject<HTMLElement | null>): false {
  requestAnimationFrame(() => target.current?.focus());
  return false;
}

/** Rows the Family picker draws at once; typing narrows the rest. */
const PICKER_LIMIT = 80;

interface RolePickerProps {
  role: PairingRole;
  slot: ResolvedSlot;
  /** The role arrow keys step through. */
  isActive: boolean;
  onActivate: () => void;
  families: readonly Family[];
  familyOf: (style: Style) => Family | undefined;
  onChoose: (style: Style) => void;
  /** While she arrows through the Family picker: show that Family on the page. */
  onPreview: (style: Style | null) => void;
  onOpenSpecimen: (style: Style) => void;
  /**
   * Where focus goes when a picker closes: the Pairing page, so the arrow
   * keys step through Styles again straight away.
   */
  returnFocusTo: React.RefObject<HTMLElement | null>;
}

/**
 * One role in the Pairing header: which Family, which of its Styles, and a
 * way to its Specimen. Choosing happens here, without leaving the Pairing.
 */
export function RolePicker({
  role,
  slot,
  isActive,
  onActivate,
  families,
  familyOf,
  onChoose,
  onPreview,
  onOpenSpecimen,
  returnFocusTo,
}: RolePickerProps): React.JSX.Element {
  const style = slot.status === "ready" ? slot.style : null;
  const family = style ? (familyOf(style) ?? null) : null;

  return (
    <div
      className={styles.role}
      data-active={isActive ? "" : undefined}
      onPointerDown={onActivate}
    >
      <span className={styles.label}>{roleLabels[role]}</span>
      <div className={styles.controls}>
        <FamilyPicker
          role={role}
          family={family}
          missingName={
            slot.status === "missing" ? `${slot.ref.familyName}, missing` : null
          }
          families={families}
          onChoose={onChoose}
          onPreview={onPreview}
          returnFocusTo={returnFocusTo}
        />
        {style && family && family.styles.length > 1 && (
          <StyleSelect
            style={style}
            family={family}
            onChoose={onChoose}
            returnFocusTo={returnFocusTo}
          />
        )}
        {style && (
          <IconButton
            label={`Open the Specimen of ${style.familyName} ${style.styleName}`}
            className={styles.openButton}
            onClick={() => onOpenSpecimen(style)}
          >
            <OpenIcon />
          </IconButton>
        )}
      </div>
    </div>
  );
}

/**
 * A searchable list of every Family. Arrowing over one shows it on the page
 * at once, so she can try Families on before choosing; closing without
 * choosing puts the page back.
 */
function FamilyPicker({
  role,
  family,
  missingName,
  families,
  onChoose,
  onPreview,
  returnFocusTo,
}: {
  role: PairingRole;
  family: Family | null;
  missingName: string | null;
  families: readonly Family[];
  onChoose: (style: Style) => void;
  onPreview: (style: Style | null) => void;
  returnFocusTo: React.RefObject<HTMLElement | null>;
}): React.JSX.Element {
  return (
    <Combobox.Root
      items={families}
      value={family}
      limit={PICKER_LIMIT}
      // Typing highlights, and so previews, the first match; Enter takes it.
      autoHighlight
      itemToStringLabel={(item: Family) => item.name}
      isItemEqualToValue={(item: Family, value: Family) =>
        item.key === value.key
      }
      onValueChange={(next) => {
        if (next) onChoose(next.representative);
      }}
      onItemHighlighted={(item) => onPreview(item ? item.representative : null)}
      onOpenChange={(open) => {
        if (!open) onPreview(null);
      }}
    >
      <Combobox.Trigger
        className={styles.familyTrigger}
        aria-label={`${roleLabels[role]} Family`}
      >
        <span className={family ? undefined : styles.placeholder}>
          {family?.name ?? missingName ?? `Choose a ${roleLabels[role]}`}
        </span>
        <ChevronDownIcon />
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner
          className={controls.positioner}
          sideOffset={4}
          align="start"
        >
          <Combobox.Popup
            className={`${controls.popup} ${styles.pickerPopup}`}
            aria-label={`Choose the ${roleLabels[role]} Family`}
            finalFocus={() => focusLater(returnFocusTo)}
          >
            <Combobox.Input
              className={`${controls.field} ${styles.pickerInput}`}
              placeholder="Search Families"
              spellCheck={false}
            />
            <Combobox.Empty className={styles.pickerEmpty}>
              No Families match.
            </Combobox.Empty>
            <Combobox.List className={styles.pickerList}>
              {(item: Family) => (
                <Combobox.Item
                  key={item.key}
                  value={item}
                  className={controls.item}
                >
                  <span className={controls.itemIndicator}>
                    <Combobox.ItemIndicator>
                      <CheckIcon />
                    </Combobox.ItemIndicator>
                  </span>
                  <span className={controls.itemLabel}>{item.name}</span>
                  <span className={controls.itemHint}>
                    {item.styles.length}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** The role's Style within its Family: Bold or Black, without a Specimen. */
function StyleSelect({
  style,
  family,
  onChoose,
  returnFocusTo,
}: {
  style: Style;
  family: Family;
  onChoose: (style: Style) => void;
  returnFocusTo: React.RefObject<HTMLElement | null>;
}): React.JSX.Element {
  const items = Object.fromEntries(
    family.styles.map((candidate) => [candidate.id, candidate.styleName]),
  );
  return (
    <Select.Root
      items={items}
      value={style.id}
      onValueChange={(id) => {
        const next = family.styles.find((candidate) => candidate.id === id);
        if (next) onChoose(next);
      }}
    >
      <Select.Trigger className={styles.styleTrigger} aria-label="Style">
        <Select.Value />
        <ChevronDownIcon />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className={controls.positioner}
          sideOffset={4}
          alignItemWithTrigger={false}
          align="start"
        >
          <Select.Popup
            className={controls.popup}
            finalFocus={() => focusLater(returnFocusTo)}
          >
            <Select.List>
              {family.styles.map((candidate) => (
                <Select.Item
                  key={candidate.id}
                  value={candidate.id}
                  className={controls.item}
                >
                  <span className={controls.itemIndicator}>
                    <Select.ItemIndicator>
                      <CheckIcon />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemText className={controls.itemLabel}>
                    {candidate.styleName}
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
