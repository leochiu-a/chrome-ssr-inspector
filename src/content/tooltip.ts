import { RenderType } from './ssrDetector';

/**
 * Tooltip - Displays element information with render type
 */
export class Tooltip {
  private tooltip: HTMLDivElement | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize - wait for body to exist
   */
  private init(): void {
    if (document.body) {
      this.createTooltip();
    } else {
      // Wait for body to exist
      const observer = new MutationObserver(() => {
        if (document.body) {
          this.createTooltip();
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true });
    }
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'ssr-inspector-tooltip';
    this.tooltip.style.display = 'none';
    document.body.appendChild(this.tooltip);
  }

  /**
   * Show tooltip with element information
   */
  public show(element: Element, renderType: RenderType, position: { x: number; y: number }): void {
    if (!this.tooltip) return;

    const tagName = element.tagName.toLowerCase();
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const id = element.id ? `#${element.id}` : '';
    const rect = element.getBoundingClientRect();

    // Set color and description based on render type
    let renderColor: string;
    let renderLabel: string;
    let renderDesc: string;
    let confidence: string;

    switch (renderType) {
      case RenderType.SSR:
        renderColor = '#10b981';
        renderLabel = 'SSR';
        renderDesc = 'Server-Side Rendered';
        confidence = 'High - Present in initial HTML';
        break;
      case RenderType.CSR:
        renderColor = '#3b82f6';
        renderLabel = 'CSR';
        renderDesc = 'Client-Side Rendered';
        confidence = 'High - Added by JavaScript';
        break;
    }

    this.tooltip.innerHTML = `
      <div class="ssr-inspector-tooltip-header" style="background-color: ${renderColor}">
        <span class="ssr-inspector-tooltip-badge">${renderLabel}</span>
        <span class="ssr-inspector-tooltip-tag">${tagName}${id}${classes}</span>
      </div>
      <div class="ssr-inspector-tooltip-body">
        <div class="ssr-inspector-tooltip-row">
          <span class="ssr-inspector-tooltip-label">Type:</span>
          <span class="ssr-inspector-tooltip-value">${renderDesc}</span>
        </div>
        <div class="ssr-inspector-tooltip-row">
          <span class="ssr-inspector-tooltip-label">Confidence:</span>
          <span class="ssr-inspector-tooltip-value">${confidence}</span>
        </div>
        <div class="ssr-inspector-tooltip-row">
          <span class="ssr-inspector-tooltip-label">Size:</span>
          <span class="ssr-inspector-tooltip-value">${Math.round(rect.width)}×${Math.round(rect.height)}</span>
        </div>
      </div>
    `;

    // Position tooltip
    this.positionTooltip(position.x, position.y);
    this.tooltip.style.display = 'block';
  }

  /**
   * Position tooltip smartly to avoid overflow
   */
  private positionTooltip(x: number, y: number): void {
    if (!this.tooltip) return;

    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x + 10;
    let top = y + 10;

    // Adjust if tooltip would overflow right
    if (left + tooltipRect.width > viewportWidth) {
      left = x - tooltipRect.width - 10;
    }

    // Adjust if tooltip would overflow bottom
    if (top + tooltipRect.height > viewportHeight) {
      top = y - tooltipRect.height - 10;
    }

    // Ensure tooltip stays within viewport
    left = Math.max(10, Math.min(left, viewportWidth - tooltipRect.width - 10));
    top = Math.max(10, Math.min(top, viewportHeight - tooltipRect.height - 10));

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  /**
   * Hide tooltip
   */
  public hide(): void {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }
}
