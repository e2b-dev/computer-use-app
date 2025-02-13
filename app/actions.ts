'use server'

const TIMEOUT_MS = 600000; // 10 minutes in milliseconds

import { Sandbox } from '@/lib/sandbox'

export async function increaseTimeout(sandboxId: string) {
  try {
    const desktop = await Sandbox.connect(sandboxId)
    await desktop.setTimeout(TIMEOUT_MS) // 10 minutes
    return true
  } catch (error) {
    console.error('Failed to increase timeout:', error)
    return false
  }
} 