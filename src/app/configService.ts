import { AppConfig } from "../domain/types";
import { invokeTauri } from "../shared/tauri";

export interface ApplyResult {
  success: boolean;
  msg: string;
}

/**
 * Loads the persisted configuration. Returns null when the app runs in a
 * plain browser without the Tauri bridge.
 */
export async function loadConfig(): Promise<AppConfig | null> {
  try {
    return await invokeTauri<AppConfig>("load_config");
  } catch {
    return null;
  }
}

/**
 * Validates a backup file on the host before it replaces the working config.
 * Rejects malformed JSON, schema mismatches, and newer format versions.
 */
export async function validateImportedConfig(content: string): Promise<AppConfig> {
  return invokeTauri<AppConfig>("validate_imported_config", { content });
}

export async function applyConfig(config: AppConfig): Promise<ApplyResult> {
  return invokeTauri<ApplyResult>("apply_config", { config });
}

export async function readAutostartEnabled(): Promise<boolean | null> {
  try {
    return await invokeTauri<boolean>("autostart_enabled");
  } catch {
    return null;
  }
}

export async function writeAutostartEnabled(enabled: boolean): Promise<void> {
  try {
    await invokeTauri("set_autostart", { enabled });
  } catch {
    // Browser fallback: autostart is a native-only capability.
  }
}
