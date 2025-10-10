import { SSRDetector } from './ssrDetector';
import { OverlayManager } from './overlayManager';

/**
 * Main SSR Inspector Controller
 */
class SSRInspector {
  private ssrDetector: SSRDetector;
  private overlayManager: OverlayManager;
  private enabled = false;
  private storageListener:
    | ((changes: { [key: string]: chrome.storage.StorageChange }) => void)
    | null = null;

  constructor() {
    console.log('[SSR Inspector] Initializing...');

    this.ssrDetector = new SSRDetector();
    this.overlayManager = new OverlayManager(this.ssrDetector);

    this.loadSettings();
    this.setupMessageListener();
    this.setupKeyboardShortcut();
  }

  /**
   * Load settings from chrome.storage
   */
  private loadSettings(): void {
    chrome.storage.sync.get(['inspectorEnabled'], (result) => {
      this.enabled = result.inspectorEnabled === true; // default false
      if (this.enabled) {
        this.overlayManager.enable();
      }
      console.log(`[SSR Inspector] Loaded settings: enabled=${this.enabled}`);
    });

    // Listen for settings changes
    this.storageListener = (changes) => {
      if (changes.inspectorEnabled) {
        this.enabled = changes.inspectorEnabled.newValue;
        if (this.enabled) {
          this.overlayManager.enable();
        } else {
          this.overlayManager.disable();
        }
        console.log(`[SSR Inspector] Settings changed: enabled=${this.enabled}`);
      }
    };
    chrome.storage.onChanged.addListener(this.storageListener);
  }

  /**
   * Setup message listener for popup communication
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'TOGGLE_INSPECTOR') {
        this.toggle();
        sendResponse({ enabled: this.enabled });
      } else if (message.type === 'GET_STATS') {
        const stats = this.ssrDetector.getStats();
        sendResponse(stats);
      } else if (message.type === 'GET_STATUS') {
        sendResponse({ enabled: this.enabled });
      }
      return true;
    });
  }

  /**
   * Setup keyboard shortcut (Cmd+I on Mac, Ctrl+I on Windows/Linux)
   */
  private setupKeyboardShortcut(): void {
    const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
    const handler = (e: KeyboardEvent): void => {
      // Mac: Cmd+I, Windows/Linux: Ctrl+I
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;
      if (modifierKey && !e.shiftKey && !e.altKey && (e.key === 'i' || e.key === 'I')) {
        console.log('[SSR Inspector] Keyboard shortcut detected');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.toggle();
      }
    };

    // Add listener in capture phase at document level (highest priority)
    document.addEventListener('keydown', handler, true);

    console.log(`[SSR Inspector] Keyboard shortcut registered (${isMac ? 'Cmd' : 'Ctrl'}+I)`);
  }

  /**
   * Toggle inspector on/off
   */
  private toggle(): void {
    this.enabled = !this.enabled;
    console.log('[SSR Inspector] Toggling to:', this.enabled ? 'ENABLED' : 'DISABLED');

    chrome.storage.sync.set({ inspectorEnabled: this.enabled });

    if (this.enabled) {
      this.overlayManager.enable();
      this.showNotification('SSR Inspector enabled');
      console.log('[SSR Inspector] ✅ Inspector is now ENABLED');
    } else {
      this.overlayManager.disable();
      this.showNotification('SSR Inspector disabled');
      console.log('[SSR Inspector] ❌ Inspector is now DISABLED');
    }
  }

  /**
   * Show temporary notification
   */
  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'ssr-inspector-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Remove storage listener
    if (this.storageListener) {
      chrome.storage.onChanged.removeListener(this.storageListener);
      this.storageListener = null;
    }
    this.overlayManager.destroy();
    this.ssrDetector.destroy();
  }
}

// Initialize the inspector
new SSRInspector();
