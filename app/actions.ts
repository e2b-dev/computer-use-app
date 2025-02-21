'use server'

import { Sandbox } from '@/lib/sandbox'

const TIMEOUT_MS = 300000; // 5 minutes in milliseconds

export async function createSandbox() {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    throw new Error('E2B API key not found');
  }

  try {
    // Create new sandbox instance
    const newSandbox = await Sandbox.create("desktop-dev-v2", {
      apiKey,
      resolution: [800, 600],
      dpi: 96,
      enableNoVncAuth: false,
      timeoutMs: TIMEOUT_MS
    });

    // Start VNC server
    await newSandbox.vncServer.start();

    return {
      sandboxId: newSandbox.sandboxId,
      vncUrl: newSandbox.vncServer.getUrl(true)
    };
  } catch (error) {
    console.error("Failed to create sandbox:", error);
    throw error;
  }
}

export async function increaseTimeout(sandboxId: string) {
  try {
    const desktop = await Sandbox.connect(sandboxId)
    await desktop.setTimeout(TIMEOUT_MS) // 5 minutes
    return true
  } catch (error) {
    console.error('Failed to increase timeout:', error)
    return false
  }
}

export async function stopSandboxAction(sandboxId: string) {
  try {
    const desktop = await Sandbox.connect(sandboxId);
    await desktop.vncServer.stop();
    await desktop.kill();
    return true;
  } catch (error) {
    console.error("Failed to stop sandbox:", error);
    return false;
  }
} 