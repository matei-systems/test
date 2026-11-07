import type { SVGProps } from 'react'

/** Einheitliches Linien-Icon-Set (24×24, 1.5 px Kontur). */
export type IconName =
  | 'arrow-right'
  | 'arrow-left'
  | 'check'
  | 'car'
  | 'sparkle'
  | 'droplet'
  | 'seat'
  | 'pin'
  | 'calendar'
  | 'clock'
  | 'shield'
  | 'tag'
  | 'user'
  | 'phone'
  | 'mail'
  | 'whatsapp'
  | 'menu'
  | 'close'
  | 'plus'
  | 'minus'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'info'
  | 'alert'
  | 'home'
  | 'van'
  | 'layers'
  | 'paw'
  | 'handshake'
  | 'route'
  | 'star'
  | 'logout'
  | 'grid'
  | 'list'
  | 'settings'
  | 'lock'
  | 'trash'
  | 'edit'
  | 'external'
  | 'polish'

const paths: Record<IconName, React.ReactNode> = {
  'arrow-right': <path d="M4 12h15m-5-6 6 6-6 6" />,
  'arrow-left': <path d="M20 12H5m5-6-6 6 6 6" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  car: (
    <>
      <path d="M3.5 16.5v-3.2c0-.6.2-1.1.6-1.5l1.6-1.6 1.9-3.4A2 2 0 0 1 9.3 5.8h5.4a2 2 0 0 1 1.7 1L18.3 10l1.6 1.6c.4.4.6 1 .6 1.5v3.4" />
      <path d="M3.5 16.5h17M6.5 10.2h11" />
      <circle cx="7.5" cy="17" r="1.8" />
      <circle cx="16.5" cy="17" r="1.8" />
    </>
  ),
  sparkle: <path d="M12 3.5c.5 3.9 1.9 6.9 8 8.5-6.1 1.6-7.5 4.6-8 8.5-.5-3.9-1.9-6.9-8-8.5 6.1-1.6 7.5-4.6 8-8.5Z" />,
  droplet: <path d="M12 3.5s6 6.4 6 10.6a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5Z M9.2 14.6a2.9 2.9 0 0 0 2.6 2.7" />,
  seat: (
    <>
      <path d="M8 4.5h4.2a2 2 0 0 1 2 1.8l.8 7.2H8.6L7 6.6a1.7 1.7 0 0 1 1-2.1Z" />
      <path d="M8.6 13.5h8.2a1.7 1.7 0 0 1 1.7 1.7v1.3H9.3M10 16.5l-1 3.5m8-3.5 1 3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.1-7-11.3A7 7 0 0 1 19 9.7C19 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.8" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.8h17M8 3v4m8-4v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2 5 6v5.6c0 4.4 3 7.9 7 9.2 4-1.3 7-4.8 7-9.2V6l-7-2.8Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.3V4.8c0-.7.6-1.3 1.3-1.3h7.5l8.2 8.2a1.6 1.6 0 0 1 0 2.3l-6.4 6.4a1.6 1.6 0 0 1-2.3 0l-8.3-8.1Z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" />
    </>
  ),
  phone: (
    <path d="M6.6 3.8 9 3.5l1.6 4-2 1.4a10.6 10.6 0 0 0 6.5 6.5l1.4-2 4 1.6-.3 2.4a2.4 2.4 0 0 1-2.6 2.1C10.5 18.9 5.1 13.5 4.5 6.4a2.4 2.4 0 0 1 2.1-2.6Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4.2 19.8 5.3 16A8.4 8.4 0 1 1 8.2 18.8l-4 1Z" />
      <path d="M9.1 8.4c.2-.4.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.7l-.5.6c-.1.2-.1.4 0 .6.6 1.1 1.5 2 2.7 2.6.2.1.4.1.6-.1l.6-.6c.2-.2.4-.2.7-.1l1.6.7c.3.1.4.3.4.6v.4c0 .4-.2.7-.5.9-.6.4-1.4.6-2.2.4-2.6-.6-4.9-2.9-5.6-5.5-.2-.8 0-1.6.4-2.2Z" />
    </>
  ),
  menu: <path d="M4 8h16M4 16h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.6 3.2 17.2A2 2 0 0 0 4.9 20h14.2a2 2 0 0 0 1.7-2.8L13.7 4.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4.5M12 16.8v.1" />
    </>
  ),
  home: <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z" />,
  van: (
    <>
      <path d="M2.5 16.5V7.2c0-.7.6-1.2 1.2-1.2h10.8v10.5M14.5 9h3.6l3.4 3.6v3.9h-2" />
      <circle cx="7" cy="17" r="1.9" />
      <circle cx="17" cy="17" r="1.9" />
      <path d="M9 17h6" />
    </>
  ),
  layers: <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5Zm-8.5 8.5 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />,
  paw: (
    <>
      <circle cx="7" cy="9.5" r="1.8" />
      <circle cx="10.4" cy="6" r="1.8" />
      <circle cx="14.6" cy="6" r="1.8" />
      <circle cx="18" cy="9.5" r="1.8" />
      <path d="M12.5 11c-2.7 0-5.5 3.6-5.5 6a2.5 2.5 0 0 0 3.2 2.4c1.5-.4 3.1-.4 4.6 0A2.5 2.5 0 0 0 18 17c0-2.4-2.8-6-5.5-6Z" />
    </>
  ),
  handshake: (
    <path d="m11 7-2.2-1.5a2 2 0 0 0-2.2 0L3 8v6.5l3.2 2.5m14.8-9-3.6-2.5a2 2 0 0 0-2.2 0L9.5 9.2a1.5 1.5 0 0 0 1.6 2.6l2.2-1.3 4.7 4.2v-.2L21 14.5V8Zm-3 6.7-1.6 1.4m-1.4-4.4 2.9 3.2M8 18l1.3 1.1a1.5 1.5 0 0 0 2.1-.1l.4-.5m-5.6-1.6 1.4 1.2a1.4 1.4 0 0 0 2-.2m3.4-.4 1 .8a1.5 1.5 0 0 0 2.1-.2l.2-.3" />
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <path d="M8.2 18H16a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h7.8" />
    </>
  ),
  star: <path d="m12 3.8 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8L12 3.8Z" />,
  logout: <path d="M14.5 4.5h3a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-3M10 16l-4-4 4-4m-4 4h10.5" />,
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  list: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.1M4.5 12h.1M4.5 17.5h.1" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-2.6-1.5L14.1 2.5h-4.2l-.4 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9c.8.7 1.6 1.2 2.6 1.5l.4 2.5h4.2l.4-2.5c1-.3 1.8-.8 2.6-1.5l2.3.9 2-3.4-2-1.5Z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </>
  ),
  trash: <path d="M4.5 7h15M10 7V4.5h4V7m-7.5 0 .8 12a1.5 1.5 0 0 0 1.5 1.5h6.4a1.5 1.5 0 0 0 1.5-1.5l.8-12M10 11v6m4-6v6" />,
  edit: <path d="m14.5 5.5 4 4M4.5 19.5l1-4.5L15.8 4.7a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L9 18.5l-4.5 1Z" />,
  external: <path d="M14 4.5h5.5V10M19.5 4.5 11 13m-1.5-7.5H6A1.5 1.5 0 0 0 4.5 7v11A1.5 1.5 0 0 0 6 19.5h11a1.5 1.5 0 0 0 1.5-1.5v-3.5" />,
  polish: (
    <>
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="9" cy="14" r="2" />
      <path d="m13 10 5.5-5.5M16 4.5l3.5 3.5" />
    </>
  ),
}

export function Icon({ name, size = 20, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
