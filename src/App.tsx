import { useRef, useState } from 'react'

type Point = {
  x: number
  y: number
}

type Particle = Point & {
  id: number
  size: number
}

const viewBoxSize = 1000

export function App() {
  const practiceAreaRef = useRef<SVGSVGElement>(null)
  const particleIdRef = useRef(0)
  const lastPointRef = useRef<Point | null>(null)
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [particles, setParticles] = useState<Particle[]>([])
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
    setStrokes((currentStrokes) => [...currentStrokes, [point]])
    lastPointRef.current = point
    addParticle(point)
  }

  function addParticle(point: Point) {
    const particle = {
      ...point,
      id: particleIdRef.current,
      size: 9 + (particleIdRef.current % 3) * 3,
    }
    particleIdRef.current += 1
    setParticles((currentParticles) => [...currentParticles, particle].slice(-24))
    window.setTimeout(() => {
      setParticles((currentParticles) =>
        currentParticles.filter(({ id }) => id !== particle.id),
      )
    }, 700)
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!isTracing) return
    const point = getPoint(event)
    if (!point) return

    const previousPoint = lastPointRef.current
    const distance = previousPoint
      ? Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
      : Infinity

    if (distance > 22) addParticle(point)
    lastPointRef.current = point
    setStrokes((currentStrokes) => {
      if (currentStrokes.length === 0) return [[point]]

      const nextStrokes = [...currentStrokes]
      const lastStroke = nextStrokes[nextStrokes.length - 1]
      nextStrokes[nextStrokes.length - 1] = [...lastStroke, point]
      return nextStrokes
    })
  }

  function finishTracing(event: React.PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    lastPointRef.current = null
    setIsTracing(false)
  }

  function clearDrawing() {
    setStrokes([])
    setParticles([])
    lastPointRef.current = null
    setIsTracing(false)
  }

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
          <text className="character-outline" x="500" y="730" textAnchor="middle">
            あ
          </text>
          {strokes.map((currentStroke, index) => (
            <polyline
              key={`stroke-${index}`}
              className="user-stroke"
              points={currentStroke.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
          ))}
          {particles.map((particle) => (
            <circle
              key={particle.id}
              className="trace-particle"
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
            />
          ))}
        </svg>
      </section>

      <p className={`touch-status${isTracing ? ' is-active' : ''}`} aria-live="polite">
        {isTracing ? 'なぞっているよ' : 'ここを さわってね'}
      </p>
      <button className="clear-button" type="button" onClick={clearDrawing}>
        <span aria-hidden="true">↻</span>
        もういちど
      </button>
    </main>
  )
}
