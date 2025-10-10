/**
 * SSR Detector - Multi-stage detection for server-side vs client-side rendered elements
 * Injected at document_start for maximum accuracy
 */

export enum RenderType {
  SSR = 'SSR', // Server-side rendered (present in initial HTML)
  CSR = 'CSR', // Client-side rendered (added by JavaScript)
}

export class SSRDetector {
  private elementStates: WeakMap<Element, RenderType> = new WeakMap();
  private observer: MutationObserver | null = null;
  private documentStartElements: Set<Element> = new Set();
  private phase: 'document_start' | 'dom_ready' | 'monitoring' = 'document_start';

  constructor() {
    this.init();
  }

  private init(): void {
    console.log('[SSR Inspector] Initializing at:', document.readyState);

    // Phase 1: Capture elements at document_start (真正的 SSR)
    this.captureDocumentStartElements();

    // Phase 2: Wait for DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      // Already loaded, go directly to monitoring
      this.onDOMReady();
    }
  }

  /**
   * Phase 1: Capture all elements at document_start
   * These are definitely SSR since no JS has executed yet
   */
  private captureDocumentStartElements(): void {
    console.log('[SSR Inspector] Phase 1: Capturing document_start elements');

    const elements = document.querySelectorAll('*');
    elements.forEach((element) => {
      this.documentStartElements.add(element);
      this.elementStates.set(element, RenderType.SSR);
    });

    console.log(`[SSR Inspector] Captured ${elements.length} SSR elements at document_start`);
  }

  /**
   * Phase 2: DOMContentLoaded - classify new elements
   */
  private onDOMReady(): void {
    this.phase = 'dom_ready';
    console.log('[SSR Inspector] Phase 2: DOMContentLoaded scan');

    // Scan all current elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element) => {
      if (!this.elementStates.has(element)) {
        // Element exists at DOMContentLoaded but wasn't captured at document_start
        // This means it was in the initial HTML but parsed after our first scan
        // Therefore, it's still SSR (can be verified by viewing page source)
        this.elementStates.set(element, RenderType.SSR);
      }
    });

    console.log(`[SSR Inspector] Total elements at DOMContentLoaded: ${allElements.length}`);

    // Phase 3: Start monitoring for CSR
    this.startMonitoring();
  }

  /**
   * Phase 3: Monitor for new CSR elements
   */
  private startMonitoring(): void {
    this.phase = 'monitoring';
    console.log('[SSR Inspector] Phase 3: Starting mutation observation');

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Definitely CSR if added during monitoring phase
            this.markAsCSR(element);
          }
        });
      });
    });

    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Mark element and all its children as CSR
   */
  private markAsCSR(element: Element): void {
    this.elementStates.set(element, RenderType.CSR);

    // Also mark all children
    element.querySelectorAll('*').forEach((child) => {
      if (!this.elementStates.has(child)) {
        this.elementStates.set(child, RenderType.CSR);
      }
    });
  }

  /**
   * Get render type for an element
   */
  public getRenderType(element: Element): RenderType {
    const state = this.elementStates.get(element);

    if (state) {
      return state;
    }

    // Element not in our map
    // If we're in monitoring phase and it's not tracked, it's likely SSR
    // (existed before monitoring started)
    return RenderType.SSR;
  }

  /**
   * Check if an element is SSR (for backward compatibility)
   */
  public isSSR(element: Element): boolean {
    return this.getRenderType(element) === RenderType.SSR;
  }

  /**
   * Get statistics about render types
   */
  public getStats(): { ssr: number; csr: number; total: number } {
    const allElements = document.querySelectorAll('*');
    let ssrCount = 0;
    let csrCount = 0;

    allElements.forEach((element) => {
      const type = this.getRenderType(element);
      if (type === RenderType.SSR) {
        ssrCount++;
      } else if (type === RenderType.CSR) {
        csrCount++;
      }
    });

    return {
      ssr: ssrCount,
      csr: csrCount,
      total: allElements.length,
    };
  }

  /**
   * Get current detection phase
   */
  public getPhase(): string {
    return this.phase;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
