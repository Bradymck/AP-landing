"use client"

import { useEffect, useRef, useState } from "react"
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, useSwitchChain } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther, parseUnits } from 'viem'
import { base } from 'wagmi/chains'

// ARI Token Contract Details (from .env)
const ARI_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_TO_BURN_ADDRESS as `0x${string}` || '0xDd33A2644D72324fE453036c78296AC90AEd2E2f'
const REQUIRED_BURN_AMOUNT = process.env.NEXT_PUBLIC_REQUIRED_BURN_AMOUNT || '1000000000000000000' // 1 ARI token

// Faucet Contract Details
const FAUCET_CONTRACT_ADDRESS = '0x447b964389d9Ff14eBc4EBC92920FD3a69baDc76' as `0x${string}`

// ERC20 ABI for burn function
const ERC20_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Faucet Contract ABI
const FAUCET_ABI = [
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'string' },
      { name: 'signature', type: 'bytes' }
    ],
    name: 'claimReward',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

// Sound System
class SoundManager {
  private sounds: { [key: string]: HTMLAudioElement } = {}
  private introSounds: HTMLAudioElement[] = []
  private musicTracks: HTMLAudioElement[] = []
  private currentMusic: HTMLAudioElement | null = null
  private currentMusicIndex: number = 0
  private bulletLoop: HTMLAudioElement | null = null
  private plasmaLoop: HTMLAudioElement | null = null
  private isBulletLooping: boolean = false
  private isPlasmaLooping: boolean = false
  private sfxMuted: boolean = false
  private musicMuted: boolean = false
  private audioEnabled: boolean = false
  private musicVolume: number = 0.3
  private sfxVolume: number = 0.2 // Lowered for bullets

  constructor() {
    // Preload all sound effects (bullets now handled separately as loops)
    const soundFiles = [
      'enemy-hit.wav',
      'armor-hit.wav',
      'block-destroy.wav',
      'player-death.wav',
      'power-up.wav',
      'energy-activate.wav',
      'energy-deactivate.wav'
    ]

    soundFiles.forEach(file => {
      try {
        const audio = new Audio(`/sfx/${file}`)
        audio.preload = 'auto'
        audio.volume = this.sfxVolume
        
        // Add error listener for failed sounds
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to load sound: ${file}`)
        })
        
        this.sounds[file.replace('.wav', '').replace('.mp3', '')] = audio
      } catch (error) {
        console.warn(`Could not load sound: ${file}`, error)
      }
    })

    // Load intro sounds
    const introFiles = ['baloons.mp3', 'not-my-chair.mp3', 'noway.mp3', 'seahorses.mp3']
    introFiles.forEach(file => {
      try {
        const audio = new Audio(`/sfx/intros/${file}`)
        audio.preload = 'auto'
        audio.volume = this.sfxVolume
        
        // Add load event listener
        audio.addEventListener('canplaythrough', () => {
          console.log(`Intro sound ready: ${file}`)
        })
        
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to load intro sound: ${file}`)
        })
        
        this.introSounds.push(audio)
      } catch (error) {
        console.warn(`Could not load intro sound: ${file}`, error)
      }
    })

    // Load music tracks
    const musicFiles = ['boss.mp3', 'drumph.mp3', 'epic-groove.mp3', 'epicAF.mp3', 'skiff.mp3', 'steampunk.mp3', 'sofass.mp3']
    musicFiles.forEach(file => {
      try {
        const audio = new Audio(`/sfx/music/${file}`)
        audio.preload = 'auto'
        audio.volume = this.musicVolume
        audio.loop = false // We'll handle looping manually for track progression
        
        // Add load event to ensure music is ready
        audio.addEventListener('canplaythrough', () => {
          // Music is ready to play
        })
        
        audio.addEventListener('error', (e) => {
          console.warn(`Failed to load music: ${file}`)
        })
        
        this.musicTracks.push(audio)
      } catch (error) {
        console.warn(`Could not load music: ${file}`, error)
      }
    })

    // Set up dedicated looping bullet sounds
    try {
      this.bulletLoop = new Audio('/sfx/bullet-shoot.wav')
      this.bulletLoop.preload = 'auto'
      this.bulletLoop.volume = this.sfxVolume * 0.5 // Even quieter for looping
      this.bulletLoop.loop = true

      this.plasmaLoop = new Audio('/sfx/plasma-shoot.wav')
      this.plasmaLoop.preload = 'auto'
      this.plasmaLoop.volume = this.sfxVolume * 0.6 // Slightly louder for plasma
      this.plasmaLoop.loop = true
    } catch (error) {
      console.warn('Could not create bullet loop sounds:', error)
    }
  }

  async enableAudio() {
    // Try to enable audio context (required for autoplay policy)
    if (!this.audioEnabled) {
      try {
        // Create a silent audio context to unlock audio
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        if (context.state === 'suspended') {
          await context.resume()
        }
        
        // Play a silent sound to unlock audio on all elements
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
        silentAudio.volume = 0
        try {
          await silentAudio.play()
          silentAudio.pause()
        } catch (e) {
          // Ignore silent audio failures
        }
        
        this.audioEnabled = true
      } catch (error) {
        console.warn('Could not enable audio context:', error)
      }
    }
  }

  play(soundName: string, volumeMultiplier: number = 1.0) {
    if (this.sfxMuted) return
    
    const sound = this.sounds[soundName]
    if (sound) {
      try {
        // Adjust volume temporarily if needed
        const originalVolume = sound.volume
        sound.volume = originalVolume * volumeMultiplier
        
        // Simple approach: reset and play original audio
        sound.currentTime = 0
        const playPromise = sound.play()
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Reset volume after a short delay
              setTimeout(() => {
                sound.volume = originalVolume
              }, 100)
            })
            .catch(e => {
              // Reset volume on error too
              sound.volume = originalVolume
              // Silently handle autoplay policy errors
              if (e.name !== 'NotAllowedError') {
                console.warn(`Could not play sound: ${soundName}`, e)
              }
            })
        }
      } catch (error) {
        console.warn(`Error playing sound: ${soundName}`, error)
      }
    } else {
      // Only warn if it's not a missing optional sound
      if (!['energy-activate', 'energy-deactivate'].includes(soundName)) {
        console.warn(`Sound not found: ${soundName}`)
      }
    }
  }

  async playRandomIntro() {
    if (this.sfxMuted || this.introSounds.length === 0) {
      console.warn('Cannot play intro: muted or no sounds loaded')
      return
    }
    
    const randomIndex = Math.floor(Math.random() * this.introSounds.length)
    const introSound = this.introSounds[randomIndex]
    
    // Playing random intro sound
    
    try {
      // Ensure audio is enabled first
      await this.enableAudio()
      
      introSound.currentTime = 0
      const playPromise = introSound.play()
      
      if (playPromise) {
        playPromise
          .then(() => {
            // Intro sound playing successfully
          })
          .catch(e => {
            if (e.name !== 'NotAllowedError') {
              console.warn('Could not play intro sound:', e)
            }
          })
      }
    } catch (error) {
      console.warn('Error playing intro sound:', error)
    }
  }

  async startLevelMusic(level: number) {
    if (this.musicMuted) return
    
    // Stop current music
    this.stopMusic()
    
    if (this.musicTracks.length === 0) {
      console.warn('No music tracks loaded')
      return
    }
    
    // Wait a moment for audio context to be ready
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Get track for this level (cycle through available tracks)
    const trackIndex = (level - 1) % this.musicTracks.length
    this.currentMusic = this.musicTracks[trackIndex]
    this.currentMusicIndex = trackIndex
    
    console.log(`Attempting to start music track ${trackIndex + 1} for level ${level}`)
    
    try {
      // Reset and configure the audio
      this.currentMusic.currentTime = 0
      this.currentMusic.loop = true
      
      // Check if audio is ready to play
      if (this.currentMusic.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        console.log('Music ready, starting playback')
        const playPromise = this.currentMusic.play()
        if (playPromise) {
          playPromise
            .then(() => {
              console.log(`Music playing successfully: Track ${trackIndex + 1}`)
            })
            .catch(e => {
              if (e.name !== 'NotAllowedError') {
                console.warn('Could not play background music:', e)
                // Try again after a delay
                setTimeout(() => {
                  if (this.currentMusic) {
                    this.currentMusic.play().catch((e2) => {
                      console.warn('Retry music play failed:', e2)
                    })
                  }
                }, 1000)
              }
            })
        }
      } else {
        console.warn('Music not ready, waiting for load...')
        this.currentMusic.addEventListener('canplaythrough', () => {
          if (this.currentMusic) {
            console.log('Music loaded, starting delayed playback')
            this.currentMusic.currentTime = 0
            this.currentMusic.loop = true
            this.currentMusic.play().catch(e => {
              console.warn('Delayed music play failed:', e)
            })
          }
        }, { once: true })
      }
    } catch (error) {
      console.warn('Error playing background music:', error)
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.pause()
      this.currentMusic.currentTime = 0
      this.currentMusic = null
    }
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    this.musicTracks.forEach(track => {
      track.volume = this.musicVolume
    })
    if (this.currentMusic) {
      this.currentMusic.volume = this.musicVolume
    }
  }

  startBulletLoop(isPlasma: boolean = false) {
    if (this.sfxMuted) return

    const targetLoop = isPlasma ? this.plasmaLoop : this.bulletLoop
    const targetFlag = isPlasma ? 'isPlasmaLooping' : 'isBulletLooping'

    if (!targetLoop || this[targetFlag]) return

    try {
      targetLoop.currentTime = 0
      targetLoop.play().catch(e => {
        if (e.name !== 'NotAllowedError') {
          console.warn(`Could not start ${isPlasma ? 'plasma' : 'bullet'} loop:`, e)
        }
      })
      this[targetFlag] = true
    } catch (error) {
      console.warn(`Error starting ${isPlasma ? 'plasma' : 'bullet'} loop:`, error)
    }
  }

  stopBulletLoop(isPlasma: boolean = false) {
    const targetLoop = isPlasma ? this.plasmaLoop : this.bulletLoop
    const targetFlag = isPlasma ? 'isPlasmaLooping' : 'isBulletLooping'

    if (!targetLoop || !this[targetFlag]) return

    try {
      targetLoop.pause()
      targetLoop.currentTime = 0
      this[targetFlag] = false
    } catch (error) {
      console.warn(`Error stopping ${isPlasma ? 'plasma' : 'bullet'} loop:`, error)
    }
  }

  stopAllBulletLoops() {
    this.stopBulletLoop(false) // Stop regular bullets
    this.stopBulletLoop(true)  // Stop plasma bullets
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.sfxVolume
    })
    this.introSounds.forEach(sound => {
      sound.volume = this.sfxVolume
    })
    
    // Update bullet loop volumes
    if (this.bulletLoop) {
      this.bulletLoop.volume = this.sfxVolume * 0.5
    }
    if (this.plasmaLoop) {
      this.plasmaLoop.volume = this.sfxVolume * 0.6
    }
  }

  toggleSfxMute() {
    this.sfxMuted = !this.sfxMuted
    if (this.sfxMuted) {
      this.stopAllBulletLoops()
    }
    return this.sfxMuted
  }

  toggleMusicMute() {
    this.musicMuted = !this.musicMuted
    if (this.musicMuted) {
      this.stopMusic()
    }
    return this.musicMuted
  }

  setSfxMuted(muted: boolean) {
    this.sfxMuted = muted
    if (this.sfxMuted) {
      this.stopAllBulletLoops()
    }
  }

  setMusicMuted(muted: boolean) {
    this.musicMuted = muted
    if (this.musicMuted) {
      this.stopMusic()
    }
  }

  isSfxMuted(): boolean {
    return this.sfxMuted
  }

  isMusicMuted(): boolean {
    return this.musicMuted
  }

  // Keep the old method for compatibility but update it
  toggleMute() {
    this.sfxMuted = !this.sfxMuted
    this.musicMuted = !this.musicMuted
    if (this.sfxMuted) {
      this.stopAllBulletLoops()
    }
    if (this.musicMuted) {
      this.stopMusic()
    }
    return this.sfxMuted && this.musicMuted
  }
}

// Global sound manager instance
let soundManager: SoundManager | null = null

// We'll load the AquaPrime logo directly in the useEffect

// Game constants - base dimensions that will be scaled
const BASE_GAME_WIDTH = 800
const BASE_GAME_HEIGHT = 600
// Actual dimensions will be set dynamically based on screen size
let GAME_WIDTH = BASE_GAME_WIDTH
let GAME_HEIGHT = BASE_GAME_HEIGHT
// Scale factor for responsive sizing
let SCALE_FACTOR = 1

// Add touch control types to Window interface
declare global {
  interface Window {
    handleTouchStart: (direction: string) => void;
    handleTouchEnd: (direction: string) => void;
  }
}
const BORDER_WIDTH = 1
const BOTTOM_BORDER_WIDTH = 40 // Thicker bottom border to accommodate text
const PLAYER_SIZE = 40
const PLAYER_SPEED = 5
const BULLET_SIZE = 5
const BULLET_SPEED = 10
const SHOOT_COOLDOWN = 200 // ms
const SEGMENT_SIZE = 20
const MUSHROOM_SIZE = 20
const SECTION_SIZE = MUSHROOM_SIZE / 4
const SPIDER_SIZE = 20
const PARTICLE_COUNT = 8 // Reduced for performance optimization

// Enemy scaling constants
const BASE_MOLOCH_SPEED = 0.6 // Base speed for level 1 (reduced from 1.0)
const BASE_SPIDER_SPEED = 0.5 // Base spider speed for level 1 (reduced from 0.8)
const SPEED_INCREASE_PER_LEVEL = 0.1 // Speed increases by this amount per level
const BASE_SEGMENT_COUNT = 20 // Base Moloch centipede length for level 1
const SEGMENTS_INCREASE_LEVEL = 3 // Moloch centipede grows longer every X levels

// Visual enhancement constants
const GLOW_COLOR = "rgba(0, 255, 255, 0.7)" // Cyan glow for player and bullets
const PLAYER_GLOW_RADIUS = 45
const BULLET_GLOW_RADIUS = 10
const EXPLOSION_COLORS = ["#FF5E5E", "#FFD700", "#FF8C00", "#FFA07A", "#FFFF00"] // Fire colors
const BG_GRADIENT_COLORS = ["#000033", "#000066", "#000033"] // Deep space blue gradient
const GRID_SIZE = SEGMENT_SIZE // Using segment size as grid size
const PARTICLE_SIZE = 1.5 // Smaller particles
const BASIC_PARTICLE_COUNT = 4 // Basic particles for simple effects
const BULLET_RADIUS = 6 // Larger hit radius for bullets
const MUSHROOM_FALL_CHANCE = 0.01 // Chance for a mushroom to start falling each frame
const MUSHROOM_FALL_SPEED = 1 // Speed at which mushrooms fall

// Egg colors for the mushroom blocks
const EGG_COLORS = [
  ["#8B4513", "#A52A2A", "#CD853F", "#D2691E"], // Brown variants
  ["#6B8E23", "#556B2F", "#808000", "#9ACD32"], // Green variants
  ["#4682B4", "#5F9EA0", "#6495ED", "#87CEEB"], // Blue variants
  ["#9370DB", "#8A2BE2", "#9932CC", "#BA55D3"], // Purple variants
  ["#FF6347", "#FF4500", "#FF7F50", "#FFA07A"], // Red/orange variants
]

// Emoji heads for Moloch centipede
const EMOJI_HEADS = [
  "👹",
]

// Metallic colors for armored segments
const METALLIC_COLORS = ["#A9A9A9", "#C0C0C0", "#D3D3D3", "#B8B8B8"]

// Global variables to store the current level's emoji and game level
let CURRENT_LEVEL_EMOJI = "👹" // Default emoji
let CURRENT_GAME_LEVEL = 1 // Default game level

// Game entities
interface Vector2 {
  x: number
  y: number
}

// Power-up item type
type PowerUp = {
  position: Vector2
  size: number
  type: 'plasma'
  active: boolean
  timeCreated: number
  pulsePhase: number // For visual pulsing effect
}

type Player = {
  position: Vector2
  size: number
  speed: number
  color: string
  energized: boolean
  energyTimer: number
  killCount: number
  energyThreshold: number
  energyDuration: number
  plasmaAmmo: number
  plasmaActive: boolean
  plasmaTimer: number
  plasmaDuration: number
}

type Bullet = {
  position: Vector2
  size: number
  speed: number
  active: boolean
  isPlasma?: boolean // Flag for enhanced plasma bullets
  velocity?: Vector2 // Direction vector for multi-directional bullets
}

type Particle = {
  position: Vector2
  velocity: Vector2
  size: number
  color: string
  lifespan: number
  createdAt: number
}

type Mushroom = {
  position: Vector2
  size: number
  health: number
  colorSet: string[] // Array of colors for the egg
  sections: boolean[] // 16 sections (4x4 grid)
}

class MolochSegment {
  position: Vector2
  direction: number // +1 = right, -1 = left
  stepSize: number // in pixels (e.g., tile size)
  isHead: boolean
  isAlive = true
  isArmored = false
  armorLevel = 0
  color: string
  emoji = ""
  reachedBottom = false
  size: number // Add size property
  triggerRoundTrip?: () => void // Callback for round trip completion

  constructor(position: Vector2, direction: number, stepSize: number, isHead: boolean) {
    this.position = position
    this.direction = direction
    this.stepSize = stepSize
    this.isHead = isHead
    this.color = isHead ? "#00FF00" : "#00CC00" // Head is brighter green
    this.size = SEGMENT_SIZE // Initialize with default size
    // Initialize armor level based on segment type
    this.armorLevel = isHead ? 3 : 0 // Heads start with 3 armor points
    
    // Emoji will be assigned by the chain constructor based on the level's emoji
  }

  move(gridWidth: number, gridHeight: number, obstacles: Set<string>) {
        if (!this.isHead || !this.isAlive) return

    // Check if reached bottom
    if (this.position.y >= gridHeight - BOTTOM_BORDER_WIDTH - this.size * 2) {
      if (!this.reachedBottom) {
        this.reachedBottom = true
        this.isArmored = true
        this.armorLevel = 6 // Increase to 6 hits to destroy bottom armored
      }
      // Reverse vertical direction but keep moving horizontally
      this.position.y = gridHeight - BOTTOM_BORDER_WIDTH - this.size * 2 // Ensure it doesn't go below bottom

      // Continue moving horizontally at the bottom
      const nextX = this.position.x + this.direction * this.stepSize
      const hitsBoundary = nextX < BORDER_WIDTH || nextX >= gridWidth - BORDER_WIDTH - this.size

      if (hitsBoundary) {
        this.direction *= -1 // Reverse horizontal direction at boundaries
      } else {
        this.position.x = nextX // Continue moving horizontally
      }

      // Occasionally try to move up if at bottom
      if (Math.random() < 0.05) {
        this.position.y -= this.stepSize // Try to move up
      }
    } else {
      const nextX = this.position.x + this.direction * this.stepSize
      const key = `${Math.floor(nextX / GRID_SIZE)},${Math.floor(this.position.y / GRID_SIZE)}`
      const hitsBoundary = nextX < BORDER_WIDTH || nextX >= gridWidth - BORDER_WIDTH - this.size
      const hitsObstacle = obstacles.has(key)

      if (hitsBoundary || hitsObstacle) {
        this.direction *= -1

        // If reached bottom and going back up, move up instead of down when hitting obstacles
        if (this.reachedBottom) {
          this.position.y -= this.stepSize
        } else {
          this.position.y += this.stepSize
        }
      } else {
        this.position.x = nextX
      }

      // If reached top after being at bottom, reset reachedBottom flag
      if (this.reachedBottom && this.position.y <= BORDER_WIDTH + this.size * 2) {
        this.reachedBottom = false
        // Remove armor when going back to top if it had been added automatically
        if (this.isArmored && this.armorLevel <= 6) {
          this.isArmored = false
          this.armorLevel = 0
        }
        
        // Trigger round trip completion for head segments only
        if (this.isHead) {
          this.triggerRoundTrip?.()
        }
      }
    }
  }

  takeDamage(damage: number = 1) {
    if (this.isArmored) {
      this.armorLevel -= damage
      if (this.armorLevel <= 0) {
        // When armor is depleted, immediately destroy the segment
        this.isArmored = false
        this.isAlive = false
        return { destroyed: true, hitArmor: true } // Segment is destroyed after armor depletion
      }
      return { destroyed: false, hitArmor: true } // Armor took the hit, segment still alive
    } else {
      // Unarmored segments die with a single hit (damage doesn't matter for unarmored)
      this.isAlive = false
      return { destroyed: true, hitArmor: false } // Segment is destroyed
    }
  }
}

class MolochChain {
  segments: MolochSegment[]
  delay: number // time between updates per segment
  stepSize: number
  lastUpdateTime: number

  constructor(
    segmentCount: number,
    startPosition: Vector2,
    direction: number,
    segmentSize: number,
    speed: number = BASE_MOLOCH_SPEED,
  ) {
    // Scale speed based on level
    const level = CURRENT_GAME_LEVEL || 1
    speed = BASE_MOLOCH_SPEED + (level - 1) * SPEED_INCREASE_PER_LEVEL
    this.stepSize = CURRENT_GAME_LEVEL === 1 ? segmentSize * 0.7 : segmentSize
    this.segments = []
    
    // Adjust delay based on level (longer delay = slower movement at level 1)
    // At level 1: 70ms, level 2: 50ms, level 3+: 30ms
    this.delay = Math.max(30, 90 - (level - 1) * 20)
    this.lastUpdateTime = Date.now()
    
    // Use the global level emoji instead of accessing gameStateRef
    const levelEmoji = CURRENT_LEVEL_EMOJI

    // Create the segments for the chain
    for (let i = 0; i < segmentCount; i++) {
      const isHead = i === 0
      const segmentPos = { ...startPosition }

      // If not the head, position behind the previous segment
      if (!isHead) {
        segmentPos.x -= i * segmentSize * direction
      }

      const segment = new MolochSegment(segmentPos, direction, segmentSize, isHead)
      
      // Set the emoji for head segments using the level's emoji
      if (isHead) {
        segment.emoji = levelEmoji
      }
      
      this.segments.push(segment)
    }
  }

  update(gridWidth: number, gridHeight: number, obstacles: Set<string>) {
    // Only update at certain intervals for smoother movement
    const now = Date.now()
    if (now - this.lastUpdateTime < this.delay) return
    this.lastUpdateTime = now

    // Check if segments array is empty
    if (this.segments.length === 0) return

    // Move head
    this.segments[0].move(gridWidth, gridHeight, obstacles)

    // Move body - each segment follows the one in front
    for (let i = this.segments.length - 1; i > 0; i--) {
      if (!this.segments[i].isAlive) continue

      // Store previous position of the segment ahead
      const prevSegment = this.segments[i - 1]

      // Follow the segment ahead
      this.segments[i].position = { ...prevSegment.position }

      // Check all segments for reach bottom at once
      for (let j = 0; j < this.segments.length; j++) {
        if (this.segments[j].position.y >= gridHeight - BOTTOM_BORDER_WIDTH - SEGMENT_SIZE * 2) {
          // Apply armor to all segments at the bottom
          for (let k = 0; k < this.segments.length; k++) {
            if (!this.segments[k].isArmored) {
              this.segments[k].isArmored = true
              // Different armor levels for different segment types
              this.segments[k].armorLevel = this.segments[k].isHead ? 5 : 7 // Heads: 5 hits, Body: 7 hits
              if (!this.segments[k].isHead) {
                this.segments[k].color = METALLIC_COLORS[Math.floor(Math.random() * METALLIC_COLORS.length)]
              }
            }
          }
        }
      }
    }
  }

  // Create a new chain from segments starting at index
  createNewChainFromSegments(index: number): MolochChain | null {
    if (index <= 0 || index >= this.segments.length) return null

    // Get segments for the new chain
    const newSegments = this.segments.slice(index)

    // Remove these segments from the current chain
    this.segments = this.segments.slice(0, index)

    // If no segments left in either chain, return null
    if (newSegments.length === 0) return null
    if (this.segments.length === 0) return null

    // Make the first segment of the new chain the head
    newSegments[0].isHead = true
    // Assign the current level emoji to the new head using the global variable
    newSegments[0].emoji = CURRENT_LEVEL_EMOJI
    // Reverse direction for the new chain
    newSegments[0].direction *= -1

    // Create a new chain with these segments
    // Create a new chain with these segments
    // The speed will be controlled by the global CURRENT_GAME_LEVEL variable
    const newChain = new MolochChain(0, { x: 0, y: 0 }, newSegments[0].direction, this.stepSize)
    newChain.segments = newSegments

    return newChain
  }

  splitAt(index: number): MolochChain[] {
    if (index <= 0 || index >= this.segments.length) return [this]

    const leftSegments = this.segments.slice(0, index)
    const rightSegments = this.segments.slice(index + 1)

    // Make the first segment of the right chain the new head
    if (rightSegments.length > 0) {
      rightSegments[0].isHead = true
      // Assign the current level emoji to the new head using the global variable
      rightSegments[0].emoji = CURRENT_LEVEL_EMOJI
    }

    // Create new chains from the segments
    const chains: MolochChain[] = []

    if (leftSegments.length > 0) {
      const leftChain = new MolochChain(0, { x: 0, y: 0 }, 1, this.stepSize)
      leftChain.segments = leftSegments
      // Carry over the delay from the parent chain to maintain speed consistency
      leftChain.delay = this.delay
      chains.push(leftChain)
    }

    if (rightSegments.length > 0) {
      const rightChain = new MolochChain(0, { x: 0, y: 0 }, 1, this.stepSize)
      rightChain.segments = rightSegments
      // Carry over the delay from the parent chain to maintain speed consistency
      rightChain.delay = this.delay
      rightChain.segments = rightSegments
      chains.push(rightChain)
    }

    return chains
  }
}

class Spider {
  position: Vector2
  direction: Vector2
  speed: number
  size: number
  isAlive = true
  color = "#FF0000" // Red color for spiders
  targetBlock: Vector2 | null = null
  targetSection: number | null = null
  targetSections: number[] = [] // Multiple sections to chew
  chewingTime = 0
  chewingDuration = 350 // Faster chewing through sections (was 500ms)
  isChewing = false
  lastDirectionChange = 0
  directionChangeDelay = 1000 // ms between direction changes
  chaseSpeed = .5 // Moderate speed when chasing (was 0.5)
  isAtBottom = false // Flag to track if spider is at the bottom
  aggressiveChaseSpeed = 1.5 // Faster speed when aggressively chasing

  constructor(position: Vector2, speed: number, size: number) {
    this.position = position
    this.direction = { x: Math.random() > 0.5 ? 1 : -1, y: 0 } // Start moving horizontally
    // Apply level-based speed scaling
    const level = CURRENT_GAME_LEVEL || 1
    this.speed = speed * (BASE_SPIDER_SPEED + (level - 1) * SPEED_INCREASE_PER_LEVEL)
    this.size = size
    this.lastDirectionChange = Date.now()
  }

  update(bounds: Vector2, obstacles: Set<string>, mushrooms: Mushroom[], playerPosition: Vector2) {
    // If currently chewing a block
    if (this.isChewing && this.targetBlock && this.targetSections.length > 0) {
      this.chewingTime += 16 // Assuming ~60fps

      // If finished chewing
      if (this.chewingTime >= this.chewingDuration) {
        this.isChewing = false
        this.chewingTime = 0

        // Find the mushroom we're chewing
        const mushroom = mushrooms.find(
          (m) => m.position.x === this.targetBlock!.x && m.position.y === this.targetBlock!.y,
        )

        // Destroy the sections we're chewing (up to 2 at a time)
        if (mushroom) {
          for (const sectionIndex of this.targetSections) {
            if (sectionIndex >= 0 && sectionIndex < 16 && mushroom.sections[sectionIndex]) {
              mushroom.sections[sectionIndex] = false
              mushroom.health--
            }
          }
        }

        this.targetBlock = null
        this.targetSections = []

        // Target player position instead of always moving down
        const dirToPlayer = {
          x: playerPosition.x - this.position.x,
          y: playerPosition.y - this.position.y
        }
        
        // Add slight randomness to prevent coordinated group behavior
        dirToPlayer.x += (Math.random() * 0.6 - 0.3)
        dirToPlayer.y += (Math.random() * 0.6 - 0.3)
        
        // Normalize direction
        const length = Math.sqrt(dirToPlayer.x * dirToPlayer.x + dirToPlayer.y * dirToPlayer.y)
        if (length > 0) {
          this.direction = {
            x: dirToPlayer.x / length,
            y: dirToPlayer.y / length
          }
        } else {
          // Fallback to random direction if exactly at player position
          this.direction = { 
            x: Math.random() * 2 - 1, 
            y: Math.random() * 2 - 1 
          }
        }
        
        // Force movement away from the block we just chewed to prevent getting stuck
        this.position.x += this.direction.x * 2
        this.position.y += this.direction.y * 2
      }
      return
    }

    // Check if there's a block below, above, or to the sides
    const blockInfo = this.findBlockInPath(mushrooms)

    if (blockInfo) {
      // Start chewing the block or change direction
      if (this.direction.y > 0 && blockInfo.direction === "below") {
        // If moving down and block is below, start chewing
        this.isChewing = true
        this.targetBlock = { x: blockInfo.mushroom.position.x, y: blockInfo.mushroom.position.y }

        // Find a second adjacent section to chew if possible
        this.targetSections = [blockInfo.sectionIndex]

        // Try to find an adjacent section that's also active
        const row = Math.floor(blockInfo.sectionIndex / 4)
        const col = blockInfo.sectionIndex % 4

        // Check right
        if (col < 3 && blockInfo.mushroom.sections[row * 4 + col + 1]) {
          this.targetSections.push(row * 4 + col + 1)
        }
        // Check left
        else if (col > 0 && blockInfo.mushroom.sections[row * 4 + col - 1]) {
          this.targetSections.push(row * 4 + col - 1)
        }
        // Check below
        else if (row < 3 && blockInfo.mushroom.sections[(row + 1) * 4 + col]) {
          this.targetSections.push((row + 1) * 4 + col)
        }
        // Check above
        else if (row > 0 && blockInfo.mushroom.sections[(row - 1) * 4 + col]) {
          this.targetSections.push((row - 1) * 4 + col)
        }

        return
      } else {
        // Try to chew through blocks in any direction to prevent getting stuck
        this.isChewing = true
        this.targetBlock = { x: blockInfo.mushroom.position.x, y: blockInfo.mushroom.position.y }
        this.targetSections = [blockInfo.sectionIndex]
        
        // Find a second adjacent section to chew if possible
        const row = Math.floor(blockInfo.sectionIndex / 4)
        const col = blockInfo.sectionIndex % 4
        
        // Check neighboring sections in all directions
        const neighbors = [
          row * 4 + ((col + 1) % 4),      // right
          row * 4 + ((col - 1 + 4) % 4),  // left
          ((row + 1) % 4) * 4 + col,      // below
          ((row - 1 + 4) % 4) * 4 + col   // above
        ]
        
        for (const neighbor of neighbors) {
          if (blockInfo.mushroom.sections[neighbor]) {
            this.targetSections.push(neighbor)
            break
          }
        }
        this.lastDirectionChange = Date.now()
        return
      }
    }

    const now = Date.now()

    // Check if spider is at the bottom of the screen
    this.isAtBottom = this.position.y >= bounds.y - BORDER_WIDTH - this.size - 10

    // More aggressive chasing when at the bottom
    if (this.isAtBottom) {
      // Calculate direction to player
      const dirToPlayer = {
        x: playerPosition.x - this.position.x,
        y: playerPosition.y - this.position.y,
      }

      // Normalize direction
      const length = Math.sqrt(dirToPlayer.x * dirToPlayer.x + dirToPlayer.y * dirToPlayer.y)
      if (length > 0) {
        dirToPlayer.x /= length
        dirToPlayer.y /= length
      }

      // Set direction toward player with higher probability
      if (Math.random() < 0.3 || now - this.lastDirectionChange > this.directionChangeDelay) {
        this.direction = {
          x: dirToPlayer.x,
          y: dirToPlayer.y < 0 ? -1 : 0, // Only go up or horizontal
        }
        this.lastDirectionChange = now
      }
    }
    // Normal behavior when not at bottom
    else {
      // Calculate direction to player for more direct targeting
      const dirToPlayer = {
        x: playerPosition.x - this.position.x,
        y: playerPosition.y - this.position.y
      }
      const distance = Math.sqrt(dirToPlayer.x * dirToPlayer.x + dirToPlayer.y * dirToPlayer.y)
      
      // Normalize direction
      if (distance > 0) {
        dirToPlayer.x /= distance
        dirToPlayer.y /= distance
      }
      
      // More frequently change direction to chase player (50% chance vs 10% before)
      if (now - this.lastDirectionChange > this.directionChangeDelay && Math.random() < 0.5) {
        // Move toward player with slight randomness for more natural movement
        this.direction = {
          x: dirToPlayer.x + (Math.random() * 0.4 - 0.2),
          y: dirToPlayer.y + (Math.random() * 0.4 - 0.2)
        }
        
        // Normalize direction vector
        const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y)
        if (length > 0) {
          this.direction.x /= length
          this.direction.y /= length  
        }
        
        this.lastDirectionChange = now
      }
      // Occasionally move randomly (reduced from 5% to 2% chance)
      else if (now - this.lastDirectionChange > this.directionChangeDelay && Math.random() < 0.02) {
        // Random movement as before
        if (this.direction.y === 0) {
          this.direction = { x: 0, y: 1 }
        } else if (this.direction.y > 0) {
          this.direction = { x: Math.random() > 0.5 ? 1 : -1, y: 0 }
        } else {
          this.direction = { x: Math.random() > 0.5 ? 1 : -1, y: 0 }
        }
        this.lastDirectionChange = now
      }
    }

    // Store previous position for collision detection
    const prevPosition = { ...this.position }

    // Normal movement if not chewing
    const actualSpeed = this.isAtBottom
      ? this.aggressiveChaseSpeed
      : this.direction.y < 0
        ? this.chaseSpeed
        : this.speed // Slower when moving up, faster when aggressive

    this.position.x += this.direction.x * actualSpeed
    this.position.y += this.direction.y * actualSpeed

    // Enforce boundaries - keep spiders inside the play area
    if (this.position.x < BORDER_WIDTH) {
      this.position.x = BORDER_WIDTH
      this.direction.x *= -1
    } else if (this.position.x > bounds.x - BORDER_WIDTH - this.size) {
      this.position.x = bounds.x - BORDER_WIDTH - this.size
      this.direction.x *= -1
    }

    // If hit bottom, stay at bottom and move horizontally
    if (this.position.y >= bounds.y - BORDER_WIDTH - this.size) {
      this.position.y = bounds.y - BORDER_WIDTH - this.size
      if (this.direction.y > 0) {
        this.direction = { x: Math.random() > 0.5 ? 1 : -1, y: 0 }
      }
    }

    // If hit top, start moving horizontally or down
    if (this.position.y <= BORDER_WIDTH) {
      this.position.y = BORDER_WIDTH
      this.direction = { x: Math.random() > 0.5 ? 1 : -1, y: Math.random() > 0.7 ? 0 : 1 }
    }

    // Check for collisions with mushrooms after moving
    for (let i = 0; i < mushrooms.length; i++) {
      const mushroom = mushrooms[i]
      const collision = this.checkCollisionWithMushroom(mushroom)
      
      if (collision.collided) {
        // Start chewing instead of just destroying one section
        // This prevents getting stuck in collision loops
        this.isChewing = true
        this.targetBlock = { x: mushroom.position.x, y: mushroom.position.y }
        this.chewingTime = 0
        
        // Find sections to chew
        let activeSections = []
        for (let j = 0; j < mushroom.sections.length; j++) {
          if (mushroom.sections[j]) {
            activeSections.push(j)
          }
        }
        
        // If there are active sections, target up to 3 of them
        if (activeSections.length > 0) {
          this.targetSections = []
          for (let j = 0; j < Math.min(3, activeSections.length); j++) {
            const randomIndex = Math.floor(Math.random() * activeSections.length)
            this.targetSections.push(activeSections[randomIndex])
            activeSections.splice(randomIndex, 1) // Remove to avoid duplicates
          }
          return // Start chewing
        }
        
        // If no active sections, revert position and change direction
        this.position = prevPosition

        // Calculate direction toward player with random component
        const dirToPlayer = {
          x: playerPosition.x - this.position.x,
          y: playerPosition.y - this.position.y
        }
        
        // Normalize and add randomness
        const length = Math.sqrt(dirToPlayer.x * dirToPlayer.x + dirToPlayer.y * dirToPlayer.y)
        if (length > 0) {
          this.direction = {
            x: (dirToPlayer.x / length) + (Math.random() * 0.8 - 0.4),
            y: (dirToPlayer.y / length) + (Math.random() * 0.8 - 0.4)
          }
        } else {
          // Random direction if exactly at player
          this.direction = { 
            x: Math.random() * 2 - 1, 
            y: Math.random() * 2 - 1 
          }
        }
        
        // Normalize final direction
        const dirLength = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y) 
        if (dirLength > 0) {
          this.direction.x /= dirLength
          this.direction.y /= dirLength
        }

        this.lastDirectionChange = Date.now()
        break
      }
    }
  }

  checkCollisionWithMushroom(mushroom: Mushroom): { collided: boolean; destroyed: boolean } {
    // Check if any part of the spider collides with any section of the mushroom
    const spiderRight = this.position.x + this.size
    const spiderBottom = this.position.y + this.size
    const mushroomRight = mushroom.position.x + mushroom.size
    const mushroomBottom = mushroom.position.y + mushroom.size

    if (
      this.position.x < mushroomRight &&
      spiderRight > mushroom.position.x &&
      this.position.y < mushroomBottom &&
      spiderBottom > mushroom.position.y
    ) {
      // Determine if the spider should destroy a section of the mushroom
      // Higher chance to destroy if the spider is aggressive (at bottom of screen)
      const destroyChance = this.isAtBottom ? 0.6 : 0.3
      const shouldDestroy = Math.random() < destroyChance

      return { collided: true, destroyed: shouldDestroy }
    }
    return { collided: false, destroyed: false }
  }

  findBlockInPath(mushrooms: Mushroom[]): { mushroom: Mushroom; sectionIndex: number; direction: string } | null {
    // Check for blocks in the direction we're moving
    for (const mushroom of mushrooms) {
      // Check each section of the mushroom
      for (let i = 0; i < 16; i++) {
        if (!mushroom.sections[i]) continue

        const sectionX = mushroom.position.x + (i % 4) * SECTION_SIZE
        const sectionY = mushroom.position.y + Math.floor(i / 4) * SECTION_SIZE

        // Check below (if moving down)
        if (
          this.direction.y > 0 &&
          this.position.x < sectionX + SECTION_SIZE &&
          this.position.x + this.size > sectionX &&
          this.position.y + this.size <= sectionY &&
          this.position.y + this.size + this.speed >= sectionY
        ) {
          return { mushroom, sectionIndex: i, direction: "below" }
        }

        // Check above (if moving up)
        if (
          this.direction.y < 0 &&
          this.position.x < sectionX + SECTION_SIZE &&
          this.position.x + this.size > sectionX &&
          this.position.y >= sectionY + SECTION_SIZE &&
          this.position.y - this.speed <= sectionY + SECTION_SIZE
        ) {
          return { mushroom, sectionIndex: i, direction: "above" }
        }

        // Check left (if moving left)
        if (
          this.direction.x < 0 &&
          this.position.y < sectionY + SECTION_SIZE &&
          this.position.y + this.size > sectionY &&
          this.position.x >= sectionX + SECTION_SIZE &&
          this.position.x - this.speed <= sectionX + SECTION_SIZE
        ) {
          return { mushroom, sectionIndex: i, direction: "left" }
        }

        // Check right (if moving right)
        if (
          this.direction.x > 0 &&
          this.position.y < sectionY + SECTION_SIZE &&
          this.position.y + this.size > sectionY &&
          this.position.x + this.size <= sectionX &&
          this.position.x + this.size + this.speed >= sectionX
        ) {
          return { mushroom, sectionIndex: i, direction: "right" }
        }
      }
    }
    return null;
  }
}

export default function MolochGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameContainerRef = useRef<HTMLDivElement | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [levelIntro, setLevelIntro] = useState(false)
  const [levelIntroCountdown, setLevelIntroCountdown] = useState(5)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [sfxMuted, setSfxMuted] = useState(false)
  const [musicMuted, setMusicMuted] = useState(false)
  const [isClaimingReward, setIsClaimingReward] = useState(false)
  const [rewardSignature, setRewardSignature] = useState<{amount: string, nonce: string, signature: string, scoreId?: number} | null>(null)
  const [hasClaimed, setHasClaimed] = useState(false)
  
  // Game flow states
  const [gamePhase, setGamePhase] = useState<'connect' | 'burn' | 'ready' | 'playing' | 'gameover' | 'leaderboard'>('connect')
  const [hasBurnedTokens, setHasBurnedTokens] = useState(false)
  const [isBurning, setIsBurning] = useState(false)
  const [burnTransaction, setBurnTransaction] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<Array<{address: string, score: number, claimed: boolean}>>([])
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false)
  
  // Wallet hooks
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain({
    mutation: {
      onSuccess: (data) => {
        console.log('Successfully switched to network:', data.name, 'ID:', data.id)
      },
      onError: (error) => {
        console.error('Network switch error:', error)
        setIsBurning(false)
      }
    }
  })
  
  // Contract hooks
  const { data: ariBalance } = useReadContract({
    address: ARI_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })
  
  const { writeContract, data: burnTxHash, isPending: isBurnPending, error: burnError } = useWriteContract()
  
  const { isLoading: isBurnConfirming, isSuccess: isBurnConfirmed } = useWaitForTransactionReceipt({
    hash: burnTxHash,
  })

  // Faucet contract hooks
  const { writeContract: writeClaimContract, data: claimTxHash, isPending: isClaimPending, error: claimError } = useWriteContract()
  
  const { isLoading: isClaimConfirming, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  })
  
  // Create image for player ship and spider
  const shipImageRef = useRef<HTMLImageElement | null>(null)
  const hungryImageRef = useRef<HTMLImageElement | null>(null)

  // Game state refs to avoid dependency issues in the game loop
  const gameStateRef = useRef({
    player: {
      position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - PLAYER_SIZE * 2 },
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      color: "#FF0000",
      energized: false,
      energyTimer: 0,
      killCount: 0,
      energyThreshold: 20,
      energyDuration: 5000,
      plasmaAmmo: 0,
      plasmaActive: false,
      plasmaTimer: 0,
      plasmaDuration: 5000,
    } as Player,
    bullets: [] as Bullet[],
    molochChains: [] as MolochChain[],
    spiders: [] as Spider[],
    mushrooms: [] as Mushroom[],
    particles: [] as Particle[],
    powerUps: [] as PowerUp[],
    obstacleGrid: new Set<string>(),
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
    },
    autoShootEnabled: false, // New state for toggle shooting
    lastShootTime: 0,
    lastUpdateTime: 0,
    lastSpiderSpawnTime: 0,
    spiderSpawnRate: 10000,
    lastPowerUpSpawnTime: 0,
    powerUpSpawnRate: 45000, // Increased from 15000 to 45000 (45 seconds) to make power-ups more rare
    spiderKillCount: 0, // Track spider kills for power-up spawning
    lastMushroomSpawnTime: 0,
    mushroomSpawnRate: 3000,
    score: 0,
    level: 1,
    gameOver: false,
    levelEmoji: "",
    // Enhanced centipede management
    centipedesSpawned: 0, // How many centipedes spawned this level
    maxCentipedesPerLevel: 4, // Total centipedes to spawn per level (ensures longer gameplay)
    roundTripTriggers: 0, // Track round trips to spawn additional centipedes
    lastKeyResetTime: 0, // Track time for stuck key detection
    shockwaveEffect: null as {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      startTime: number;
      duration: number;
    } | null, // Track shockwave effect state
  })

  // Create particles when mushroom is hit
  const createMushroomParticles = (position: Vector2, sectionIndex: number, colorSet: string[]) => {
    const state = gameStateRef.current

    // Calculate section position
    const sectionX = position.x + (sectionIndex % 4) * SECTION_SIZE
    const sectionY = position.y + Math.floor(sectionIndex / 4) * SECTION_SIZE

    // Create simplified particles for better performance
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      // Simplify color selection
      const color = colorSet[Math.floor(Math.random() * colorSet.length)]

      state.particles.push({
        position: {
          x: sectionX + SECTION_SIZE / 2,
          y: sectionY + SECTION_SIZE / 2,
        },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        size: 1 + Math.random() * 2, // Smaller particles
        color,
        createdAt: Date.now(),
        lifespan: 200 + Math.random() * 300, // Shorter lifespan
      })
    }
  }

  // Create a new mushroom
  const createMushroom = (x: number, y: number) => {
    const state = gameStateRef.current

    // Align to grid and ensure mushrooms don't spawn on borders
    let gridX = Math.floor(x / GRID_SIZE) * GRID_SIZE
    let gridY = Math.floor(y / GRID_SIZE) * GRID_SIZE
    
    // Ensure mushrooms stay within playable area (away from borders)
    if (gridX < BORDER_WIDTH + GRID_SIZE) {
      gridX = BORDER_WIDTH + GRID_SIZE
    } else if (gridX > GAME_WIDTH - BORDER_WIDTH - MUSHROOM_SIZE - GRID_SIZE) {
      gridX = GAME_WIDTH - BORDER_WIDTH - MUSHROOM_SIZE - GRID_SIZE
    }
    
    if (gridY < BORDER_WIDTH + GRID_SIZE) {
      gridY = BORDER_WIDTH + GRID_SIZE
    } else if (gridY > GAME_HEIGHT - BOTTOM_BORDER_WIDTH - MUSHROOM_SIZE - GRID_SIZE) {
      gridY = GAME_HEIGHT - BOTTOM_BORDER_WIDTH - MUSHROOM_SIZE - GRID_SIZE
    }

    // Select a random color set for this egg
    const colorSet = EGG_COLORS[Math.floor(Math.random() * EGG_COLORS.length)]

    const mushroom: Mushroom = {
      position: { x: gridX, y: gridY },
      size: MUSHROOM_SIZE,
      health: 16, // 16 sections (4x4 grid)
      colorSet, // Assign the color set
      sections: Array(16).fill(true), // All 16 sections intact
    }

    state.mushrooms.push(mushroom)

    // Add to obstacle grid
    const key = `${Math.floor(gridX / GRID_SIZE)},${Math.floor(gridY / GRID_SIZE)}`
    state.obstacleGrid.add(key)

    return mushroom
  }

  // Initialize game
  // Function to spawn a new centipede
  const spawnCentipede = () => {
    const state = gameStateRef.current
    
    // Check if we can spawn more centipedes this level
    if (state.centipedesSpawned >= state.maxCentipedesPerLevel) {
      return
    }
    
    // Create Moloch centipede chain with length based on level
    const bonusSegments = state.level - 1 // One extra segment per level
    const segmentCount = BASE_SEGMENT_COUNT + bonusSegments
    
    const startX = Math.random() > 0.5 ? BORDER_WIDTH : GAME_WIDTH - BORDER_WIDTH - SEGMENT_SIZE
    const direction = startX === BORDER_WIDTH ? 1 : -1
    const startY = SEGMENT_SIZE + BORDER_WIDTH

    // Create the Moloch centipede chain
    const molochChain = new MolochChain(segmentCount, { x: startX, y: startY }, direction, SEGMENT_SIZE)
    
    // Set up round trip callback for the head segment
    if (molochChain.segments.length > 0 && molochChain.segments[0].isHead) {
      molochChain.segments[0].triggerRoundTrip = () => {
        const currentState = gameStateRef.current
        currentState.roundTripTriggers++
        console.log(`🔄 Round trip completed! Triggers: ${currentState.roundTripTriggers}`)
        
        // Always try to spawn additional centipede after round trip
        // The main game loop will check limits and spawn if appropriate
        setTimeout(() => {
          console.log(`🔄 Round trip triggering spawn check...`)
          // No direct spawn here - let the main game loop handle it
        }, 500)
      }
    }

    state.molochChains.push(molochChain)
    state.centipedesSpawned++
    
    console.log(`🐛 Spawned centipede ${state.centipedesSpawned}/${state.maxCentipedesPerLevel} for level ${state.level}`)
  }

  const initGame = () => {
    setGameStarted(true)
    setGameOver(false)

    // Initialize sound manager if not already created
    if (!soundManager) {
      soundManager = new SoundManager()
      // Enable audio on first user interaction
      soundManager.enableAudio()
      
      // Sync React state with SoundManager state
      setSfxMuted(soundManager.isSfxMuted())
      setMusicMuted(soundManager.isMusicMuted())
    }

    // Reset game state
    const state = gameStateRef.current
    state.player = {
      position: {
        x: GAME_WIDTH / 2 - PLAYER_SIZE / 2,
        y: GAME_HEIGHT - PLAYER_SIZE * 2,
      },
      size: PLAYER_SIZE,
      speed: PLAYER_SPEED,
      color: "#00FFFF", // Cyan
      energized: false,
      energyTimer: 0,
      killCount: 0,
      energyThreshold: 20, // Number of kills needed to get energy
      energyDuration: 5000, // 5 seconds of energized mode
      plasmaAmmo: 0,
      plasmaActive: false,
      plasmaTimer: 0,
      plasmaDuration: 5000, // 5 seconds of plasma mode
    }
    state.bullets = []
    state.mushrooms = []
    state.particles = []
    state.molochChains = []
    state.spiders = []
    state.powerUps = []
    state.obstacleGrid = new Set()
    // Note: score is not reset here - it should be set correctly by caller (0 for new game, preserved for level progression)
    state.lastUpdateTime = Date.now()
    state.lastSpiderSpawnTime = Date.now()
    
    // Choose a random emoji for this level's Moloch centipede and update global variables
    state.levelEmoji = EMOJI_HEADS[Math.floor(Math.random() * EMOJI_HEADS.length)]
    CURRENT_LEVEL_EMOJI = state.levelEmoji // Update the global emoji variable
    CURRENT_GAME_LEVEL = state.level     // Update the global level variable

    // Significantly more mushrooms
    const mushroomCount = 80 + state.level * 10 // Increased from 30 to 80

    // Create mushrooms in the top half of the screen
    for (let i = 0; i < mushroomCount * 0.6; i++) {
      const mushroomX = Math.floor(Math.random() * (GAME_WIDTH - MUSHROOM_SIZE * 2 - BORDER_WIDTH * 2) + BORDER_WIDTH)
      const mushroomY = Math.floor(Math.random() * (GAME_HEIGHT / 2 - MUSHROOM_SIZE * 2) + BORDER_WIDTH)
      createMushroom(mushroomX, mushroomY)
    }

    // Create mushrooms in the player's area (bottom half)
    for (let i = 0; i < mushroomCount * 0.4; i++) {
      const mushroomX = Math.floor(Math.random() * (GAME_WIDTH - MUSHROOM_SIZE * 2 - BORDER_WIDTH * 2) + BORDER_WIDTH)
      const mushroomY = Math.floor(Math.random() * (GAME_HEIGHT / 2) + GAME_HEIGHT / 2)
      createMushroom(mushroomX, mushroomY)
    }

    // Reset centipede tracking for new level
    state.centipedesSpawned = 0
    state.roundTripTriggers = 0
    
    // Spawn initial centipede for the level
    spawnCentipede()

    // Reset timers
    state.lastSpiderSpawnTime = Date.now()

    // Sync with React state values
    // Only preserve score if it's a level progression (level > 1), otherwise reset to 0
    if (level === 1) {
      state.score = 0 // Always reset to 0 for new game
      setScore(0) // Also update React state
    } else {
      state.score = score // Preserve score during level progression
    }
    state.level = level
    CURRENT_GAME_LEVEL = level // Update global level variable
    state.gameOver = false

    setGameStarted(true)
    setGameOver(false)
  }

  // Handle wallet connection effect
  useEffect(() => {
    if (isConnected && address && gamePhase === 'connect') {
      checkExistingBurn(address)
    } else if (!isConnected && gamePhase !== 'connect') {
      setGamePhase('connect')
      setHasBurnedTokens(false)
      setBurnTransaction(null)
    }
  }, [isConnected, address, gamePhase])

  // Check if user already has a verified burn
  const checkExistingBurn = async (userAddress: string) => {
    try {
      const response = await fetch(`/api/verify-burn?address=${userAddress}`)
      const result = await response.json()
      
      // Always require new burn - no reusing old burns
      setGamePhase('burn')
    } catch (error) {
      console.error('Failed to check existing burn:', error)
      setGamePhase('burn')
    }
  }

  // Handle burn confirmation - now with server verification
  useEffect(() => {
    if (isBurnConfirmed && burnTxHash && address) {
      verifyBurnOnServer(burnTxHash)
    }
  }, [isBurnConfirmed, burnTxHash, address])

  // Handle claim confirmation
  useEffect(() => {
    if (isClaimConfirmed && claimTxHash) {
      console.log('Claim confirmed! Transaction hash:', claimTxHash)
      setHasClaimed(true)
    }
  }, [isClaimConfirmed, claimTxHash])

  // Verify burn transaction on server
  const verifyBurnOnServer = async (txHash: string) => {
    try {
      const response = await fetch('/api/verify-burn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash,
          userAddress: address
        })
      })

      const result = await response.json()
      
      if (result.verified && result.canPlay) {
        setBurnTransaction(txHash)
        setHasBurnedTokens(true)
        setGamePhase('ready')
      } else {
        alert(result.error || 'Burn verification failed')
        setHasBurnedTokens(false)
      }
    } catch (error) {
      console.error('Server verification failed:', error)
      alert('Failed to verify burn on server')
      setHasBurnedTokens(false)
    } finally {
      setIsBurning(false)
    }
  }

  // Handle burn status
  useEffect(() => {
    if (isBurnPending || isBurnConfirming) {
      setIsBurning(true)
    } else if (burnError) {
      setIsBurning(false)
      console.error('Burn error:', burnError)
    }
  }, [isBurnPending, isBurnConfirming, burnError])

  // Burn ARI tokens function
  const burnTokens = async () => {
    console.log('burnTokens called - chainId:', chainId, 'base.id:', base.id)
    
    if (!address) {
      console.log('No address connected')
      return
    }
    
    // If we're not on Base, just trigger the switch - don't proceed with burn yet
    if (chainId !== base.id) {
      console.log('Not on Base network, attempting to switch...')
      try {
        console.log('Calling switchChain with chainId:', base.id)
        await switchChain({ chainId: base.id })
        console.log('switchChain call completed')
      } catch (error) {
        console.error('Error switching chain:', error)
      }
      return // Exit here, user will need to click burn again once on Base
    }
    
    // We're on Base, check ARI balance and proceed with burn
    if (!ariBalance) {
      console.log('No ARI balance data')
      return
    }
    
    const requiredAmount = BigInt(REQUIRED_BURN_AMOUNT)
    if (ariBalance < requiredAmount) {
      console.log('Insufficient ARI balance:', ariBalance.toString(), 'required:', requiredAmount.toString())
      return
    }
    
    console.log('Proceeding with burn transaction')
    setIsBurning(true)
    
    try {
      writeContract({
        address: ARI_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'burn',
        args: [requiredAmount],
      })
    } catch (error) {
      console.error('Error burning tokens:', error)
      setIsBurning(false)
    }
  }

  // Submit high score and get reward signature
  const submitHighScore = async () => {
    if (!address || !gameStateRef.current.score) return
    
    setIsClaimingReward(true)
    try {
      const response = await fetch('/api/generate-reward-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          score: gameStateRef.current.score
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setRewardSignature(data)
        setHasSubmittedScore(true)
        // Add to leaderboard
        const newEntry = { address, score: gameStateRef.current.score, claimed: false }
        setLeaderboard(prev => [...prev, newEntry].sort((a, b) => b.score - a.score))
        setGamePhase('leaderboard')
      } else {
        console.error('Failed to get reward signature')
      }
    } catch (error) {
      console.error('Error submitting high score:', error)
    } finally {
      setIsClaimingReward(false)
    }
  }

  // Claim reward from faucet contract
  const claimReward = async () => {
    if (!address || !rewardSignature) return
    
    console.log('Starting claim process with signature:', rewardSignature)
    
    try {
      // Convert amount to Wei (assuming amount is in tokens with 18 decimals)
      const amountInWei = parseEther(rewardSignature.amount)
      
      console.log('Calling faucet contract claimReward with:', {
        amount: amountInWei.toString(),
        nonce: rewardSignature.nonce,
        signature: rewardSignature.signature
      })
      
      // Call the faucet contract
      writeClaimContract({
        address: FAUCET_CONTRACT_ADDRESS,
        abi: FAUCET_ABI,
        functionName: 'claimReward',
        args: [
          amountInWei,
          rewardSignature.nonce,
          rewardSignature.signature as `0x${string}`
        ],
      })
      
    } catch (error) {
      console.error('Error claiming reward:', error)
    }
  }

  // Start game function (only allowed after burning)
  const startGame = () => {
    if (!hasBurnedTokens || !burnTransaction) {
      alert('You must burn ARI tokens before playing!')
      return
    }
    setGamePhase('playing')
    setGameStarted(true)
    setGameOver(false)
    handleStartGame()
  }

  // Handle game over detection
  useEffect(() => {
    if (gameOver && gamePhase === 'playing') {
      setGamePhase('gameover')
      setGameStarted(false)
      // Mark the burn as used when game ends
      markBurnAsUsed()
    }
  }, [gameOver, gamePhase])

  // Mark burn as used in database
  const markBurnAsUsed = async () => {
    if (!address || !burnTransaction) return
    
    try {
      await fetch('/api/mark-burn-used', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: address,
          txHash: burnTransaction
        })
      })
    } catch (error) {
      console.error('Failed to mark burn as used:', error)
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current

      // Always prevent default behavior for spacebar to avoid page scroll
      if (e.key === " ") {
        e.preventDefault()
      }

      // Don't process input during level intro countdown or game over
      if (levelIntro || state.gameOver) return

      switch (e.key) {
        case "ArrowLeft":
          state.keys.left = true
          break
        case "ArrowRight":
          state.keys.right = true
          break
        case "ArrowUp":
          state.keys.up = true
          break
        case "ArrowDown":
          state.keys.down = true
          break
        case " ":
          state.keys.space = true
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = gameStateRef.current

      // Always prevent default behavior for spacebar to avoid page scroll
      if (e.key === " ") {
        e.preventDefault()
      }

      // Don't process input during level intro countdown or game over
      if (levelIntro || state.gameOver) return

      switch (e.key) {
        case "ArrowLeft":
          state.keys.left = false
          break
        case "ArrowRight":
          state.keys.right = false
          break
        case "ArrowUp":
          state.keys.up = false
          break
        case "ArrowDown":
          state.keys.down = false
          break
        case " ":
          state.keys.space = false
          break
      }
    }

    // Reset all keys when focus is lost to prevent stuck keys
    const handleBlur = () => {
      const state = gameStateRef.current
      state.keys.left = false
      state.keys.right = false
      state.keys.up = false
      state.keys.down = false
      state.keys.space = false
    }

    // Reset all keys when level intro starts or game over occurs
    const resetKeys = () => {
      const state = gameStateRef.current
      state.keys.left = false
      state.keys.right = false
      state.keys.up = false
      state.keys.down = false
      state.keys.space = false
    }

    // Reset keys when entering blocked states
    if (levelIntro || gameOver) {
      resetKeys()
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur) // Reset keys on focus loss
    window.addEventListener("focus", resetKeys) // Reset keys on focus gain

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("focus", resetKeys)
    }
  }, [levelIntro, gameOver]) // Add levelIntro and gameOver to dependencies

  // Mobile touch control handlers
  window.handleTouchStart = (direction: string) => {
    const state = gameStateRef.current
    
    // Don't process input during level intro countdown or game over
    if (levelIntro || state.gameOver) return
    
    if (direction === "left") state.keys.left = true
    if (direction === "right") state.keys.right = true
    if (direction === "up") state.keys.up = true
    if (direction === "down") state.keys.down = true
    if (direction === "shoot") {
      // Toggle auto shooting with spacebar on key press, not on hold
      if (!state.keys.space) {
        state.keys.space = true
        state.autoShootEnabled = !state.autoShootEnabled
      }
    }
  }
  
  window.handleTouchEnd = (direction: string) => {
    const state = gameStateRef.current
    
    // Don't process input during level intro countdown or game over
    if (levelIntro || state.gameOver) return
    
    if (direction === "left") state.keys.left = false
    if (direction === "right") state.keys.right = false
    if (direction === "up") state.keys.up = false
    if (direction === "down") state.keys.down = false
    if (direction === "shoot") state.keys.space = false
  }

  // Game loop
  useEffect(() => {
    if (!gameStarted || levelIntro) return

    let animationFrameId: number
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")

    if (!canvas || !ctx) return

    // Load the ship image with error handling
    const shipImage = new Image()
    shipImage.onload = () => {
      console.log('Ship image loaded successfully')
    }
    shipImage.onerror = (e) => {
      console.error('Error loading ship image:', e)
      shipImageRef.current = null // Set to null on error to use fallback
    }
    shipImage.src = '/ship.png' // Use the actual ship image
    shipImageRef.current = shipImage
    
    // Load the hungry image for spiders with error handling
    const hungryImage = new Image()
    // Add error and load event handlers before setting src
    hungryImage.onload = () => {
      console.log('Hungry image loaded successfully')
    }
    hungryImage.onerror = (e) => {
      console.error('Error loading hungry image:', e)
    }
    // Try paths that are likely to work with Next.js public assets
    // Check multiple possible locations for this file
    hungryImage.src = '/ICON.png' // Use ICON.png as requested
    hungryImageRef.current = hungryImage

    // Resize canvas
    canvas.width = GAME_WIDTH
    canvas.height = GAME_HEIGHT

    // Function to create shockwave effect when energize expires
    const createShockwave = () => {
      const state = gameStateRef.current
      const playerCenterX = state.player.position.x + state.player.size / 2
      const playerCenterY = state.player.position.y + state.player.size / 2
      const shockwaveRadius = 150 // Radius of effect
      
      // Damage all enemies within shockwave radius
      let enemiesHit = 0
      
      // Check centipede segments
      state.molochChains.forEach((chain) => {
        chain.segments.forEach((segment) => {
          if (segment.isAlive) {
            const segmentCenterX = segment.position.x + SEGMENT_SIZE / 2
            const segmentCenterY = segment.position.y + SEGMENT_SIZE / 2
            const distance = Math.sqrt(
              Math.pow(segmentCenterX - playerCenterX, 2) + 
              Math.pow(segmentCenterY - playerCenterY, 2)
            )
            
            if (distance <= shockwaveRadius) {
              // Instant kill - regardless of armor
              segment.isAlive = false
              if (soundManager) {
                soundManager.play('enemy-hit')
              }
              // Award points for shockwave kills
              state.score += segment.isHead ? 100 : 50
              enemiesHit++
            }
          }
        })
      })
      
      // Check spiders
      state.spiders.forEach((spider) => {
        if (spider.isAlive) {
          const distance = Math.sqrt(
            Math.pow(spider.position.x - playerCenterX, 2) + 
            Math.pow(spider.position.y - playerCenterY, 2)
          )
          
          if (distance <= shockwaveRadius) {
            spider.isAlive = false
            if (soundManager) {
              soundManager.play('enemy-hit')
            }
            state.score += 300
            state.spiderKillCount++
            enemiesHit++
          }
        }
      })
      
      // Play different sound based on hits
      if (enemiesHit > 0) {
        if (soundManager) {
          soundManager.play('block-destroy') // Use block-destroy for shockwave sound
        }
      }
      
      // Create visual shockwave effect by adding temporary effect to state
      state.shockwaveEffect = {
        x: playerCenterX,
        y: playerCenterY,
        radius: 0,
        maxRadius: shockwaveRadius,
        startTime: Date.now(),
        duration: 500 // 0.5 seconds
      }
    }

    const gameLoop = () => {
      const state = gameStateRef.current

      if (state.gameOver) {
        setGameOver(true)
        setGameStarted(false)
        // Stop background music and bullet loops
        if (soundManager) {
          soundManager.stopMusic()
          soundManager.stopAllBulletLoops()
        }
        return
      }

      // Create a beautiful animated gradient background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
      const timeOffset = Date.now() / 10000 // Slow subtle animation
      
      // Animate gradient colors
      bgGradient.addColorStop(0, BG_GRADIENT_COLORS[0])
      bgGradient.addColorStop(0.5 + Math.sin(timeOffset) * 0.2, BG_GRADIENT_COLORS[1])
      bgGradient.addColorStop(1, BG_GRADIENT_COLORS[2])
      
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      
      // Add subtle starfield
      const starCount = 50
      for (let i = 0; i < starCount; i++) {
        const x = Math.sin(i * 7.5 + timeOffset) * GAME_WIDTH/2 + GAME_WIDTH/2
        const y = Math.cos(i * 3.3 + timeOffset * 1.2) * GAME_HEIGHT/2 + GAME_HEIGHT/2
        const size = 0.5 + Math.sin(i + timeOffset * 2) * 0.5
        
        // Star twinkle effect
        const alpha = 0.5 + Math.sin(i * 0.5 + timeOffset * 3) * 0.5
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw game border with gradient
      ctx.lineWidth = BORDER_WIDTH
      
      // Create gradient for border
      const borderGradient = ctx.createLinearGradient(0, 0, GAME_WIDTH, GAME_HEIGHT)
      borderGradient.addColorStop(0, "#4D88FF") // Light blue
      borderGradient.addColorStop(0.5, "#0044CC") // Medium blue
      borderGradient.addColorStop(1, "#002266") // Dark blue
      
      ctx.strokeStyle = borderGradient
      
      // Draw top border
      ctx.beginPath()
      ctx.lineWidth = BORDER_WIDTH
      ctx.moveTo(0, BORDER_WIDTH/2)
      ctx.lineTo(GAME_WIDTH, BORDER_WIDTH/2)
      ctx.stroke()
      
      // Draw left border
      ctx.beginPath()
      ctx.lineWidth = BORDER_WIDTH
      ctx.moveTo(BORDER_WIDTH/2, 0)
      ctx.lineTo(BORDER_WIDTH/2, GAME_HEIGHT)
      ctx.stroke()
      
      // Draw right border
      ctx.beginPath()
      ctx.lineWidth = BORDER_WIDTH
      ctx.moveTo(GAME_WIDTH - BORDER_WIDTH/2, 0)
      ctx.lineTo(GAME_WIDTH - BORDER_WIDTH/2, GAME_HEIGHT)
      ctx.stroke()
      
      // Draw bottom border - thicker
      ctx.beginPath()
      ctx.lineWidth = BOTTOM_BORDER_WIDTH
      ctx.moveTo(0, GAME_HEIGHT - BOTTOM_BORDER_WIDTH/2)
      ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - BOTTOM_BORDER_WIDTH/2)
      ctx.stroke()
      
      // Draw text in the bottom border
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      // Draw instructions text
      ctx.fillText("Use arrow keys to move and spacebar to shoot", GAME_WIDTH/2, GAME_HEIGHT - BOTTOM_BORDER_WIDTH/2)
      
      // Draw score and level on the blue bar
      ctx.font = "bold 18px Arial"
      ctx.fillStyle = "white"
      ctx.textAlign = "left"
      ctx.fillText(`Score: ${state.score}`, 20, GAME_HEIGHT - BOTTOM_BORDER_WIDTH/2)
      
      ctx.textAlign = "right"
      ctx.fillText(`Level: ${state.level}`, GAME_WIDTH - 20, GAME_HEIGHT - BOTTOM_BORDER_WIDTH/2)

      // Safety check: reset keys if they've been held for too long (stuck key detection)
      if (!state.lastKeyResetTime) state.lastKeyResetTime = Date.now()
      if (Date.now() - state.lastKeyResetTime > 10000) { // Reset every 10 seconds as safety
        state.keys.left = false
        state.keys.right = false
        state.keys.up = false
        state.keys.down = false
        state.lastKeyResetTime = Date.now()
      }

      // Update player position
      if (state.keys.left) {
        state.player.position.x -= state.player.speed
      }
      if (state.keys.right) {
        state.player.position.x += state.player.speed
      }
      if (state.keys.up) {
        state.player.position.y -= state.player.speed
      }
      if (state.keys.down) {
        state.player.position.y += state.player.speed
      }

      // Keep player within bounds
      state.player.position.x = Math.max(
        BORDER_WIDTH,
        Math.min(canvas.width - BORDER_WIDTH - state.player.size, state.player.position.x),
      )
      state.player.position.y = Math.max(
        canvas.height / 2,
        Math.min(canvas.height - BOTTOM_BORDER_WIDTH - state.player.size, state.player.position.y),
      )

      // Check for energy expiration
      if (state.player.energized && Date.now() > state.player.energyTimer + state.player.energyDuration) {
        state.player.energized = false
        // Create shockwave effect when energize expires
        createShockwave()
        // Play energy deactivation sound
        if (soundManager) {
          soundManager.play('energy-deactivate')
        }
      }
      
      // Check for plasma expiration
      if (state.player.plasmaActive && Date.now() > state.player.plasmaTimer + state.player.plasmaDuration) {
        state.player.plasmaActive = false
      }

      // Update player energy state
      if (state.player.energized && Date.now() - state.player.energyTimer > state.player.energyDuration) {
        state.player.energized = false
        state.player.color = "#FF0000"
        // Create shockwave effect when energize expires
        createShockwave()
        // Play energy deactivation sound
        if (soundManager) {
          soundManager.play('energy-deactivate')
        }
      }

      // Shoot bullets - either with auto-shoot or manual shoot
      const currentTime = Date.now()
      if ((state.autoShootEnabled || state.keys.space) && currentTime - state.lastShootTime > SHOOT_COOLDOWN) {
        // Check if plasma mode is active for special bullets
        const isPlasma = state.player.plasmaActive
        const bulletSize = isPlasma ? 25 : BULLET_SIZE // Much larger plasma bullets
        const bulletSpeed = isPlasma ? BULLET_SPEED * 0.7 : BULLET_SPEED // Plasma bullets are slower
        
        if (state.player.energized) {
          // Energized mode: Three-way spread shot
          const spreadAngles = [-0.3, 0, 0.3] // Left, center, right angles in radians
          
          spreadAngles.forEach(angle => {
            const velocity = {
              x: Math.sin(angle) * bulletSpeed * 0.8, // Horizontal component
              y: -Math.cos(angle) * bulletSpeed // Vertical component (negative = up)
            }
            
            state.bullets.push({
              position: {
                x: state.player.position.x + state.player.size / 2 - bulletSize / 2,
                y: state.player.position.y - bulletSize
              },
              size: bulletSize,
              speed: bulletSpeed,
              active: true,
              isPlasma: isPlasma,
              velocity: velocity
            })
          })
        } else {
          // Normal mode: Single straight bullet
          state.bullets.push({
            position: {
              x: state.player.position.x + state.player.size / 2 - bulletSize / 2,
              y: state.player.position.y - bulletSize
            },
            size: bulletSize,
            speed: bulletSpeed,
            active: true,
            isPlasma: isPlasma,
            velocity: { x: 0, y: -bulletSpeed } // Straight up
          })
        }
        
        state.lastShootTime = currentTime
      }

      // Manage bullet loop sounds based on shooting state
      if (soundManager) {
        const isShooting = state.autoShootEnabled || state.keys.space
        const isPlasma = state.player.plasmaActive
        
        if (isShooting) {
          // Start the appropriate bullet loop
          soundManager.startBulletLoop(isPlasma)
          // Stop the other loop if switching bullet types
          if (isPlasma) {
            soundManager.stopBulletLoop(false) // Stop regular bullets
          } else {
            soundManager.stopBulletLoop(true)  // Stop plasma bullets
          }
        } else {
          // Stop all bullet loops when not shooting
          soundManager.stopAllBulletLoops()
        }
      }

      // Draw power-ups
      state.powerUps.forEach((powerUp) => {
        if (powerUp.active) {
          // Update pulse phase for visual effect
          powerUp.pulsePhase = (powerUp.pulsePhase + 0.1) % (Math.PI * 2)
          
          // Create pulsing glow effect
          const pulseSize = 1 + Math.sin(powerUp.pulsePhase) * 0.2
          
          // Draw pulsing blue glow
          ctx.fillStyle = "rgba(0, 170, 255, 0.3)"
          ctx.beginPath()
          ctx.arc(
            powerUp.position.x + powerUp.size / 2,
            powerUp.position.y + powerUp.size / 2,
            powerUp.size * pulseSize,
            0,
            Math.PI * 2
          )
          ctx.fill()
          
          // Draw plasma icon
          ctx.fillStyle = "#00AAFF"
          ctx.beginPath()
          ctx.arc(
            powerUp.position.x + powerUp.size / 2,
            powerUp.position.y + powerUp.size / 2,
            powerUp.size / 3,
            0,
            Math.PI * 2
          )
          ctx.fill()
          
          // Draw lightning bolt symbol
          ctx.strokeStyle = "white"
          ctx.lineWidth = 2
          ctx.beginPath()
          const centerX = powerUp.position.x + powerUp.size / 2
          const centerY = powerUp.position.y + powerUp.size / 2
          ctx.moveTo(centerX - 3, centerY - 6)
          ctx.lineTo(centerX + 3, centerY - 2)
          ctx.lineTo(centerX - 2, centerY + 1)
          ctx.lineTo(centerX + 4, centerY + 6)
          ctx.stroke()
        }
      })
      
      // Check player collision with mushrooms - player can destroy mushrooms by flying into them
      state.mushrooms.forEach((mushroom) => {
        if (
          state.player.position.x < mushroom.position.x + mushroom.size &&
          state.player.position.x + state.player.size > mushroom.position.x &&
          state.player.position.y < mushroom.position.y + mushroom.size &&
          state.player.position.y + state.player.size > mushroom.position.y
        ) {
          // Destroy sections that the player touches
          for (let i = 0; i < 16; i++) {
            if (mushroom.sections[i]) {
              const sectionX = mushroom.position.x + (i % 4) * SECTION_SIZE
              const sectionY = mushroom.position.y + Math.floor(i / 4) * SECTION_SIZE

              if (
                state.player.position.x < sectionX + SECTION_SIZE &&
                state.player.position.x + state.player.size > sectionX &&
                state.player.position.y < sectionY + SECTION_SIZE &&
                state.player.position.y + state.player.size > sectionY
              ) {
                mushroom.sections[i] = false
                mushroom.health--
                createMushroomParticles(mushroom.position, i, mushroom.colorSet)
                state.score += 1
                
                // Play block destroy sound at lower volume
                if (soundManager) {
                  soundManager.play('block-destroy', 0.3)
                }
              }
            }
          }

          // Remove from obstacle grid if completely destroyed
          if (mushroom.health <= 0) {
            const key = `${Math.floor(mushroom.position.x / GRID_SIZE)},${Math.floor(mushroom.position.y / GRID_SIZE)}`
            state.obstacleGrid.delete(key)
          }
        }
      })

      // Update bullets
      state.bullets.forEach((bullet) => {
        // Use velocity vector if available (for directional bullets), otherwise default movement
        if (bullet.velocity) {
          bullet.position.x += bullet.velocity.x
          bullet.position.y += bullet.velocity.y
        } else {
          bullet.position.y -= bullet.speed
        }

        // Remove bullets that go off screen (any direction)
        if (bullet.position.y < BORDER_WIDTH || 
            bullet.position.x < 0 || 
            bullet.position.x > GAME_WIDTH) {
          bullet.active = false
        }

        // Check collisions between player and power-ups
        state.powerUps.forEach((powerUp, index) => {
          if (!powerUp.active) return
          
          // Check for collision with player using a more generous circle-based detection
          // Calculate centers for player and power-up
          const playerCenterX = state.player.position.x + state.player.size / 2
          const playerCenterY = state.player.position.y + state.player.size / 2
          const powerUpCenterX = powerUp.position.x + powerUp.size / 2
          const powerUpCenterY = powerUp.position.y + powerUp.size / 2
          
          // Calculate distance between centers
          const dx = playerCenterX - powerUpCenterX
          const dy = playerCenterY - powerUpCenterY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Use a generous collision radius (60% of combined sizes)
          const collisionRadius = (state.player.size / 2 + powerUp.size / 2) * 1.6
          
          // Check if distance is less than collision radius
          if (distance < collisionRadius) {
            // Collect the power-up
            powerUp.active = false
            
            // Play power-up sound
            if (soundManager) {
              soundManager.play('power-up')
            }
            
            // Apply power-up effect based on type
            if (powerUp.type === 'plasma') {
              state.player.plasmaActive = true
              state.player.plasmaTimer = Date.now()
              
              // Remove the collected power-up
              state.powerUps.splice(index, 1)
              
              // Create particles for visual effect
              for (let i = 0; i < 15; i++) {
                state.particles.push({
                  position: { ...powerUp.position },
                  velocity: {
                    x: (Math.random() - 0.5) * 5,
                    y: (Math.random() - 0.5) * 5
                  },
                  size: 3,
                  color: '#00AAFF',
                  lifespan: 1000, // 1 second
                  createdAt: Date.now()
                })
              }
            }
          }
        })

        // Check collision with mushrooms - using larger hit radius
        state.mushrooms.forEach((mushroom) => {
          // Check each section with a larger hit radius
          for (let i = 0; i < 16; i++) {
            if (mushroom.sections[i]) {
              const sectionX = mushroom.position.x + (i % 4) * SECTION_SIZE
              const sectionY = mushroom.position.y + Math.floor(i / 4) * SECTION_SIZE

              // Create a circular hit area around the bullet
              const bulletCenterX = bullet.position.x + bullet.size / 2
              const bulletCenterY = bullet.position.y + bullet.size / 2
              const mushroomSectionCenterX = sectionX + SECTION_SIZE / 2
              const mushroomSectionCenterY = sectionY + SECTION_SIZE / 2

              // Use a larger hit radius for plasma bullets
              const hitRadius = bullet.isPlasma ? BULLET_RADIUS * 1.5 : BULLET_RADIUS
              const dx = bulletCenterX - mushroomSectionCenterX
              const dy = bulletCenterY - mushroomSectionCenterY
              const distance = Math.sqrt(dx * dx + dy * dy)

              // Use larger hit radius for better responsiveness
              if (bullet.active && distance < hitRadius) {
                bullet.active = false
                mushroom.sections[i] = false
                
                // Plasma bullets do more damage to blocks
                if (bullet.isPlasma) {
                  // Plasma bullets do 3x damage
                  mushroom.health -= 3
                } else {
                  mushroom.health--
                }

                // Create particles for the broken section
                createMushroomParticles(mushroom.position, i, mushroom.colorSet)

                // Try to hit an adjacent section too for better responsiveness
                // Check adjacent sections (right, left, below, above)
                const adjacentSections = []
                const row = Math.floor(i / 4)
                const col = i % 4

                if (col < 3) adjacentSections.push(row * 4 + col + 1) // right
                if (col > 0) adjacentSections.push(row * 4 + col - 1) // left
                if (row < 3) adjacentSections.push((row + 1) * 4 + col) // below
                if (row > 0) adjacentSections.push((row - 1) * 4 + col) // above

                // Randomly select one adjacent section to hit
                const randomAdjacentIndex = Math.floor(Math.random() * adjacentSections.length)
                const adjacentSectionIndex = adjacentSections[randomAdjacentIndex]

                if (adjacentSectionIndex !== undefined && mushroom.sections[adjacentSectionIndex]) {
                  mushroom.sections[adjacentSectionIndex] = false
                  mushroom.health--
                  
                  // Play block destroy sound at lower volume
                  if (soundManager) {
                    soundManager.play('block-destroy', 0.3)
                  }
                  createMushroomParticles(mushroom.position, adjacentSectionIndex, mushroom.colorSet)
                }

                if (mushroom.health <= 0) {
                  // Remove from obstacle grid
                  const key = `${Math.floor(mushroom.position.x / GRID_SIZE)},${Math.floor(mushroom.position.y / GRID_SIZE)}`
                  state.obstacleGrid.delete(key)
                  state.score += 10
                }

                // Break out of the loop once we've hit a section
                break
              }
            }
          }
        })

        // Check collision with Moloch centipede segments (using circular collision)
        state.molochChains.forEach((chain, chainIndex) => {
          chain.segments.forEach((segment, segmentIndex) => {
            if (bullet.active && segment.isAlive) {
              // Use circular collision detection for better accuracy with round segments
              const distX = segment.position.x + SEGMENT_SIZE / 2 - (bullet.position.x + bullet.size / 2)
              const distY = segment.position.y + SEGMENT_SIZE / 2 - (bullet.position.y + bullet.size / 2)
              const distance = Math.sqrt(distX * distX + distY * distY)

              const hitRadius = bullet.isPlasma ? BULLET_RADIUS * 1.5 : BULLET_RADIUS
              if (distance < hitRadius + SEGMENT_SIZE / 2) {
                bullet.active = false

                // Special handling for head segments
                if (segment.isHead) {
                  // Create new mushroom where head was hit
                  const colorSet = EGG_COLORS[Math.floor(Math.random() * EGG_COLORS.length)]
                  const mushroom = {
                    position: { ...segment.position },
                    size: MUSHROOM_SIZE,
                    health: 16,
                    colorSet,
                    sections: Array(16).fill(true),
                  }
                  state.mushrooms.push(mushroom)

                  // Add to obstacle grid
                  const key = `${Math.floor(segment.position.x / GRID_SIZE)},${Math.floor(segment.position.y / GRID_SIZE)}`
                  state.obstacleGrid.add(key)

                  // Use takeDamage instead of direct destruction to respect armor
                  // Plasma bullets do 3x damage
                  const damage = bullet.isPlasma ? 3 : 1
                  const damageResult = segment.takeDamage(damage)

                  // Play appropriate sound effect
                  if (soundManager) {
                    if (damageResult.hitArmor) {
                      soundManager.play('armor-hit', 1.2) // Slightly louder for armor
                    } else {
                      soundManager.play('enemy-hit')
                    }
                  }

                  // If segment had armor, create armor breaking particles
                  if (damageResult.hitArmor) {
                    // Create armor hit particles
                    for (let i = 0; i < 5; i++) {
                      state.particles.push({
                        position: {
                          x: bullet.position.x,
                          y: bullet.position.y,
                        },
                        velocity: {
                          x: (Math.random() - 0.5) * 3,
                          y: (Math.random() - 0.5) * 3,
                        },
                        size: PARTICLE_SIZE,
                        color: "#FFD700", // Gold particles for armor hit
                        lifespan: 500,
                        createdAt: Date.now(),
                      })
                    }
                  }
                  
                  // If there are segments after the head, create a new chain
                  if (segmentIndex < chain.segments.length - 1) {
                    // Create a new chain from the remaining segments
                    const newChain = chain.createNewChainFromSegments(segmentIndex + 1)
                    if (newChain) {
                      state.molochChains.push(newChain)
                    }
                  }

                  // Remove the dead head from the original chain
                  chain.segments = chain.segments.filter((s) => s.isAlive)

                  // Increase score
                  state.score += 150
                  state.player.killCount += 2
                }
                // Regular body segment handling
                else {
                  // Plasma bullets do 3x damage
                  const damage = bullet.isPlasma ? 3 : 1
                  const damageResult = segment.takeDamage(damage)

                  // Play appropriate sound effect
                  if (soundManager) {
                    if (damageResult.hitArmor) {
                      soundManager.play('armor-hit', 1.2) // Slightly louder for armor
                    } else {
                      soundManager.play('enemy-hit')
                    }
                  }

                  // Visual feedback for hitting armored segment
                  if (damageResult.hitArmor && !damageResult.destroyed) {
                    for (let i = 0; i < 5; i++) {
                      state.particles.push({
                        position: {
                          x: bullet.position.x,
                          y: bullet.position.y,
                        },
                        velocity: {
                          x: (Math.random() - 0.5) * 3,
                          y: (Math.random() - 0.5) * 3,
                        },
                        size: PARTICLE_SIZE,
                        color: "#FFD700", // Gold particles for armor hit
                        lifespan: 500,
                        createdAt: Date.now(),
                      })
                    }

                    // Give some points for hitting armor
                    state.score += 25
                  }

                  if (damageResult.destroyed) {
                    // Create new mushroom where segment was hit
                    const colorSet = EGG_COLORS[Math.floor(Math.random() * EGG_COLORS.length)]
                    const mushroom = {
                      position: { ...segment.position },
                      size: MUSHROOM_SIZE,
                      health: 16,
                      colorSet,
                      sections: Array(16).fill(true),
                    }
                    state.mushrooms.push(mushroom)

                    // Add to obstacle grid
                    const key = `${Math.floor(segment.position.x / GRID_SIZE)},${Math.floor(segment.position.y / GRID_SIZE)}`
                    state.obstacleGrid.add(key)

                    // Split the chain if it's not the head or tail
                    if (segmentIndex > 0 && segmentIndex < chain.segments.length - 1) {
                      const newChains = chain.splitAt(segmentIndex)

                      // Replace the current chain with the split chains
                      state.molochChains.splice(chainIndex, 1, ...newChains)
                    }

                    // Increase score and player kill count
                    state.score += 100
                    state.player.killCount++
                  }
                }

                // Check if player should be energized
                if (state.player.killCount >= state.player.energyThreshold) {
                  state.player.energized = true
                  state.player.energyTimer = Date.now()
                  state.player.killCount = 0
                  state.player.color = "#FF9900" // Orange when energized
                  
                  // Play energy activation sound
                  if (soundManager) {
                    soundManager.play('energy-activate')
                  }
                }
              }
            }
          })
        })

        // Check collision with spiders
        state.spiders.forEach((spider) => {
          if (
            bullet.active &&
            spider.isAlive &&
            bullet.position.x < spider.position.x + spider.size &&
            bullet.position.x + bullet.size > spider.position.x &&
            bullet.position.y < spider.position.y + spider.size &&
            bullet.position.y + bullet.size > spider.position.y
          ) {
            bullet.active = false
            spider.isAlive = false
            state.score += 300
            state.player.killCount += 2 // Spiders count more toward energizing
            state.spiderKillCount += 1 // Track spider kills for power-up spawning
            
            // Play enemy hit sound for spider
            if (soundManager) {
              soundManager.play('enemy-hit')
            }
          }
        })
      })

      // Remove inactive bullets
      state.bullets = state.bullets.filter((bullet) => bullet.active)

      // Remove destroyed mushrooms
      state.mushrooms = state.mushrooms.filter((mushroom) => mushroom.health > 0)

      // Update particles
      const particleNow = Date.now()
      state.particles.forEach((particle) => {
        const particleAge = particleNow - particle.createdAt
        const ageRatio = particleAge / particle.lifespan
        
        // Skip rendering particles that are almost invisible
        if (ageRatio > 0.9) return;
        
        // Particles fade out as they age
        const alpha = 1 - ageRatio
        
        // Draw circular particles without expensive glow effect
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        
        ctx.beginPath()
        ctx.arc(
          particle.position.x + particle.size / 2,
          particle.position.y + particle.size / 2,
          Math.max(0.1, particle.size * (1 - ageRatio * 0.5)),
          0,
          Math.PI * 2
        )
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // Draw Moloch centipede body segments first
      state.molochChains.forEach((chain) => {
        chain.segments.forEach((segment) => {
          if (segment.isAlive && !segment.isHead) {
            // Draw round body segment
            ctx.fillStyle = segment.color
            ctx.beginPath()
            ctx.arc(
              segment.position.x + SEGMENT_SIZE / 2,
              segment.position.y + SEGMENT_SIZE / 2,
              SEGMENT_SIZE / 2,
              0,
              Math.PI * 2,
            )
            ctx.fill()

            // Draw armor indicator if armored
            if (segment.isArmored) {
              // Metallic shine effect
              const gradient = ctx.createRadialGradient(
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
                0,
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
                SEGMENT_SIZE / 2,
              )
              gradient.addColorStop(0, "#FFFFFF")
              gradient.addColorStop(0.3, segment.color)
              gradient.addColorStop(1, "#444444")

              ctx.fillStyle = gradient
              ctx.beginPath()
              ctx.arc(
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
                SEGMENT_SIZE / 2,
                0,
                Math.PI * 2,
              )
              ctx.fill()

              // Armor border
              ctx.strokeStyle = "#FFD700" // Gold color for armor
              ctx.lineWidth = 2
              ctx.beginPath()
              ctx.arc(
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
                SEGMENT_SIZE / 2 + 2,
                0,
                Math.PI * 2,
              )
              ctx.stroke()

              // Draw armor level indicator
              ctx.fillStyle = "#FFFFFF"
              ctx.font = "8px Arial"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText(
                segment.armorLevel.toString(),
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
              )
            }
          }
        })
      })

      // Draw Moloch centipede heads on top of everything
      state.molochChains.forEach((chain) => {
        chain.segments.forEach((segment) => {
          if (segment.isAlive && segment.isHead) {
            // Draw shield around head if armored
            if (segment.isArmored) {
              // Create a blue translucent color for armored head
              ctx.fillStyle = "rgba(0, 100, 255, 0.5)" // Blue translucent for head
              
              const glowRadius = SEGMENT_SIZE / 2 + 8
              const gradient = ctx.createRadialGradient(
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
                0,
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
                glowRadius
              )
              gradient.addColorStop(0, "rgba(0, 68, 255, 0.7)")
              gradient.addColorStop(0.5, "rgba(0, 72, 255, 0.4)")
              gradient.addColorStop(1, "rgba(255, 215, 0, 0)")

              ctx.fillStyle = gradient
              ctx.beginPath()
              ctx.arc(
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
                glowRadius,
                0,
                Math.PI * 2,
              )
              ctx.fill()

              // Shield border
              ctx.strokeStyle = "#FFD700" // Gold
              ctx.lineWidth = 3
              ctx.beginPath()
              ctx.arc(
                segment.position.x + SEGMENT_SIZE / 2,
                segment.position.y + SEGMENT_SIZE / 2,
                SEGMENT_SIZE / 2 + 4,
                0,
                Math.PI * 2,
              )
              ctx.stroke()
            }

            // Draw emoji head directly (no block background) with larger size
            const emojiFactor = 1.4; // Make emoji 40% larger than the segment
            ctx.font = `${Math.floor(SEGMENT_SIZE * emojiFactor)}px Arial`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillText(segment.emoji, segment.position.x + SEGMENT_SIZE / 2, segment.position.y + SEGMENT_SIZE / 2)
          }
        })
      })

      // Draw spiders
      state.spiders.forEach((spider) => {
        ctx.fillStyle = spider.color

        // Draw spider body (red square)
        ctx.fillRect(spider.position.x, spider.position.y, spider.size, spider.size)
        
        // Draw hungry image on top of the red square if loaded
        if (hungryImageRef.current && hungryImageRef.current.complete && hungryImageRef.current.naturalWidth > 0) {
          try {
            // Make the hungry image 1.5x larger than the spider and center it
            const enlargeFactor = 1.5;
            const enlargedSize = spider.size * enlargeFactor;
            const offsetX = (enlargedSize - spider.size) / 2;
            const offsetY = (enlargedSize - spider.size) / 2;
            
            ctx.drawImage(
              hungryImageRef.current,
              spider.position.x - offsetX, 
              spider.position.y - offsetY,
              enlargedSize,
              enlargedSize
            )
          } catch (error) {
            // If drawing fails, just skip it - the red square will still be visible
            console.error('Error drawing hungry image:', error)
          }
        }

        // Draw spider legs
        ctx.strokeStyle = spider.color
        ctx.lineWidth = 2

        // Top legs
        ctx.beginPath()
        ctx.moveTo(spider.position.x, spider.position.y)
        ctx.lineTo(spider.position.x - 10, spider.position.y - 8)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(spider.position.x + spider.size, spider.position.y)
        ctx.lineTo(spider.position.x + spider.size + 10, spider.position.y - 8)
        ctx.stroke()

        // Bottom legs
        ctx.beginPath()
        ctx.moveTo(spider.position.x, spider.position.y + spider.size)
        ctx.lineTo(spider.position.x - 10, spider.position.y + spider.size + 8)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(spider.position.x + spider.size, spider.position.y + spider.size)
        ctx.lineTo(spider.position.x + spider.size + 10, spider.position.y + spider.size + 8)
        ctx.stroke()

        // Draw chewing animation if applicable
        if (spider.isChewing && spider.targetBlock && spider.targetSections.length > 0) {
          // Visual indicator for chewing
          const progress = spider.chewingTime / spider.chewingDuration
          const chewSize = 4 + Math.sin(progress * Math.PI * 10) * 2

          ctx.fillStyle = "#FFFF00" // Yellow for chewing indicator

          // Draw indicators for all sections being chewed
          for (const sectionIndex of spider.targetSections) {
            // Calculate section position
            const sectionX = spider.targetBlock.x + (sectionIndex % 4) * SECTION_SIZE
            const sectionY = spider.targetBlock.y + Math.floor(sectionIndex / 4) * SECTION_SIZE

            ctx.fillRect(
              sectionX + SECTION_SIZE / 2 - chewSize / 2,
              sectionY + SECTION_SIZE / 2 - chewSize / 2,
              chewSize,
              chewSize,
            )
          }
        }
      })

      // Draw player with glow effect
      // Enhanced glow effects when energized
      ctx.save()
      
      if (state.player.energized) {
        // Multiple glow layers for energized mode
        const pulseIntensity = Math.sin(Date.now() * 0.01) * 0.3 + 0.7 // Pulsing between 0.4 and 1.0
        
        // Outer red glow
        ctx.shadowBlur = PLAYER_GLOW_RADIUS * 2 * pulseIntensity
        ctx.shadowColor = "#FF0000"
        ctx.fillStyle = "#FF3333"
        
        // Create energized particle trail effect
        for (let i = 0; i < 3; i++) {
          const trailX = state.player.position.x + state.player.size / 2 + (Math.random() - 0.5) * state.player.size
          const trailY = state.player.position.y + state.player.size + Math.random() * 20
          state.particles.push({
            position: { x: trailX, y: trailY },
            velocity: { x: (Math.random() - 0.5) * 2, y: Math.random() * 3 + 1 },
            size: Math.random() * 3 + 1,
            color: ["#FF6600", "#FF3300", "#FFAA00"][Math.floor(Math.random() * 3)],
            lifespan: 300,
            createdAt: Date.now()
          })
        }
      } else {
        // Normal glow
        ctx.shadowBlur = PLAYER_GLOW_RADIUS
        ctx.shadowColor = GLOW_COLOR
      }
      
      // Main player shape
      ctx.fillStyle = state.player.energized ? "#FF3333" : state.player.color
      
      // Draw player as AquaPrime logo
      const playerCenterX = state.player.position.x + state.player.size / 2
      const playerCenterY = state.player.position.y + state.player.size / 2
      
      // If image is loaded and not broken, draw it; otherwise fallback to a shape
      if (shipImageRef.current && shipImageRef.current.complete && !shipImageRef.current.src.includes('data:') && shipImageRef.current.naturalWidth > 0) {
        // Enhanced size when energized with pulsing effect
        let size = state.player.size * 1.5 // Base size increase
        if (state.player.energized) {
          const pulse = Math.sin(Date.now() * 0.02) * 0.2 + 1.0 // Pulsing between 0.8 and 1.2
          size *= pulse
        }
        ctx.drawImage(
          shipImageRef.current,
          state.player.position.x - size/4,
          state.player.position.y - size/4,
          size,
          size
        )
      } else {
        // Fallback shape if image not loaded
        ctx.beginPath()
        ctx.moveTo(playerCenterX, state.player.position.y) // top center
        ctx.lineTo(state.player.position.x + state.player.size, state.player.position.y + state.player.size) // bottom right
        ctx.lineTo(playerCenterX, state.player.position.y + state.player.size * 0.85) // bottom middle
        ctx.lineTo(state.player.position.x, state.player.position.y + state.player.size) // bottom left
        ctx.closePath()
        ctx.fill()
      }
      
      // Draw engine flames when moving
      if (state.keys.left || state.keys.right || state.keys.up || state.keys.down) {
        ctx.beginPath()
        const flameHeight = 5 + Math.random() * 5 // Animated flames
        ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, 0.8)`
        ctx.moveTo(playerCenterX - 5, state.player.position.y + state.player.size * 0.85)
        ctx.lineTo(playerCenterX, state.player.position.y + state.player.size * 0.85 + flameHeight)
        ctx.lineTo(playerCenterX + 5, state.player.position.y + state.player.size * 0.85)
        ctx.closePath()
        ctx.fill()
      }
      
      ctx.restore()

      // Draw bullets
      state.bullets.forEach((bullet) => {
        if (bullet.isPlasma) {
          // Draw special blue plasma bullets with larger glow
          ctx.fillStyle = "#00AAFF"
          ctx.shadowBlur = 15
          ctx.shadowColor = "#00AAFF"
          
          // Draw additional outer glow for plasma bullets
          ctx.beginPath()
          ctx.arc(
            bullet.position.x + bullet.size / 2,
            bullet.position.y + bullet.size / 2,
            bullet.size * 0.8,
            0,
            Math.PI * 2
          )
          ctx.fillStyle = "rgba(0, 170, 255, 0.6)"
          ctx.fill()
        } else {
          // Draw normal bullets
          ctx.fillStyle = "#FFFFFF"
          ctx.shadowBlur = 0
        }
        ctx.fillRect(bullet.position.x, bullet.position.y, bullet.size, bullet.size)
      })
      
      // Reset shadow for other elements
      ctx.shadowBlur = 0

      // Draw shockwave effect if active
      if (state.shockwaveEffect) {
        const currentTime = Date.now()
        const elapsed = currentTime - state.shockwaveEffect.startTime
        const progress = Math.min(elapsed / state.shockwaveEffect.duration, 1)
        
        if (progress < 1) {
          // Calculate current radius based on progress
          const currentRadius = state.shockwaveEffect.maxRadius * progress
          
          // Create expanding ring effect with fade
          const alpha = 1 - progress // Fade out as it expands
          
          // Draw outer ring
          ctx.save()
          ctx.strokeStyle = `rgba(255, 255, 0, ${alpha * 0.8})` // Bright yellow
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(state.shockwaveEffect.x, state.shockwaveEffect.y, currentRadius, 0, Math.PI * 2)
          ctx.stroke()
          
          // Draw inner ring
          ctx.strokeStyle = `rgba(255, 165, 0, ${alpha * 0.6})` // Orange
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(state.shockwaveEffect.x, state.shockwaveEffect.y, currentRadius * 0.8, 0, Math.PI * 2)
          ctx.stroke()
          
          // Draw energy particles within the shockwave
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2
            const particleRadius = currentRadius * 0.9
            const x = state.shockwaveEffect.x + Math.cos(angle) * particleRadius
            const y = state.shockwaveEffect.y + Math.sin(angle) * particleRadius
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, Math.PI * 2)
            ctx.fill()
          }
          
          ctx.restore()
        } else {
          // Effect is complete, remove it
          state.shockwaveEffect = null
        }
      }

      // Draw game info with modern styling
      ctx.save()
      
      // Don't draw UI elements on canvas - we'll use DOM elements instead
      ctx.restore()

      // Draw mushrooms (as pixelated eggs)
      state.mushrooms.forEach((mushroom) => {
        // Draw each section as a rounded block - collectively creating an egg shape
        // We'll arrange the sections in a pattern that resembles an egg
        for (let i = 0; i < 16; i++) {
          if (mushroom.sections[i]) {
            const row = Math.floor(i / 4)
            const col = i % 4
            
            // Calculate position with slight offsets to create egg shape
            // Middle rows are wider than top/bottom rows
            let offsetX = 0
            if (row === 1) offsetX = -SECTION_SIZE * 0.1 // Second row slightly wider
            if (row === 2) offsetX = -SECTION_SIZE * 0.1 // Third row slightly wider
            
            const sectionX = mushroom.position.x + col * SECTION_SIZE + offsetX
            const sectionY = mushroom.position.y + row * SECTION_SIZE
            
            // Calculate center of each section
            const sectionCenterX = sectionX + SECTION_SIZE / 2
            const sectionCenterY = sectionY + SECTION_SIZE / 2

            // Use a color from the mushroom's color set
            const colorIndex = (i % 2) + (Math.floor(i / 4) % 2) * 2
            ctx.fillStyle = mushroom.colorSet[colorIndex % mushroom.colorSet.length]
            
            // Draw rounded section - these build up to form the egg shape
            ctx.beginPath()
            
            // Vary the size slightly based on position to create oval egg shape
            let sizeMultiplier = 1.0
            // Top and bottom sections slightly smaller
            if (row === 0) sizeMultiplier = 0.9
            if (row === 3) sizeMultiplier = 0.9
            // Edge pieces slightly smaller
            if (col === 0 || col === 3) sizeMultiplier *= 0.95
            // Center pieces slightly larger
            if (col === 1 || col === 2) sizeMultiplier *= 1.05
            
            ctx.arc(
              sectionCenterX,
              sectionCenterY,
              (SECTION_SIZE / 2) * sizeMultiplier,
              0,
              Math.PI * 2
            )
            ctx.fill()
            
            // Draw highlight on some blocks for 3D effect
            if ((col === 1 || col === 2) && row === 1) {
              ctx.fillStyle = "rgba(255, 255, 255, 0.3)"
              ctx.beginPath()
              ctx.arc(
                sectionCenterX - SECTION_SIZE / 4,
                sectionCenterY - SECTION_SIZE / 4,
                SECTION_SIZE / 5,
                0,
                Math.PI * 2
              )
              ctx.fill()
            }
          }
        }
      })

      // Update Moloch centipede chains
      state.molochChains.forEach((chain) => {
        chain.update(GAME_WIDTH, GAME_HEIGHT, state.obstacleGrid)

        // Check if any segment reaches bottom or collides with player
        // Filter to only alive segments to prevent ghost collisions
        const aliveSegments = chain.segments.filter(segment => segment.isAlive)
        
        aliveSegments.forEach((segment) => {
          // Double-check segment is still alive (defensive programming)
          if (!segment.isAlive) return

          // Check collision with player (using circular collision)
          const playerCenterX = state.player.position.x + state.player.size / 2
          const playerCenterY = state.player.position.y + state.player.size / 2
          const segmentCenterX = segment.position.x + SEGMENT_SIZE / 2
          const segmentCenterY = segment.position.y + SEGMENT_SIZE / 2
          const dx = playerCenterX - segmentCenterX
          const dy = playerCenterY - segmentCenterY
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < state.player.size / 2 + SEGMENT_SIZE / 2) {
            if (!state.player.energized) {
              state.gameOver = true
              // Play death sound
              if (soundManager) {
                soundManager.play('player-death')
              }
            } else {
              // When energized, destroy the segment instead
              segment.isAlive = false
              state.score += 200
            }
          }
        })
      })
      
      // Remove empty chains and segments that are not alive
      state.molochChains = state.molochChains
        .map((chain) => {
          chain.segments = chain.segments.filter((segment) => segment.isAlive)
          return chain
        })
        .filter((chain) => chain.segments.length > 0)

      // Spawn spiders occasionally
      const now2 = Date.now()
      if (now2 - state.lastSpiderSpawnTime > Math.max(2000, 5000 - (state.level - 1) * 300)) {
        // Maximum spiders scales with level (1-5 spiders)
        const maxSpiders = Math.min(5, 1 + Math.floor(state.level / 2))
        
        // Only spawn if fewer than max spiders for current level
        if (state.spiders.filter(s => s.isAlive).length < maxSpiders) {
          const spiderX = Math.random() * (GAME_WIDTH - SPIDER_SIZE * 2) + SPIDER_SIZE
          const spiderY = BORDER_WIDTH
          
          // Create spider with level-appropriate speed
          const spider = new Spider(
            { x: spiderX, y: spiderY },
            1.5, // Base multiplier - actual speed calculated in constructor based on level
            SPIDER_SIZE
          )
          state.spiders.push(spider)
        }
        state.lastSpiderSpawnTime = now2
      }

      // Spawn power-ups every 5 spider kills
      if (state.spiderKillCount > 0 && state.spiderKillCount % 5 === 0) {
        // Check if we haven't already spawned a power-up for this kill count milestone
        const lastSpawnedAtKillCount = Math.floor(state.lastPowerUpSpawnTime)
        if (lastSpawnedAtKillCount !== state.spiderKillCount) {
          // Create a new plasma power-up at a random position
          // Spawn power-up in the bottom half of the map (player's area)
          // Ensure power-up stays within bounds by accounting for its size
          const powerUpSize = 40
          const safeMargin = 10 // Extra margin to ensure visibility
          const powerUpX = BORDER_WIDTH + safeMargin + Math.random() * (GAME_WIDTH - BORDER_WIDTH * 2 - powerUpSize - safeMargin * 2)
          const powerUpY = GAME_HEIGHT / 2 + safeMargin + Math.random() * (GAME_HEIGHT / 2 - BOTTOM_BORDER_WIDTH - powerUpSize - safeMargin * 2)
          
          state.powerUps.push({
            position: { x: powerUpX, y: powerUpY },
            size: 40,
            type: 'plasma',
            active: true,
            timeCreated: Date.now(),
            pulsePhase: 0
          })
          
          // Use lastPowerUpSpawnTime to track the spider kill count for which we last spawned a power-up
          state.lastPowerUpSpawnTime = state.spiderKillCount
        }
      }

      // Update spiders
      state.spiders.forEach((spider) => {
        if (spider.isAlive) {
          spider.update({ x: GAME_WIDTH, y: GAME_HEIGHT }, state.obstacleGrid, state.mushrooms, state.player.position)

          // Check collision with player
          if (
            spider.position.x < state.player.position.x + state.player.size &&
            spider.position.x + spider.size > state.player.position.x &&
            spider.position.y < state.player.position.y + state.player.size &&
            spider.position.y + spider.size > state.player.position.y
          ) {
            if (!state.player.energized) {
              state.gameOver = true
              // Play death sound
              if (soundManager) {
                soundManager.play('player-death')
              }
            } else {
              // When energized, destroy the spider instead
              spider.isAlive = false
              state.score += 300
              state.spiderKillCount += 1 // Track spider kills for power-up spawning
            }
          }
        }
      })

      // Remove dead spiders
      state.spiders = state.spiders.filter((spider) => spider.isAlive)

      // Check if we need to spawn replacement centipedes after one is destroyed
      const targetCentipedes = 2 // Always aim for 2 active centipedes
      const activeCentipedes = state.molochChains.length
      
      if (activeCentipedes < targetCentipedes && state.centipedesSpawned < state.maxCentipedesPerLevel) {
        // Spawn replacement centipede
        console.log(`🐛 Spawning replacement centipede (${activeCentipedes}/${targetCentipedes} active, ${state.centipedesSpawned}/${state.maxCentipedesPerLevel} total spawned)`)
        spawnCentipede()
      }
      
      // Check if maximum centipedes for this level have been killed
      if (state.molochChains.length === 0 && state.centipedesSpawned >= state.maxCentipedesPerLevel) {
        // Level complete - advance to next level
        state.level++
        setLevel(state.level)
        CURRENT_GAME_LEVEL = state.level
        
        // Reset centipede tracking for new level
        state.centipedesSpawned = 0
        state.roundTripTriggers = 0
        
        console.log(`🏆 Level ${state.level - 1} complete! Advancing to Level ${state.level}`)
        
        // Stop all audio so level intro quote can be heard clearly
        if (soundManager) {
          soundManager.stopMusic()
          soundManager.stopAllBulletLoops()
        }
        
        startLevelIntro()
      }

      // Update score state
      if (state.score !== score) {
        setScore(state.score)
      }

      animationFrameId = requestAnimationFrame(gameLoop)
    }

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [gameStarted, score, level, levelIntro])

  // Function to handle window resizing and responsive canvas
  const handleResize = () => {
    const canvas = canvasRef.current
    const container = gameContainerRef.current
    if (!canvas || !container) return
    
    // Get the container width (responsive to screen size)
    const containerWidth = container.clientWidth
    
    // Set a maximum width to prevent the game from getting too large
    const maxWidth = Math.min(containerWidth, BASE_GAME_WIDTH)
    
    // Calculate the height proportionally
    const aspectRatio = BASE_GAME_HEIGHT / BASE_GAME_WIDTH
    const height = maxWidth * aspectRatio
    
    // Important: Set the logical canvas dimensions to match base dimensions
    // This ensures game logic uses consistent coordinates
    canvas.width = BASE_GAME_WIDTH
    canvas.height = BASE_GAME_HEIGHT
    
    // Set display size via CSS for responsive scaling
    canvas.style.width = `${maxWidth}px`
    canvas.style.height = `${height}px`
    
    // Update game dimensions (keeping logic consistent)
    GAME_WIDTH = BASE_GAME_WIDTH
    GAME_HEIGHT = BASE_GAME_HEIGHT
    SCALE_FACTOR = maxWidth / BASE_GAME_WIDTH
    
    // Detect if we're on a mobile device
    const mobileDetected = window.innerWidth < 768
    setIsMobile(mobileDetected)
    setShowControls(mobileDetected)
  }

  useEffect(() => {
    // Set up resize handler
    window.addEventListener('resize', handleResize)
    
    // Initial resize
    setTimeout(handleResize, 100)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleStartGame = async () => {
    // Enable audio on user interaction
    if (soundManager) {
      await soundManager.enableAudio()
    }
    
    // Immediately reset score in both state and ref
    setScore(0)
    setLevel(1)
    gameStateRef.current.score = 0
    gameStateRef.current.level = 1
    CURRENT_GAME_LEVEL = 1 // Ensure global level is reset
    
    // Force React to flush the state update immediately
    const forceUpdate = () => {
      setScore(0)
    }
    forceUpdate()
    
    console.log(`🎮 Starting game at Level 1 with score: 0`)
    
    // Start Level 1 with the same intro as other levels
    startLevelIntro()
  }

  const startLevelIntro = async () => {
    setLevelIntro(true)
    setLevelIntroCountdown(7) // Give more time for intro sound
    
    // Play intro sound (music already stopped at level completion)
    if (soundManager) {
      soundManager.playRandomIntro()
      // Wait 2 seconds to let intro sound play before starting countdown
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      setLevelIntroCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setLevelIntro(false)
          // Start the new level
          initGame()
          // Start level music immediately after game init
          if (soundManager) {
            setTimeout(() => {
              soundManager?.startLevelMusic(gameStateRef.current.level)
            }, 100)
          }
          return 7
        }
        return prev - 1
      })
    }, 1000)
  }
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      gameContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch((err: Error) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      // Exit fullscreen
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch((err: Error) => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`)
      })
    }
  }
  
  // Monitor for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Game state values for UI rendering
  const isEnergized = gameStateRef.current?.player?.energized || false
  // Calculate energy and plasma values for display
  const [energyPercentage, setEnergyPercentage] = useState(0)
  const [energySeconds, setEnergySeconds] = useState(0)
  const [plasmaPercent, setPlasmaPercent] = useState(0)
  const [plasmaSeconds, setPlasmaSeconds] = useState(0)
  
  // Update energy and plasma values every frame
  useEffect(() => {
    if (!gameStarted) return
    
    const updateInterval = setInterval(() => {
      if (!gameStateRef.current) return
      
      // Energy percentage and time
      const newEnergyPercentage = gameStateRef.current.player.energized 
        ? 100 
        : Math.min(100, (gameStateRef.current.player.killCount / gameStateRef.current.player.energyThreshold) * 100)
      
      const newEnergySeconds = gameStateRef.current.player.energized 
        ? Math.ceil((gameStateRef.current.player.energyTimer + gameStateRef.current.player.energyDuration - Date.now()) / 1000) 
        : 0
      
      // Plasma percentage and time
      const newPlasmaPercent = gameStateRef.current.player.plasmaActive 
        ? (gameStateRef.current.player.plasmaDuration - (Date.now() - gameStateRef.current.player.plasmaTimer)) / gameStateRef.current.player.plasmaDuration * 100 
        : 0
      
      const newPlasmaSeconds = gameStateRef.current.player.plasmaActive 
        ? Math.ceil((gameStateRef.current.player.plasmaTimer + gameStateRef.current.player.plasmaDuration - Date.now()) / 1000) 
        : 0
      
      setEnergyPercentage(newEnergyPercentage)
      setEnergySeconds(newEnergySeconds)
      setPlasmaPercent(newPlasmaPercent)
      setPlasmaSeconds(newPlasmaSeconds)
    }, 100) // Update 10 times per second
    
    return () => clearInterval(updateInterval)
  }, [gameStarted])
  
  // Don't auto-start game since it's embedded in 404 page
  // User needs to manually start the game

  return (
    <div className="fixed inset-0 flex flex-col items-center bg-black overflow-hidden" ref={gameContainerRef} style={{justifyContent: isMobile ? 'flex-start' : 'center', paddingTop: isMobile ? '0.5rem' : '0'}}>
      {/* Score and Level Display */}
      {gameStarted && !gameOver && (
        <>
          {/* Energy Meter - More Visible */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-black bg-opacity-70 rounded-lg p-3 border border-cyan-400">
              <div className="text-center text-cyan-300 text-xs font-bold mb-1">
                {isEnergized ? 'ENERGIZED!' : 'ENERGY'}
              </div>
              
              {/* Energy Bar Background */}
              <div className="w-32 h-3 bg-gray-800 rounded-full border border-gray-600 overflow-hidden">
                {/* Energy Fill */}
                <div 
                  className={`h-full transition-all duration-300 ${
                    isEnergized 
                      ? 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse' 
                      : energyPercentage >= 100 
                        ? 'bg-yellow-400 animate-pulse' 
                        : 'bg-gradient-to-r from-green-500 to-cyan-400'
                  }`}
                  style={{ width: `${energyPercentage}%` }}
                />
                
                {/* Energized Overlay Effect */}
                {isEnergized && (
                  <div className="absolute inset-0 bg-white bg-opacity-20 animate-ping rounded-full" />
                )}
              </div>
              
              {/* Status Text */}
              <div className="text-center text-xs mt-1">
                {isEnergized 
                  ? <span className="text-yellow-400 font-bold animate-pulse">{energySeconds}s</span>
                  : <span className="text-cyan-300">{Math.floor(energyPercentage)}%</span>
                }
              </div>
            </div>
            
            {/* Energized Glow Effect */}
            {isEnergized && (
              <div className="absolute inset-0 bg-yellow-400 bg-opacity-30 rounded-lg animate-pulse -z-10 blur-sm" />
            )}
          </div>
          
          {/* Mute Controls - Top Right */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
            {/* SFX Mute Button */}
            <button
              onClick={() => {
                if (soundManager) {
                  const newMuted = soundManager.toggleSfxMute();
                  setSfxMuted(newMuted);
                }
              }}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all ${
                sfxMuted 
                  ? 'bg-red-600 border-red-500 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              title={sfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {sfxMuted ? '🔇' : '🔊'}
            </button>
            
            {/* Music Mute Button */}
            <button
              onClick={() => {
                if (soundManager) {
                  const newMuted = soundManager.toggleMusicMute();
                  setMusicMuted(newMuted);
                }
              }}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all ${
                musicMuted 
                  ? 'bg-red-600 border-red-500 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
              title={musicMuted ? 'Unmute Music' : 'Mute Music'}
            >
              {musicMuted ? '🔕' : '🎵'}
            </button>
          </div>
        </>
      )}
      
      {/* Level Intro Screen */}
      {levelIntro && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-95 z-40">
          <div className="text-center text-white">
            <h2 className="text-6xl font-bold mb-8 text-cyan-400 animate-pulse">
              LEVEL {level}
            </h2>
            <div className="text-2xl mb-6 text-yellow-400">
              Get Ready!
            </div>
            <div className="text-4xl font-bold text-red-400 animate-bounce">
              {levelIntroCountdown}
            </div>
            <div className="text-lg text-gray-300 mt-4">
              Destroy all Moloch centipede segments to advance
            </div>
          </div>
        </div>
      )}
      
      {/* Game Over Screen - now moved to canvas section */}
      
      {/* Game Flow Screens */}
      {gamePhase === 'connect' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 via-blue-900 to-black bg-opacity-95 z-30">
          <div className="text-center text-white max-w-md mx-auto p-8 bg-gray-800 bg-opacity-80 rounded-xl border border-purple-500">
            <h2 className="text-4xl font-bold mb-6 text-cyan-400">🕹️ Moloch Centipede</h2>
            <p className="text-lg mb-6 text-gray-300">
              Connect your wallet to start playing and earn Moonstone token rewards!
            </p>
            <button
              onClick={() => connect({ connector: injected() })}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all"
            >
              🔗 Connect Wallet
            </button>
          </div>
        </div>
      )}

      {gamePhase === 'burn' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-red-900 via-orange-900 to-black bg-opacity-95 z-30">
          <div className="text-center text-white max-w-md mx-auto p-8 bg-gray-800 bg-opacity-80 rounded-xl border border-orange-500">
            <h2 className="text-3xl font-bold mb-4 text-orange-400">🔥 Burn ARI Tokens</h2>
            <p className="text-xs text-gray-400 mb-2">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
            <p className="text-xs text-gray-400 mb-2">Current Chain: {chainId} {chainId === base.id ? '(Base ✅)' : '(Need Base)'}</p>
            <p className="text-sm text-yellow-400 mb-4">
              Balance: {ariBalance ? (Number(ariBalance) / 1e18).toFixed(2) : '0'} ARI
            </p>
            <p className="text-lg mb-6 text-gray-300">
              Burn 1 ARI token to unlock the game and become eligible for rewards!
            </p>
            
            {burnError && (
              <p className="text-sm text-red-400 mb-4">
                ❌ Error: {burnError.message}
              </p>
            )}
            
            {isBurnPending && (
              <p className="text-sm text-yellow-400 mb-4">
                ⏳ Transaction pending... Please confirm in your wallet
              </p>
            )}
            
            {isBurnConfirming && (
              <p className="text-sm text-blue-400 mb-4">
                ⏳ Confirming transaction...
              </p>
            )}
            
            {chainId !== base.id && !isSwitchingChain && (
              <p className="text-sm text-blue-400 mb-4">
                🔄 Click to switch to Base network first
              </p>
            )}
            
            {isSwitchingChain && (
              <p className="text-sm text-blue-400 mb-4">
                🔄 Switching to Base network...
              </p>
            )}
            
            {burnTransaction && (
              <p className="text-sm text-green-400 mb-4">
                ✅ Burned! Tx: {burnTransaction.slice(0, 10)}...
              </p>
            )}
            
            <button
              onClick={burnTokens}
              disabled={
                isBurning || 
                isSwitchingChain || 
                hasBurnedTokens || 
                (chainId === base.id && (!ariBalance || ariBalance < BigInt(REQUIRED_BURN_AMOUNT)))
              }
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all disabled:transform-none mb-4"
            >
              {isSwitchingChain ? '🔄 Switching to Base...' :
               isBurning ? '🔥 Burning...' : 
               hasBurnedTokens ? '✅ Burned!' : 
               chainId !== base.id ? '🔄 Switch to Base' :
               !ariBalance || ariBalance < BigInt(REQUIRED_BURN_AMOUNT) ? '❌ Insufficient ARI' :
               '🔥 Burn 1 ARI Token'}
            </button>
            
            <div>
              <button
                onClick={() => disconnect()}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-full text-sm"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {gamePhase === 'ready' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-green-900 via-blue-900 to-black bg-opacity-95 z-30">
          <div className="text-center text-white max-w-md mx-auto p-8 bg-gray-800 bg-opacity-80 rounded-xl border border-green-500">
            <h2 className="text-4xl font-bold mb-6 text-green-400">🎮 Ready to Play!</h2>
            <p className="text-lg mb-6 text-gray-300">
              {isMobile ? (
                <>Use the on-screen controls to play.<br />Destroy the Moloch centipede before it reaches you!</>
              ) : (
                <>Use arrow keys to move and space to shoot.<br />Destroy the Moloch centipede before it reaches the bottom!</>
              )}
            </p>
            <p className="text-sm text-yellow-400 mb-6">
              Your high score will be submitted automatically when the game ends!
            </p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all"
            >
              🚀 Start Game
            </button>
          </div>
        </div>
      )}
      
      <div className="w-full h-full flex justify-center items-center relative">
        <canvas
          ref={canvasRef}
          width={BASE_GAME_WIDTH}
          height={BASE_GAME_HEIGHT}
          className="bg-black max-w-full max-h-full block object-contain"
          style={{ width: 'auto', height: 'auto' }}
        />
        
        {/* Game Over screen overlay */}
        {gamePhase === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-red-900 via-purple-900 to-black bg-opacity-95 z-10">
            <div className="text-center text-white max-w-md mx-auto p-8 bg-gray-800 bg-opacity-90 rounded-xl border border-red-500">
              <h2 className="text-4xl font-bold mb-4 text-red-400">💀 Game Over</h2>
              <p className="text-2xl mb-6 text-yellow-400">Final Score: {gameStateRef.current.score}</p>
              
              {gameStateRef.current.score > 0 && (
                <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <p className="text-lg text-green-400 mb-4">🎉 Submitting your high score...</p>
                  <button
                    onClick={submitHighScore}
                    disabled={isClaimingReward}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all disabled:transform-none"
                  >
                    {isClaimingReward ? '📊 Submitting...' : '📊 Submit to Leaderboard'}
                  </button>
                </div>
              )}
              
              <button
                onClick={() => {
                  if (!hasSubmittedScore && gameStateRef.current.score > 0) {
                    const confirmed = confirm(
                      `Are you sure you want to play again without submitting your score of ${gameStateRef.current.score}? This score will be lost forever!`
                    );
                    if (!confirmed) return;
                  }
                  gameStateRef.current.score = 0;
                  setScore(0);
                  setRewardSignature(null);
                  setHasClaimed(false);
                  setHasSubmittedScore(false);
                  // Reset burn status - require new burn for next game
                  setHasBurnedTokens(false);
                  setBurnTransaction(null);
                  setGamePhase('burn');
                  setGameOver(false);
                }}
                className={`bg-gradient-to-r ${
                  !hasSubmittedScore && gameStateRef.current.score > 0 
                    ? 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800' 
                    : 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                } text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all`}
              >
                {!hasSubmittedScore && gameStateRef.current.score > 0 ? '⚠️ Play Again (Score Lost)' : '🔥 Burn ARI & Play Again'}
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard screen */}
        {gamePhase === 'leaderboard' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-yellow-900 via-green-900 to-black bg-opacity-95 z-10 overflow-y-auto">
            <div className="text-center text-white max-w-2xl mx-auto p-8 bg-gray-800 bg-opacity-90 rounded-xl border border-yellow-500 m-4">
              <h2 className="text-4xl font-bold mb-6 text-yellow-400">🏆 Leaderboard</h2>
              
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-green-400">Your Score: {gameStateRef.current.score}</h3>
                {rewardSignature && (
                  <div className="mb-4 p-4 bg-green-800 bg-opacity-50 rounded-lg border border-green-500">
                    <p className="text-lg text-green-300 mb-2">🎁 Reward Available!</p>
                    <p className="text-sm text-gray-300 mb-3">Amount: {rewardSignature.amount} Moonstone</p>
                    {isClaimPending && (
                      <p className="text-sm text-blue-400 mb-3">
                        ⏳ Transaction pending... Please confirm in your wallet
                      </p>
                    )}
                    
                    {isClaimConfirming && (
                      <p className="text-sm text-blue-400 mb-3">
                        ⏳ Confirming transaction...
                      </p>
                    )}
                    
                    {claimError && (
                      <p className="text-sm text-red-400 mb-3">
                        ❌ Error: {claimError.message}
                      </p>
                    )}
                    
                    {claimTxHash && isClaimConfirmed && (
                      <p className="text-sm text-green-400 mb-3">
                        ✅ Claimed! Tx: {claimTxHash.slice(0, 10)}...
                      </p>
                    )}
                    
                    <button
                      onClick={claimReward}
                      disabled={hasClaimed || isClaimPending || isClaimConfirming}
                      className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all disabled:transform-none"
                    >
                      {isClaimPending ? '⏳ Confirming...' :
                       isClaimConfirming ? '⏳ Processing...' :
                       hasClaimed ? '✅ Claimed!' : '🌙 Claim Moonstone'}
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-700 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                <h3 className="text-lg font-bold mb-4 text-cyan-400">🏅 Top Players</h3>
                {leaderboard.length === 0 ? (
                  <p className="text-gray-400">No scores yet. Be the first!</p>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.address === address ? 'bg-blue-600 bg-opacity-50 border border-blue-400' : 'bg-gray-600'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-yellow-400">#{index + 1}</span>
                          <span className="text-sm text-gray-300">{entry.address.slice(0, 6)}...{entry.address.slice(-4)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-white">{entry.score}</span>
                          {entry.address === address && (
                            <span className="text-xs text-blue-300">YOU</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => {
                    gameStateRef.current.score = 0;
                    setScore(0);
                    setRewardSignature(null);
                    setHasClaimed(false);
                    setHasSubmittedScore(false);
                    // Reset burn status - require new burn for next game
                    setHasBurnedTokens(false);
                    setBurnTransaction(null);
                    setGamePhase('burn');
                    setGameOver(false);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all"
                >
                  🔥 Burn ARI & Play Again
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Score and level are now drawn directly on the canvas */}
      </div>
      
      {/* Mobile Game Controls - Fixed at bottom for fullscreen */}
      {isMobile && gamePhase === 'playing' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-90 p-3 overflow-visible border-t-2 border-cyan-500">
          {/* Controls toggle button */}
          <div className="flex justify-center mb-4 relative">
            <button 
              className="bg-gray-700 text-white px-4 py-1 rounded-md text-sm"
              onClick={() => setShowControls(!showControls)}
            >
              {showControls ? 'Hide Controls' : 'Show Controls'}
            </button>
            
            {/* Auto-shoot indicator */}
            {gameStateRef.current.autoShootEnabled && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 rounded-full w-3 h-3"></div>
            )}
          </div>
          
          {/* Game Controls - only shown when enabled */}
          {showControls && (
            <div className="flex justify-between items-center py-4 px-4 overflow-visible">
              {/* Game Boy style D-Pad - left side */}
              <div className="relative w-32 h-32">
                {/* D-pad cross base */}
                <div className="absolute w-24 h-24 bg-gray-900 rounded-md left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute w-8 h-28 bg-gray-700 rounded-sm left-1/2 top-0 -translate-x-1/2"></div>
                <div className="absolute w-28 h-8 bg-gray-700 rounded-sm left-0 top-1/2 -translate-y-1/2"></div>
                
                {/* Up Button */}
                <button 
                  className="absolute w-14 h-14 top-0 left-1/2 -translate-x-1/2 flex items-center justify-center text-white text-xl select-none touch-manipulation bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg"
                  style={{ 
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    window.handleTouchStart('up');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    window.handleTouchEnd('up');
                  }}
                  onMouseDown={() => window.handleTouchStart('up')}
                  onMouseUp={() => window.handleTouchEnd('up')}
                  onMouseLeave={() => window.handleTouchEnd('up')}
                >
                  ↑
                </button>
                
                {/* Left Button */}
                <button 
                  className="absolute w-14 h-14 left-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-white text-xl select-none touch-manipulation bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg"
                  style={{ 
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    window.handleTouchStart('left');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    window.handleTouchEnd('left');
                  }}
                  onMouseDown={() => window.handleTouchStart('left')}
                  onMouseUp={() => window.handleTouchEnd('left')}
                  onMouseLeave={() => window.handleTouchEnd('left')}
                >
                  ←
                </button>
                
                {/* Center button (non-functional) */}
                <div className="absolute w-8 h-8 bg-gray-800 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                
                {/* Right Button */}
                <button 
                  className="absolute w-14 h-14 right-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-white text-xl select-none touch-manipulation bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg"
                  style={{ 
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    window.handleTouchStart('right');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    window.handleTouchEnd('right');
                  }}
                  onMouseDown={() => window.handleTouchStart('right')}
                  onMouseUp={() => window.handleTouchEnd('right')}
                  onMouseLeave={() => window.handleTouchEnd('right')}
                >
                  →
                </button>
                
                {/* Down Button */}
                <button 
                  className="absolute w-14 h-14 bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center text-white text-xl select-none touch-manipulation bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg"
                  style={{ 
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation'
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    window.handleTouchStart('down');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    window.handleTouchEnd('down');
                  }}
                  onMouseDown={() => window.handleTouchStart('down')}
                  onMouseUp={() => window.handleTouchEnd('down')}
                  onMouseLeave={() => window.handleTouchEnd('down')}
                >
                  ↓
                </button>
              </div>
              
              {/* Shoot Button - Game Boy A/B button style - right side */}
              <div className="flex items-center justify-center">
                <div className="-rotate-12 transform-gpu">
                  <button 
                    className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold border-2 border-red-800 shadow-inner select-none touch-manipulation hover:bg-red-700 active:bg-red-500"
                    style={{ 
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation'
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      window.handleTouchStart('shoot');
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      window.handleTouchEnd('shoot');
                    }}
                    onMouseDown={() => window.handleTouchStart('shoot')}
                    onMouseUp={() => window.handleTouchEnd('shoot')}
                    onMouseLeave={() => window.handleTouchEnd('shoot')}
                  >
                    {gameStateRef.current.autoShootEnabled ? 'AUTO' : 'A'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
