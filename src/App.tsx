import { useRef, useState } from 'react'

type Point = {
  x: number
  y: number
}

type Particle = Point & {
  id: number
  size: number
}

const guideStrokes: Point[][] = [
  [
    { x: 300, y: 270 },
    { x: 390, y: 250 },
    { x: 500, y: 245 },
    { x: 610, y: 250 },
    { x: 700, y: 275 },
  ],
  [
    { x: 510, y: 175 },
    { x: 500, y: 300 },
    { x: 490, y: 430 },
    { x: 480, y: 560 },
    { x: 475, y: 680 },
  ],
  [
    { x: 690, y: 365 },
    { x: 650, y: 420 },
    { x: 630, y: 500 },
    { x: 640, y: 585 },
    { x: 700, y: 635 },
    { x: 770, y: 620 },
    { x: 790, y: 545 },
    { x: 775, y: 470 },
    { x: 720, y: 430 },
  ],
]

const viewBoxSize = 1000
const traceTolerance = 120

export function App() {
  const practiceAreaRef = useRef<SVGSVGElement>(null)
  const particleIdRef = useRef(0)
  const lastPointRef = useRef<Point | null>(null)
  const activeStrokeRef = useRef<Point[]>([])
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [activeStroke, setActiveStroke] = useState<Point[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [isTracing, setIsTracing] = useState(false)
  const [completedStrokeCount, setCompletedStrokeCount] = useState(0)
  const [lastResult, setLastResult] = useState<'success' | 'retry' | null>(null)

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
    if (!point || completedStrokeCount >= guideStrokes.length) return

    event.currentTarget.setPointerCapture(event.pointerId)
    setIsTracing(true)
    activeStrokeRef.current = [point]
    setActiveStroke([point])
    lastPointRef.current = point
    setLastResult(null)
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
    activeStrokeRef.current = [...activeStrokeRef.current, point]
    setActiveStroke(activeStrokeRef.current)
  }

  function finishTracing(event: React.PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const finishedStroke = activeStrokeRef.current
    if (finishedStroke.length > 1) {
      const guide = guideStrokes[completedStrokeCount]
      const isSuccess = isStrokeSuccessful(finishedStroke, guide)

      if (isSuccess) {
        setStrokes((currentStrokes) => [...currentStrokes, finishedStroke])
        setCompletedStrokeCount((count) => count + 1)
        setLastResult('success')
      } else {
        setLastResult('retry')
      }
    } else {
      setLastResult('retry')
    }
    lastPointRef.current = null
    activeStrokeRef.current = []
    setActiveStroke([])
    setIsTracing(false)
  }

  function isStrokeSuccessful(stroke: Point[], guide: Point[]) {
    const strokeLength = stroke.reduce((total, point, index) => {
      if (index === 0) return total
      const previousPoint = stroke[index - 1]
      return total + Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
    }, 0)
    const coveredGuidePoints = guide.filter((guidePoint) =>
      stroke.some(
        (point) => Math.hypot(point.x - guidePoint.x, point.y - guidePoint.y) <= traceTolerance,
      ),
    ).length

    return strokeLength >= 90 && coveredGuidePoints / guide.length >= 0.6
  }

  function clearDrawing() {
    setStrokes([])
    setActiveStroke([])
    setParticles([])
    lastPointRef.current = null
    activeStrokeRef.current = []
    setCompletedStrokeCount(0)
    setLastResult(null)
    setIsTracing(false)
  }

  const statusText = completedStrokeCount === guideStrokes.length
    ? 'できた！'
    : lastResult === 'success'
      ? `${completedStrokeCount}かいめ できた！`
      : lastResult === 'retry'
        ? 'もういちど なぞってみよう'
        : `${completedStrokeCount + 1}かいめを なぞってね`

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
          <text className="guide-character" x="500" y="730" textAnchor="middle">
            あ
          </text>
          {strokes.map((currentStroke, index) => (
            <polyline
              key={`stroke-${index}`}
              className="user-stroke"
              points={currentStroke.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
          ))}
          {activeStroke.length > 0 && (
            <polyline
              className={`user-stroke${lastResult === 'retry' ? ' failed-stroke' : ''}`}
              points={activeStroke.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
          )}
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

      <p className={`touch-status${isTracing ? ' is-active' : ''}${completedStrokeCount === guideStrokes.length ? ' is-complete' : ''}`} aria-live="polite">
        {isTracing ? 'なぞっているよ' : statusText}
      </p>
      <button className="clear-button" type="button" onClick={clearDrawing}>
        <span aria-hidden="true">↻</span>
        もういちど
      </button>
    </main>
  )
}
