// Lightweight inline SVG icons (stroke = currentColor) so we ship no icon
// library and every glyph inherits text colour / sizing from its parent.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const TreeFellingIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2 5 11h4l-3 5h5v6h2v-6h5l-3-5h4z" />
  </Svg>
);

export const StumpIcon = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="7" rx="7" ry="3" />
    <path d="M5 7v6c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
    <path d="M12 7v3M10 8l2 2 2-2" />
    <path d="M3 21h18" />
  </Svg>
);

export const SiteClearingIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 20h18" />
    <path d="M7 20V9l5-4 5 4v11" />
    <path d="M10 20v-5h4v5" />
  </Svg>
);

export const PruningIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M8.1 8.1 20 20M8.1 15.9 20 4" />
  </Svg>
);

export const WoodIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="16" r="4" />
    <circle cx="17" cy="16" r="4" />
    <path d="M7 14v.01M17 14v.01" />
    <path d="m9 7 3-4 3 4" />
  </Svg>
);

export const EmergencyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 2 21h20L12 3z" />
    <path d="M12 10v5M12 18v.01" />
  </Svg>
);

export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </Svg>
);

export const MailIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

export const MapPinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12 4.5 4.5L19 7" />
  </Svg>
);

export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const LeafIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 19C4 12 9 5 19 5c0 10-7 15-14 14z" />
    <path d="M5 19c3-6 7-9 11-10" />
  </Svg>
);

export const StarIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.3l6.5-.9z" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const QuoteIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="M9 7H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2H4v3h1a5 5 0 0 0 5-5V9a2 2 0 0 0-1-2zm10 0h-4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2v1a2 2 0 0 1-2 2h-1v3h1a5 5 0 0 0 5-5V9a2 2 0 0 0-1-2z" />
  </Svg>
);

export const AwardIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="6" />
    <path d="M9 14.5 7.5 22 12 19l4.5 3L15 14.5" />
  </Svg>
);

export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5a3.5 3.5 0 0 1 0 7M17.5 20a6 6 0 0 0-3-5.2" />
  </Svg>
);

export const FacebookIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="M14 9h3V5h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1z" />
  </Svg>
);

export const InstagramIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </Svg>
);

export const WhatsAppIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 21l1.6-4.5A8 8 0 1 1 8 19.4z" />
    <path d="M8.5 9c0 4 3 6.5 6.5 6.5l-1.3-2-2 .7-2-2 .7-2z" />
  </Svg>
);
