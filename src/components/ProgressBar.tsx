interface ProgressBarProps {
  value: number
  max: number
  label?: string
}

function ProgressBar({ value, max, label }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const complete = percent >= 100

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <span>{label ?? 'Progresso'}</span>
        <span className="font-medium">
          {value} / {max} ({percent}%)
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all ${
            complete ? 'bg-green-500' : 'bg-primary-600'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
