/**
 * SSR Detector - Detects whether elements are server-side rendered or client-side rendered
 * Framework-agnostic approach: marks elements present at script load time as SSR
 */
export class SSRDetector {
  private ssrElements: WeakSet<Element> = new WeakSet();
  private observer: MutationObserver | null = null;
  private initialScanComplete = false;

  constructor() {
    this.init();
  }

  private init(): void {
    // Mark all current elements as SSR immediately
    this.markInitialElements();

    // Start observing for new CSR elements
    this.startObserving();
  }

  /**
   * Mark all elements currently in DOM as SSR
   */
  private markInitialElements(): void {
    console.log('[SSR Inspector] Marking initial SSR elements');

    // Get all elements in the current DOM
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element) => {
      this.ssrElements.add(element);
    });

    this.initialScanComplete = true;
    console.log(`[SSR Inspector] Marked ${allElements.length} SSR elements`);
  }

  /**
   * Start observing DOM mutations to detect CSR elements
   */
  private startObserving(): void {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // New elements are CSR (not added to ssrElements set)
            const element = node as Element;
            // Also mark all children as CSR
            element.querySelectorAll('*').forEach((child) => {
              // These are CSR elements, so we don't add them to ssrElements
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Check if an element is SSR
   */
  public isSSR(element: Element): boolean {
    if (!this.initialScanComplete) {
      return false;
    }

    // Check if element is in SSR set
    if (this.ssrElements.has(element)) {
      return true;
    }

    // Also check for framework-specific SSR markers
    return this.hasSSRMarkers(element);
  }

  /**
   * Check for framework-specific SSR markers
   */
  private hasSSRMarkers(element: Element): boolean {
    // Check for common SSR attributes
    const ssrAttributes = [
      'data-server-rendered', // Vue SSR
      'data-reactroot', // React SSR (older)
      'data-react-checksum', // React SSR
    ];

    for (const attr of ssrAttributes) {
      if (element.hasAttribute(attr)) {
        return true;
      }
    }

    // Check parent elements for SSR markers
    let parent = element.parentElement;
    while (parent) {
      if (this.ssrElements.has(parent)) {
        return true;
      }
      parent = parent.parentElement;
    }

    return false;
  }

  /**
   * Get statistics about SSR vs CSR elements
   */
  public getStats(): { ssr: number; csr: number; total: number } {
    const allElements = document.querySelectorAll('*');
    let ssrCount = 0;
    let csrCount = 0;

    allElements.forEach((element) => {
      if (this.isSSR(element)) {
        ssrCount++;
      } else {
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
   * Cleanup
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
