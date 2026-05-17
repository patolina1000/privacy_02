export default function ChevronIcon({
  className = '',
  direction = 'down',
}: {
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right'
}) {
  const rotate = {
    down: 0,
    up: 180,
    left: 90,
    right: -90,
  }[direction]

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
