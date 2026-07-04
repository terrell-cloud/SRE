import { useGameStore } from '../../state/gameStore'

export default function HomeScreen() {
  const newExhibition = useGameStore((s) => s.newExhibition)
  const startExhibition = useGameStore((s) => s.startExhibition)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6">
      <header className="text-center">
        <div className="mb-3 text-6xl">⚾</div>
        <h1 className="text-5xl font-black tracking-tight">
          Campus <span className="text-dirt-400">Ball</span>
        </h1>
        <p className="mt-2 text-sm font-medium tracking-wide text-field-50/70">
          College baseball. Your program. Your legacy.
        </p>
      </header>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={() => startExhibition()}
          className="rounded-2xl bg-dirt-400 px-6 py-4 text-lg font-bold text-field-900 shadow-lg transition active:scale-95"
        >
          Play Exhibition
        </button>
        <button
          type="button"
          onClick={() => newExhibition()}
          className="rounded-2xl border border-field-50/25 px-6 py-4 text-lg font-bold text-field-50/90"
        >
          Quick Sim
        </button>
        <button
          type="button"
          disabled
          className="rounded-2xl border border-field-50/20 px-6 py-4 text-lg font-bold text-field-50/40"
          title="Coming in the next milestone"
        >
          Career — coming soon
        </button>
      </div>

      <p className="text-xs text-field-50/40">v0.2 — play ball!</p>
    </div>
  )
}
