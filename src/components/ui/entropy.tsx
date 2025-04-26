'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface EntropyProps {
  className?: string
  size?: number
  onStatsUpdate?: (stats: { 
    avgChaosVelocity: number; 
    maxInfluence: number; 
    particleCount: number;
    orderedParticles: number;
    chaosParticles: number;
    totalConnections: number;
  }) => void
}

class Particle {
  x: number
  y: number
  size: number
  order: boolean
  velocity: { x: number; y: number }
  originalX: number
  originalY: number
  influence: number
  neighbors: Particle[]
  isChaosSource: boolean

  constructor(x: number, y: number, order: boolean, isChaosSource = false) {
    this.x = x
    this.y = y
    this.originalX = x
    this.originalY = y
    this.size = 2
    this.order = order
    this.velocity = {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2
    }
    this.influence = 0
    this.neighbors = []
    this.isChaosSource = isChaosSource
  }

  update(size: number) {
    if (this.order && !this.isChaosSource) {
      const dx = this.originalX - this.x
      const dy = this.originalY - this.y

      const chaosInfluence = { x: 0, y: 0 }
      this.neighbors.forEach(neighbor => {
        if (!neighbor.order || neighbor.isChaosSource) {
          const distance = Math.hypot(this.x - neighbor.x, this.y - neighbor.y)
          const strength = Math.max(0, 1 - distance / 100)
          chaosInfluence.x += (neighbor.velocity.x * strength)
          chaosInfluence.y += (neighbor.velocity.y * strength)
          this.influence = Math.max(this.influence, strength)
        }
      })
      
      this.x += dx * 0.05 * (1 - this.influence) + chaosInfluence.x * this.influence
      this.y += dy * 0.05 * (1 - this.influence) + chaosInfluence.y * this.influence
      this.influence *= 0.99
    } else {
      this.velocity.x += (Math.random() - 0.5) * 0.5
      this.velocity.y += (Math.random() - 0.5) * 0.5
      this.velocity.x *= 0.95
      this.velocity.y *= 0.95
      this.x += this.velocity.x
      this.y += this.velocity.y

      if (this.x < 0 || this.x > size) this.velocity.x *= -1
      if (this.y < 0 || this.y > size) this.velocity.y *= -1
      this.x = Math.max(0, Math.min(size, this.x))
      this.y = Math.max(0, Math.min(size, this.y))
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.order && !this.isChaosSource ? 0.8 - this.influence * 0.5 : 0.8
    ctx.fillStyle = `#ffffff${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function Entropy({ className, size = 400, onStatsUpdate }: EntropyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Store context in ref for animation
    ctxRef.current = ctx

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    const gridSize = 25
    const spacing = size / gridSize
    const particles: Particle[] = []

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = spacing * i + spacing / 2
        const y = spacing * j + spacing / 2
        particles.push(new Particle(x, y, true))
      }
    }

    particlesRef.current = particles
    setIsInitialized(true)

    function updateNeighbors() {
      particles.forEach(particle => {
        particle.neighbors = particles.filter(other => {
          if (other === particle) return false
          const distance = Math.hypot(particle.x - other.x, particle.y - other.y)
          return distance < 100
        })
      })
    }

    function updateStats() {
      if (!onStatsUpdate) return

      const chaosParticles = particles.filter(p => !p.order || p.isChaosSource)
      const orderedParticles = particles.filter(p => p.order && !p.isChaosSource)
      const avgVelocity = chaosParticles.length > 0 
        ? chaosParticles.reduce((sum, p) => 
            sum + Math.hypot(p.velocity.x, p.velocity.y), 0) / chaosParticles.length
        : 0
      
      const maxInfluence = orderedParticles.length > 0
        ? orderedParticles.reduce((max, p) => Math.max(max, p.influence), 0)
        : 0

      // Calculate total connections
      const totalConnections = particles.reduce((sum, p) => sum + p.neighbors.length, 0) / 2

      onStatsUpdate({
        avgChaosVelocity: Number(avgVelocity.toFixed(2)),
        maxInfluence: Number(maxInfluence.toFixed(2)),
        particleCount: particles.length,
        orderedParticles: orderedParticles.length,
        chaosParticles: chaosParticles.length,
        totalConnections: Math.floor(totalConnections)
      })
    }

    function restoreOrder() {
      particles.forEach(particle => {
        if (!particle.order) {
          // Gradually reduce velocity and restore order
          particle.velocity.x *= 0.95
          particle.velocity.y *= 0.95
          
          // If particle is almost stationary, restore order
          if (Math.hypot(particle.velocity.x, particle.velocity.y) < 0.1) {
            particle.order = true
            particle.isChaosSource = false
            particle.influence = 0
          }
        }
      })

      // Check if all particles are restored
      const allRestored = particles.every(p => p.order)
      if (allRestored) {
        setIsRestoring(false)
      }
    }

    let time = 0
    let animationId: number

    function animate() {
      const ctx = ctxRef.current
      if (!ctx || !canvas) return

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (time % 30 === 0) {
        updateNeighbors()
        updateStats()
      }

      if (isRestoring) {
        restoreOrder()
      }

      particles.forEach(particle => {
        particle.update(size)
        particle.draw(ctx)

        particle.neighbors.forEach(neighbor => {
          const distance = Math.hypot(particle.x - neighbor.x, particle.y - neighbor.y)
          if (distance < 50) {
            const alpha = 0.2 * (1 - distance / 50)
            ctx.strokeStyle = `#ffffff${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(neighbor.x, neighbor.y)
            ctx.stroke()
          }
        })
      })

      ctx.strokeStyle = '#ffffff4D'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(size / 2, 0)
      ctx.lineTo(size / 2, size)
      ctx.stroke()

      time++
      animationId = requestAnimationFrame(animate)
    }

    animate()

    // Add keyboard event listener
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        setIsRestoring(true)
      }
    }

    window.addEventListener('keydown', handleKeyPress)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [size, onStatsUpdate, isRestoring])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isInitialized) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const radius = 100
    const affectedParticles = particlesRef.current.filter(particle => {
      const distance = Math.hypot(particle.x - x, particle.y - y)
      return distance < radius
    })

    setIsRestoring(false) // Cancel any ongoing restoration
    affectedParticles.forEach(particle => {
      particle.order = false
      particle.isChaosSource = true
      particle.velocity = {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4
      }
    })
  }

  return (
    <div className={cn("relative bg-black", className)} style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="cursor-pointer"
        tabIndex={0} // Make canvas focusable for keyboard events
      />
    </div>
  )
}