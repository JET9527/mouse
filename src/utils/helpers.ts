// Utility helper functions

import type { MacroEvent } from '../types/macro'

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Check if WebHID is supported
 */
export function isWebHIDSupported(): boolean {
  return typeof navigator !== 'undefined' && 'hid' in navigator
}

/**
 * Get browser info
 */
export function getBrowserInfo(): { name: string; version: number; supported: boolean } {
  const ua = navigator.userAgent
  let name = 'Unknown'
  let version = 0
  let supported = false

  if ('hid' in navigator) {
    supported = true
  }

  const chromeMatch = ua.match(/Chrome\/(\d+)/)
  const edgeMatch = ua.match(/Edg\/(\d+)/)

  if (edgeMatch) {
    name = 'Edge'
    version = parseInt(edgeMatch[1])
    supported = supported && version >= 89
  } else if (chromeMatch) {
    name = 'Chrome'
    version = parseInt(chromeMatch[1])
    supported = supported && version >= 89
  } else if (ua.includes('Firefox')) {
    name = 'Firefox'
    supported = false
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari'
    supported = false
  }

  return { name, version, supported }
}

/**
 * Format bytes to readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Optimize macro event sequence
 */
export function optimizeMacroEvents(events: MacroEvent[]): MacroEvent[] {
  if (events.length === 0) return events

  const optimized: MacroEvent[] = []

  for (let i = 0; i < events.length; i++) {
    const current = events[i]

    if (i > 0) {
      const prev = events[i - 1]
      const gap = current.timestamp - prev.timestamp

      if (gap > 50) {
        optimized.push({
          id: generateUUID(),
          type: 'delay' as MacroEvent['type'],
          timestamp: prev.timestamp,
          duration: gap,
        })
      }
    }

    optimized.push(current)
  }

  return optimized
}

/**
 * Serialize macro to ArrayBuffer for HID transfer
 */
export function serializeMacro(events: MacroEvent[]): Uint8Array {
  const data: number[] = []

  data.push(events.length) // event count

  events.forEach((event) => {
    data.push(event.type.charCodeAt(0))
    data.push(event.timestamp & 0xff)
    data.push((event.timestamp >> 8) & 0xff)
    data.push((event.timestamp >> 16) & 0xff)
    data.push((event.timestamp >> 24) & 0xff)

    if (event.keyCode !== undefined) data.push(event.keyCode)
    if (event.duration !== undefined) {
      data.push(event.duration & 0xff)
      data.push((event.duration >> 8) & 0xff)
    }
  })

  return new Uint8Array(data)
}
