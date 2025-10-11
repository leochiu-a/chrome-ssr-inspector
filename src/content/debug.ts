/**
 * Debug utility for conditional logging
 * Logs are only shown when debug mode is enabled
 */

class DebugLogger {
  private enabled: boolean = false;

  constructor() {
    // Check if debug mode is enabled via chrome.storage
    chrome.storage.sync.get(['debugMode'], (result) => {
      this.enabled = result.debugMode === true;
    });

    // Listen for debug mode changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.debugMode) {
        this.enabled = changes.debugMode.newValue === true;
      }
    });
  }

  log(...args: unknown[]): void {
    if (this.enabled) {
      console.log(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.enabled) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    // Always log errors
    console.error(...args);
  }
}

export const debug = new DebugLogger();
