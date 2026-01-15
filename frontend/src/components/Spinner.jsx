import clsx from 'clsx'

export default function Spinner({ size = 16, className }) {
  return (
    <span
      className={clsx(
        'inline-block animate-spin rounded-full border-2 border-transparent border-t-current',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}