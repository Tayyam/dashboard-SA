/** أيقونات مراحل مسار الرحلة (SVG مضمنة، لون يطابق النص) */

export type JourneyStageSideIcon =
  | 'hajj-root'
  | 'package'
  | 'calendar'
  | 'plane-in'
  | 'plane-out'
  | 'stop'
  | 'leave-stop';

const stroke = '#03542c';
const strokeW = 1.75;

export function JourneyStageSideIconSvg({ type }: { type: JourneyStageSideIcon }) {
  const p = { width: 18, height: 18, viewBox: '0 0 24 24' as const, fill: 'none' as const };

  switch (type) {
    case 'hajj-root':
      return (
        <svg {...p} aria-hidden>
          <path
            d="M12 4v4M8 8h8M7 14h10M9 18h6"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          <circle cx="12" cy="6" r="2.2" stroke={stroke} strokeWidth={strokeW} />
        </svg>
      );
    case 'package':
      return (
        <svg {...p} aria-hidden>
          <path
            d="M4 8l8-3 8 3v10l-8 3-8-3V8z M12 5v16"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...p} aria-hidden>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke={stroke} strokeWidth={strokeW} />
          <path d="M4 10h16M8 3v4M16 3v4" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" />
        </svg>
      );
    case 'plane-in':
      return (
        <svg {...p} aria-hidden>
          <path
            d="M3 14h6l3-3 7 2 2-2-6-3-1-5M14 16l-2 4"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'plane-out':
      return (
        <svg {...p} aria-hidden>
          <path
            d="M21 10h-6l-3 3-7-2-2 2 6 3 1 5M10 8l2-4"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'stop':
      return (
        <svg {...p} aria-hidden>
          <path
            d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10" r="2.2" stroke={stroke} strokeWidth={strokeW} />
        </svg>
      );
    case 'leave-stop':
      return (
        <svg {...p} aria-hidden>
          <path
            d="M4 12h10M4 7h14v10H4V7z M14 12l4 3M14 12l4-3"
            stroke={stroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return <svg {...p} aria-hidden />;
  }
}
