import { Sandbox } from '@e2b/desktop'

class DesktopManager {
  private static instance: Sandbox | null = null
  private static initializationPromise: Promise<Sandbox> | null = null

  static async getInstance(): Promise<Sandbox> {
    const apiKey = process.env.NEXT_PUBLIC_E2B_API_KEY
    if (!apiKey) {
      throw new Error('E2B API key not found')
    }

    // List and kill all running sandboxes
    try {
      const runningSandboxes = await Sandbox.list({ apiKey })
      for (const sandboxInfo of runningSandboxes) {
        try {
          const sandbox = await Sandbox.connect(sandboxInfo.sandboxId)
          await sandbox.kill()
          console.log(`Killed running sandbox: ${sandboxInfo.sandboxId}`)
        } catch (error) {
          console.error(`Failed to kill running sandbox (${sandboxInfo.sandboxId}):`, error)
        }
      }
    } catch (error) {
      console.error('Error listing running sandboxes:', error)
    }

    // Reset any cached instance/promise
    this.instance = null
    this.initializationPromise = null

    // Always start a new sandbox instance
    console.log('Starting a new sandbox instance')
    this.initializationPromise = DesktopManager.createNewInstance()
    return this.initializationPromise
  }

  private static async createNewInstance(): Promise<Sandbox> {
    const apiKey = process.env.NEXT_PUBLIC_E2B_API_KEY
    if (!apiKey) {
      throw new Error('E2B API key not found')
    }

    return Sandbox.create({ apiKey, timeoutMs: 3_00_000 })
      .then((sandbox) => {
        this.instance = sandbox
        return sandbox
      })
      .catch((error) => {
        this.instance = null
        this.initializationPromise = null
        throw error
      })
  }

  static async cleanup(): Promise<void> {
    if (this.instance) {
      await this.instance.kill()
      this.instance = null
      this.initializationPromise = null
    }
  }
}

export default DesktopManager