/**
 * Book's icons: 16px, 1.5px strokes in currentColor. Always paired with an
 * accessible label on the control that holds them.
 */

interface IconProps {
  className?: string | undefined;
}

function Icon({
  className,
  children,
}: IconProps & { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function StarIcon({
  filled = false,
  className,
}: IconProps & { filled?: boolean }): React.JSX.Element {
  return (
    <Icon className={className}>
      <path
        d="M8 1.9l1.85 3.75 4.15.6-3 2.92.71 4.13L8 11.35 4.29 13.3 5 9.17 2 6.25l4.15-.6z"
        fill={filled ? "currentColor" : "none"}
      />
    </Icon>
  );
}

export function PlusIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M8 3v10M3 8h10" />
    </Icon>
  );
}

export function ChevronLeftIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M10 3.5L5.5 8l4.5 4.5" />
    </Icon>
  );
}

export function ChevronRightIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M6 3.5L10.5 8 6 12.5" />
    </Icon>
  );
}

export function ChevronDownIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M4 6l4 4 4-4" />
    </Icon>
  );
}

export function CheckIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M3.5 8.5l3 3 6-7" />
    </Icon>
  );
}

/** Paper and ink: a circle, half filled. */
export function PaperInkIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <circle cx="8" cy="8" r="5.75" />
      <path d="M8 2.25a5.75 5.75 0 0 1 0 11.5z" fill="currentColor" />
    </Icon>
  );
}

/** A panel on the right edge. */
export function InspectorIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <rect x="2" y="2.75" width="12" height="10.5" rx="2" />
      <path d="M10 2.75v10.5" />
    </Icon>
  );
}

/** A panel on the left edge. */
export function SidebarIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <rect x="2" y="2.75" width="12" height="10.5" rx="2" />
      <path d="M6 2.75v10.5" />
    </Icon>
  );
}

export function SearchIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.25 10.25L13.5 13.5" />
    </Icon>
  );
}

export function CloseIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
    </Icon>
  );
}
