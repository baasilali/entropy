'use client'

import * as React from "react"
import { Entropy } from "@/components/ui/entropy"

export function EntropyDemo() {
  const [stats, setStats] = React.useState({
    avgChaosVelocity: 0,
    maxInfluence: 0,
    particleCount: 0,
    orderedParticles: 0,
    chaosParticles: 0,
    totalConnections: 0
  })

  return (
    <div className="w-full max-w-6xl h-full flex items-center justify-center gap-8 bg-black px-4">
      <div className="flex-shrink-0">
        <Entropy className="rounded-lg" onStatsUpdate={setStats} />
      </div>
      
      <div className="font-mono text-[14px] flex-shrink-0">
        <p className="text-gray-400/80 mb-12">
          Click anywhere to create chaos<br />
          Press spacebar to restore order
        </p>

        <div className="space-y-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-gray-400 mb-2">Particle Statistics</h3>
              <div className="grid grid-cols-1 gap-2">
                <p className="text-gray-400/80">Total Particles: {stats.particleCount}</p>
                <p className="text-gray-400/80">Ordered Particles: {stats.orderedParticles}</p>
                <p className="text-gray-400/80">Chaos Particles: {stats.chaosParticles}</p>
                <p className="text-gray-400/80">Total Connections: {stats.totalConnections}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-gray-400 mb-2">System Stats</h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="grid grid-cols-2 gap-x-8">
                <p className="text-gray-400/80">Max Influence: {stats.maxInfluence}</p>
                <p className="text-gray-400/80">Avg Velocity: {stats.avgChaosVelocity}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-8">
                <p className="text-gray-400/80">Grid Size: 25 x 25</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}