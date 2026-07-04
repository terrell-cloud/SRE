/** Tiny bases indicator: three diamonds, lit when occupied. */
export default function BasesDiamond({
  bases,
  size = 34,
}: {
  bases: [string | null, string | null, string | null]
  size?: number
}) {
  const cell = size * 0.34
  const spot = (cx: number, cy: number, occupied: boolean, key: string) => (
    <rect
      key={key}
      x={cx - cell / 2}
      y={cy - cell / 2}
      width={cell}
      height={cell}
      transform={`rotate(45 ${cx} ${cy})`}
      className={occupied ? 'fill-dirt-400' : 'fill-field-50/20'}
    />
  )
  return (
    <svg width={size} height={size * 0.72} aria-label="bases">
      {spot(size * 0.5, size * 0.16, !!bases[1], '2b')}
      {spot(size * 0.82, size * 0.46, !!bases[0], '1b')}
      {spot(size * 0.18, size * 0.46, !!bases[2], '3b')}
    </svg>
  )
}
