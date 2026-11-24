/**
 * Thin wrapper around the Tauri IPC bridge.
 * Browser development builds keep the same import path but reject the call,
 * so callers can decide whether to fall back or surface an error.
 */
export async function invokeTauri<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}
