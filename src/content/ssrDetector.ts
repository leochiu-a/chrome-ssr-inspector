/**
 * SSR Detector - Multi-stage detection for server-side vs client-side rendered elements
 * Injected at document_start for maximum accuracy
 */

import { debug } from './debug';

export enum RenderType {
  SSR = 'SSR', // Server-side rendered (present in initial HTML)
  CSR = 'CSR', // Client-side rendered (added by JavaScript)
}

export class SSRDetector {
  private elementStates: WeakMap<Element, RenderType> = new WeakMap();
  private ssrObserver: MutationObserver | null = null;
  private csrObserver: MutationObserver | null = null;
  private phase: 'capturing_ssr' | 'monitoring_csr' = 'capturing_ssr';

  constructor() {
    this.init();
  }

  private init(): void {
    debug.log('[SSR Inspector] Initializing at document_start:', document.readyState);

    // Phase 1: Capture ALL elements during HTML parsing (before any JS runs)
    this.startSSRCapture();

    // Phase 2: Switch to CSR monitoring at DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.switchToCSRMonitoring());
    } else {
      // Edge case: already loaded (shouldn't happen at document_start)
      this.switchToCSRMonitoring();
    }
  }

  /**
   * Phase 1: Capture SSR elements as HTML is being parsed
   * Run BEFORE any JavaScript executes
   */
  private startSSRCapture(): void {
    debug.log('[SSR Inspector] Starting SSR capture at document_start');

    // Capture existing elements
    this.captureExistingElements();

    // Watch for new elements during HTML parsing
    this.ssrObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // During parsing phase, everything is SSR
            this.elementStates.set(element, RenderType.SSR);

            // Also capture all children
            element.querySelectorAll('*').forEach((child) => {
              if (!this.elementStates.has(child)) {
                this.elementStates.set(child, RenderType.SSR);
              }
            });
          }
        });
      });
    });

    // Observe from the earliest possible point
    const target = document.documentElement || document;
    this.ssrObserver.observe(target, {
      childList: true,
      subtree: true,
    });

    debug.log('[SSR Inspector] SSR observer started');
  }

  /**
   * Capture all currently existing elements as SSR
   */
  private captureExistingElements(): void {
    const elements = document.querySelectorAll('*');
    elements.forEach((element) => {
      this.elementStates.set(element, RenderType.SSR);
    });
    debug.log(`[SSR Inspector] Captured ${elements.length} existing SSR elements`);
  }

  /**
   * Phase 2: Switch to CSR monitoring after HTML is fully parsed
   */
  private switchToCSRMonitoring(): void {
    debug.log('[SSR Inspector] DOMContentLoaded - switching to CSR monitoring');

    // Stop SSR capture
    if (this.ssrObserver) {
      this.ssrObserver.disconnect();
      this.ssrObserver = null;
    }

    // Final SSR scan (catch anything we might have missed)
    const finalElements = document.querySelectorAll('*');
    let newCount = 0;
    finalElements.forEach((element) => {
      if (!this.elementStates.has(element)) {
        this.elementStates.set(element, RenderType.SSR);
        newCount++;
      }
    });

    debug.log(`[SSR Inspector] Final SSR scan: ${finalElements.length} total, ${newCount} new`);

    // Now start CSR monitoring
    this.phase = 'monitoring_csr';
    this.startCSRMonitoring();
  }

  /**
   * Start monitoring for CSR elements (after DOMContentLoaded)
   */
  private startCSRMonitoring(): void {
    debug.log('[SSR Inspector] Starting CSR monitoring');

    this.csrObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check if this is truly a NEW element
            if (!this.elementStates.has(element)) {
              // New element after DOMContentLoaded -> CSR
              this.markAsCSR(element);
              debug.log('[SSR Inspector] CSR element detected:', element);
            } else {
              // Element was moved (hydration) -> keep original state (SSR)
              debug.log('[SSR Inspector] SSR element moved (hydration):', element);
            }
          }
        });
      });
    });

    this.csrObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    debug.log('[SSR Inspector] CSR observer started');
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
    if (this.ssrObserver) {
      this.ssrObserver.disconnect();
      this.ssrObserver = null;
    }
    if (this.csrObserver) {
      this.csrObserver.disconnect();
      this.csrObserver = null;
    }
  }
}
