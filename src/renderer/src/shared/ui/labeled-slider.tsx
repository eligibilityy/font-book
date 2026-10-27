import { Slider } from "@base-ui/react/slider";
import controls from "./controls.module.css";
import styles from "./labeled-slider.module.css";

interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Double-clicking the track goes back to this value. */
  defaultValue: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  disabled?: boolean;
  /** Visually hide the label (it is still read out), for tight headers. */
  hideLabel?: boolean;
}

/**
 * A slider with its label and value: arrow keys step by one step, Shift+Arrow
 * by ten. The type follows the thumb on every movement, with no animation.
 */
export function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue,
  onChange,
  format = String,
  disabled = false,
  hideLabel = false,
}: LabeledSliderProps): React.JSX.Element {
  return (
    <div className={hideLabel ? styles.rowWithoutLabel : styles.row}>
      <span className={hideLabel ? "visually-hidden" : styles.label}>
        {label}
      </span>
      <Slider.Root
        className={controls.slider}
        value={value}
        min={min}
        max={max}
        step={step}
        largeStep={step * 10}
        disabled={disabled}
        onValueChange={(next) => {
          const number = Array.isArray(next) ? next[0] : next;
          if (typeof number === "number") onChange(number);
        }}
      >
        <Slider.Control
          className={controls.sliderControl}
          onDoubleClick={() => onChange(defaultValue)}
        >
          <Slider.Track className={controls.sliderTrack}>
            <Slider.Indicator className={controls.sliderIndicator} />
            <Slider.Thumb className={controls.sliderThumb} aria-label={label} />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <output className={styles.value}>{format(value)}</output>
    </div>
  );
}
