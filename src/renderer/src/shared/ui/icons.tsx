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

/** An arrow leaving a corner: open this somewhere fuller (a Specimen). */
export function OpenIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M6.5 3.5h-2a1.5 1.5 0 0 0-1.5 1.5v6.5A1.5 1.5 0 0 0 4.5 13H11a1.5 1.5 0 0 0 1.5-1.5v-2M9 3h4v4M13 3L7.5 8.5" />
    </Icon>
  );
}

/** An arrow out of a tray: Export PNG. */
export function ExportIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M8 9.5v-7M5 5.25L8 2.5l3 2.75M2.5 9.5v2.75a1.25 1.25 0 0 0 1.25 1.25h8.5a1.25 1.25 0 0 0 1.25-1.25V9.5" />
    </Icon>
  );
}

/** An arrow into a tray: Import, and the Imported Library filter. */
export function ImportIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M8 2.5v7M5 6.75L8 9.5l3-2.75M2.5 9.5v2.75a1.25 1.25 0 0 0 1.25 1.25h8.5a1.25 1.25 0 0 0 1.25-1.25V9.5" />
    </Icon>
  );
}

/** Two arrows passing each other: Swap Heading and Body. */
export function SwapIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13" />
    </Icon>
  );
}

/** A heavy line over three light ones: a heading and its body text. */
export function PairingIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M2.5 3.5h11" strokeWidth="2.5" />
      <path d="M2.5 8h11M2.5 10.75h11M2.5 13.5h7" />
    </Icon>
  );
}

/** A capital T: the Sample text field. */
export function TextIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M3.5 4.5V3h9v1.5M8 3v10M6 13h4" />
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

/** All: every Family. */
export function GridIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
      <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
      <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
    </Icon>
  );
}

/** My Fonts: the ones she installed. */
export function PersonIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <circle cx="8" cy="5.5" r="2.75" />
      <path d="M2.75 13.5c.6-2.6 2.7-4 5.25-4s4.65 1.4 5.25 4" />
    </Icon>
  );
}

/** System: the operating system's own. */
export function ComputerIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <rect x="2" y="3" width="12" height="8" rx="1.5" />
      <path d="M5.5 13.5h5M8 11v2.5" />
    </Icon>
  );
}

/** Couldn't Read. */
export function WarningIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M8 2.5l6 10.5H2z" />
      <path d="M8 6.75v2.5M8 11.25v.01" />
    </Icon>
  );
}

/** A Collection. */
export function FolderIcon({ className }: IconProps): React.JSX.Element {
  return (
    <Icon className={className}>
      <path d="M2 4.5a1 1 0 0 1 1-1h3.25l1.5 1.5H13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" />
    </Icon>
  );
}
