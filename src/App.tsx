import { useRef, useState } from 'react'

type Point = {
  x: number
  y: number
}

const viewBoxSize = 1000

export function App() {
  const practiceAreaRef = useRef<SVGSVGElement>(null)
  const [stroke, setStroke] = useState<Point[]>([])
  const [isTracing, setIsTracing] = useState(false)

  function getPoint(event: React.PointerEvent<SVGSVGElement>): Point | null {
    const svg = practiceAreaRef.current
    if (!svg) return null

    const bounds = svg.getBoundingClientRect()
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * viewBoxSize,
      y: ((event.clientY - bounds.top) / bounds.height) * viewBoxSize,
    }
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    const point = getPoint(event)
    if (!point) return

    event.currentTarget.setPointerCapture(event.pointerId)
    setIsTracing(true)
    setStroke([point])
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!isTracing) return
    const point = getPoint(event)
    if (!point) return

    setStroke((currentStroke) => [...currentStroke, point])
  }

  function finishTracing(event: React.PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsTracing(false)
  }

  const strokePoints = stroke.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand-mark" aria-label="なぞりあそび">
          <span className="brand-dot" aria-hidden="true" />
          <span>なぞりあそび</span>
        </div>
        <div className="progress-badge" aria-label="れんしゅう 1もじめ">
          <span aria-hidden="true">1</span>
          <span>もじめ</span>
        </div>
      </header>

      <section className="practice-header" aria-labelledby="practice-title">
        <p className="eyebrow">きょうの もじ</p>
        <h1 id="practice-title">あ</h1>
        <p className="prompt">ゆびで なぞってみよう</p>
      </section>

      <section className="practice-card" aria-label="あのなぞり練習">
        <div className="sparkle sparkle-one" aria-hidden="true">✦</div>
        <div className="sparkle sparkle-two" aria-hidden="true">✧</div>
        <svg
          ref={practiceAreaRef}
          className="tracing-canvas"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          role="img"
          aria-label="あをなぞる場所"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishTracing}
          onPointerCancel={finishTracing}
        >
          <path
            className="character-outline"
            d="M280 235 C390 175 645 180 720 275 C760 325 735 400 655 430 C570 462 400 440 335 505 C265 575 320 690 470 720 C595 745 720 700 760 590"
          />
          <path
            className="character-outline"
            d="M505 135 C490 270 475 450 460 625 C450 745 500 815 605 825"
          />
          <path
            className="character-outline"
            d="M700 475 C650 520 635 610 660 685 C680 745 735 765 785 730"
          />
          {stroke.length > 0 && (
            <polyline className="user-stroke" points={strokePoints} />
          )}
        </svg>
      </section>

      <p className={`touch-status${isTracing ? ' is-active' : ''}`} aria-live="polite">
        {isTracing ? 'なぞっているよ' : 'ここを さわってね'}
      </p>
    </main>
  )
}
