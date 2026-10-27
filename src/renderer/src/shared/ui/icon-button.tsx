import { Tooltip } from "@base-ui/react/tooltip";
import controls from "./controls.module.css";

interface IconButtonProps
  extends Omit<React.ComponentProps<"button">, "aria-label"> {
  /** Read by screen readers and shown as the tooltip. Required: the button has no text. */
  label: string;
}

/** A 28px icon-only button with a tooltip naming what it does. */
export function IconButton({
  label,
  className,
  children,
  ...buttonProps
}: IconButtonProps): React.JSX.Element {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <button
            type="button"
            aria-label={label}
            className={className ?? controls.iconButton}
            {...buttonProps}
          />
        }
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6} className={controls.positioner}>
          <Tooltip.Popup className={controls.tooltip}>{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
