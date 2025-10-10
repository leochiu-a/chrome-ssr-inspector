import { SSRDetector, RenderType } from './ssrDetector';
import { Tooltip } from './tooltip';

/**
 * OverlayManager - Manages hover overlay and highlighting
 */
export class OverlayManager {
  private overlay: HTMLDivElement | null = null;
  private ssrDetector: SSRDetector;
  private tooltip: Tooltip;
  private currentElement: Element | null = null;
  private enabled = false;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseOutHandler: ((e: MouseEvent) => void) | null = null;

  constructor(ssrDetector: SSRDetector) {
    this.ssrDetector = ssrDetector;
    this.tooltip = new Tooltip();
    this.init();
  }

  /**
   * Initialize - wait for body to exist
   */
  private init(): void {
    if (document.body) {
      this.createOverlay();
    } else {
      // Wait for body to exist
      const observer = new MutationObserver(() => {
        if (document.body) {
          this.createOverlay();
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true });
    }
  }

  /**
   * Create overlay element
   */
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'ssr-inspector-overlay';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);
  }

  /**
   * Enable inspector
   */
  public enable(): void {
    if (this.enabled) return;
    this.enabled = true;

    // Add mouse event listeners
    this.mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e);
    this.mouseOutHandler = (e: MouseEvent) => this.handleMouseOut(e);

    document.addEventListener('mousemove', this.mouseMoveHandler, true);
    document.addEventListener('mouseout', this.mouseOutHandler, true);

    console.log('[SSR Inspector] Overlay enabled');
  }

  /**
   * Disable inspector
   */
  public disable(): void {
    if (!this.enabled) return;
    this.enabled = false;

    // Remove event listeners
    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler, true);
      this.mouseMoveHandler = null;
    }
    if (this.mouseOutHandler) {
      document.removeEventListener('mouseout', this.mouseOutHandler, true);
      this.mouseOutHandler = null;
    }

    this.hideOverlay();
    this.tooltip.hide();

    console.log('[SSR Inspector] Overlay disabled');
  }

  /**
   * Handle mouse move event
   */
  private handleMouseMove(e: MouseEvent): void {
    if (!this.enabled) return;

    const target = e.target as Element;

    // Ignore our own overlay and tooltip
    if (
      target.classList.contains('ssr-inspector-overlay') ||
      target.classList.contains('ssr-inspector-tooltip') ||
      target.closest('.ssr-inspector-tooltip')
    ) {
      return;
    }

    // Skip if same element
    if (target === this.currentElement) {
      return;
    }

    this.currentElement = target;
    this.showOverlay(target, e.clientX, e.clientY);
  }

  /**
   * Handle mouse out event
   */
  private handleMouseOut(e: MouseEvent): void {
    if (!this.enabled) return;

    const target = e.target as Element;
    if (target === this.currentElement) {
      // Only hide if we're leaving the element completely
      const relatedTarget = e.relatedTarget as Element;
      if (!relatedTarget || !this.currentElement?.contains(relatedTarget)) {
        this.hideOverlay();
        this.tooltip.hide();
        this.currentElement = null;
      }
    }
  }

  /**
   * Show overlay on element
   */
  private showOverlay(element: Element, mouseX: number, mouseY: number): void {
    if (!this.overlay) return;

    const rect = element.getBoundingClientRect();
    const renderType = this.ssrDetector.getRenderType(element);

    // Set overlay color based on render type
    let backgroundColor: string;
    let borderColor: string;

    switch (renderType) {
      case RenderType.SSR:
        backgroundColor = 'rgba(16, 185, 129, 0.2)'; // Green for SSR
        borderColor = 'rgba(16, 185, 129, 0.8)';
        break;
      case RenderType.CSR:
        backgroundColor = 'rgba(59, 130, 246, 0.2)'; // Blue for CSR
        borderColor = 'rgba(59, 130, 246, 0.8)';
        break;
      case RenderType.UNKNOWN:
        backgroundColor = 'rgba(251, 191, 36, 0.2)'; // Yellow for Unknown
        borderColor = 'rgba(251, 191, 36, 0.8)';
        break;
    }

    // Position overlay
    this.overlay.style.position = 'fixed';
    this.overlay.style.left = `${rect.left}px`;
    this.overlay.style.top = `${rect.top}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
    this.overlay.style.backgroundColor = backgroundColor;
    this.overlay.style.border = `2px solid ${borderColor}`;
    this.overlay.style.display = 'block';
    this.overlay.style.pointerEvents = 'none';
    this.overlay.style.zIndex = '999998';
    this.overlay.style.borderRadius = '2px';
    this.overlay.style.transition = 'all 0.1s ease';

    // Show tooltip
    this.tooltip.show(element, renderType, { x: mouseX, y: mouseY });
  }

  /**
   * Hide overlay
   */
  private hideOverlay(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  /**
   * Toggle inspector on/off
   */
  public toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Check if enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.disable();
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.tooltip.destroy();
  }
}
