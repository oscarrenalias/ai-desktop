import { readTextFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { Logger } from './logger';

/**
 * AppConfig is a singleton class for loading and accessing application configuration
 * from a JSON file stored in the system's app config directory (platform-specific).
 *
 * Usage:
 * ```typescript
 * import { AppConfig } from '$lib/config';
 * const config = AppConfig.getInstance();
 * const value = await config.get('exampleKey');
 * const all = await config.getAll();
 * ```
 *
 * The config file is loaded once and cached for future access.
 */
export class AppConfig {
  /** Singleton instance */
  private static instance: AppConfig;
  /** Cached config object, or null if not loaded yet */
  private config: Record<string, unknown> | null = null;

  /** Private constructor for singleton pattern */
  private constructor() {}

  /**
   * Get the singleton instance of AppConfig.
   * @returns {AppConfig} The AppConfig instance.
   */
  static getInstance() {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  /**
   * Loads the config file, preferring dev.appconfig.json, falling back to appConfigDir/appconfig.json.
   * All errors are logged but not thrown. SSR-safe.
   * @returns {Promise<void>} Resolves when config is loaded or attempted.
   */
  async load(): Promise<void> {
    if (this.config !== null) return; // Already loaded
    let log = Logger.getLogger('AppConfig');

    // Try dev.appconfig.json in development mode
    if (import.meta.env.DEV) {
      try {
        const contents = await readTextFile("./dev.appconfig.json");
        this.config = JSON.parse(contents);
        log.debug('Loaded config from dev.appconfig.json');
        return;
      } catch (err) {
        log.debug('Failed to load dev.appconfig.json: ' + (err instanceof Error ? err.message : String(err)));
      }
    }

    // Fallback to appconfig.json in the app config directory
    try {
      const contents = await readTextFile("appconfig.json", { baseDir: BaseDirectory.AppConfig });
      this.config = JSON.parse(contents);
      log.debug('Loaded config from appConfigDir/appconfig.json');
    } catch (err) {
      log.debug('Failed to load appConfigDir config: ' + (err instanceof Error ? err.message : String(err)));
      this.config = {};
    }
  }

  /**
   * Get a value from the config by key. Loads the config if needed.
   * @param key The config key to retrieve.
   * @param defaultValue Optional value to return if the key is not found.
   * @returns {Promise<T | undefined>} The value for the key, or defaultValue/undefined if not found.
   */
  async get<T = unknown>(key: string, defaultValue?: T): Promise<T | undefined> {
    if (this.config === null) {
      await this.load();
    }
    if (this.config && key in this.config) {
      return this.config[key] as T;
    }
    return defaultValue;
  }

  /**
   * Get the entire config object. Loads the config if needed.
   * @returns {Promise<Record<string, unknown> | null>} The config object, or null if not loaded.
   */
  async getAll(): Promise<Record<string, unknown> | null> {
    if (this.config === null) {
      await this.load();
    }
    return this.config;
  }
}

// Usage example (in your SvelteKit code):
// const config = AppConfig.getInstance();
// const value = await config.get('exampleKey');
