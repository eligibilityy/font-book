import { Select } from "@base-ui/react/select";
import {
  type Classification,
  classificationLabels,
  classifications,
} from "@shared/classification";
import controls from "@/shared/ui/controls.module.css";
import { CheckIcon, ChevronDownIcon } from "@/shared/ui/icons";

export type ClassificationFilter = Classification | "any";

const ANY_LABEL = "Any Classification";

const items: Record<ClassificationFilter, string> = {
  any: ANY_LABEL,
  ...classificationLabels,
};

interface ClassificationSelectProps {
  value: ClassificationFilter;
  onChange: (value: ClassificationFilter) => void;
  /** Families in the current view per Classification, before this filter. */
  counts: ReadonlyMap<Classification, number>;
}

/** Narrows the list to one Classification. See ui-spec: Classification filter. */
export function ClassificationSelect({
  value,
  onChange,
  counts,
}: ClassificationSelectProps): React.JSX.Element {
  const options: ClassificationFilter[] = ["any", ...classifications];
  return (
    <Select.Root
      items={items}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
    >
      <Select.Trigger
        className={controls.selectTrigger}
        aria-label="Classification"
      >
        <Select.Value className={controls.selectValue} />
        <Select.Icon className={controls.selectIcon}>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className={controls.positioner}
          sideOffset={4}
          align="start"
          alignItemWithTrigger={false}
        >
          <Select.Popup className={controls.popup}>
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option}
                  value={option}
                  className={controls.item}
                >
                  <span className={controls.itemIndicator}>
                    <Select.ItemIndicator>
                      <CheckIcon />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemText className={controls.itemLabel}>
                    {items[option]}
                  </Select.ItemText>
                  {option !== "any" && (
                    <span className={controls.itemHint}>
                      {counts.get(option) ?? 0}
                    </span>
                  )}
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
