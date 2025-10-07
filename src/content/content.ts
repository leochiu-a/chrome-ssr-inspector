import { SSRDetector } from './ssrDetector';
import { OverlayManager } from './overlayManager';

/**
 * Main SSR Inspector Controller
 */
class SSRInspector {
  private ssrDetector: SSRDetector;
  private overlayManager: OverlayManager;
  private enabled = false;

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
      this.enabled = result.inspectorEnabled !== false; // default true
      if (this.enabled) {
        this.overlayManager.enable();
      }
      console.log(`[SSR Inspector] Loaded settings: enabled=${this.enabled}`);
    });

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.inspectorEnabled) {
        this.enabled = changes.inspectorEnabled.newValue;
        if (this.enabled) {
          this.overlayManager.enable();
        } else {
          this.overlayManager.disable();
        }
        console.log(`[SSR Inspector] Settings changed: enabled=${this.enabled}`);
      }
    });
  }

  /**
   * Setup message listener for popup communication
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
   * Setup keyboard shortcut (Alt + S)
   */
  private setupKeyboardShortcut(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Toggle inspector on/off
   */
  private toggle(): void {
    this.enabled = !this.enabled;
    chrome.storage.sync.set({ inspectorEnabled: this.enabled });

    if (this.enabled) {
      this.overlayManager.enable();
      this.showNotification('SSR Inspector enabled');
    } else {
      this.overlayManager.disable();
      this.showNotification('SSR Inspector disabled');
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
}

// Initialize the inspector
new SSRInspector();
