'use server'

import { Sandbox } from '@e2b/desktop'

export async function increaseTimeout(sandboxId: string) {
  try {
    const desktop = await Sandbox.connect(sandboxId)
    await desktop.setTimeout(3_00_000) // 5 minutes
    return true
  } catch (error) {
    console.error('Failed to increase timeout:', error)
    return false
  }
} 