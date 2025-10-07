/**
 * Tooltip - Displays element information
 */
export class Tooltip {
  private tooltip: HTMLDivElement | null = null;

  constructor() {
    this.createTooltip();
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
  public show(element: Element, isSSR: boolean, position: { x: number; y: number }): void {
    if (!this.tooltip) return;

    const tagName = element.tagName.toLowerCase();
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const id = element.id ? `#${element.id}` : '';
    const rect = element.getBoundingClientRect();

    const renderType = isSSR ? 'SSR' : 'CSR';
    const renderColor = isSSR ? '#10b981' : '#3b82f6';

    this.tooltip.innerHTML = `
      <div class="ssr-inspector-tooltip-header" style="background-color: ${renderColor}">
        <span class="ssr-inspector-tooltip-badge">${renderType}</span>
        <span class="ssr-inspector-tooltip-tag">${tagName}${id}${classes}</span>
      </div>
      <div class="ssr-inspector-tooltip-body">
        <div class="ssr-inspector-tooltip-row">
          <span class="ssr-inspector-tooltip-label">Size:</span>
          <span class="ssr-inspector-tooltip-value">${Math.round(rect.width)}×${Math.round(rect.height)}</span>
        </div>
        <div class="ssr-inspector-tooltip-row">
          <span class="ssr-inspector-tooltip-label">Type:</span>
          <span class="ssr-inspector-tooltip-value">${isSSR ? 'Server-Side Rendered' : 'Client-Side Rendered'}</span>
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
