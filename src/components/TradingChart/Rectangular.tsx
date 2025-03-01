import { IChartApi, Time, LineStyle } from 'lightweight-charts';

export interface RectangleOptions {
  fillColor: string;
  fillOpacity: number;
  borderColor: string;
  borderWidth: number;
  borderStyle?: number; // LineStyle value
  borderVisible?: boolean;
}

export interface Rectangle {
  xMin: number; // timestamp in ms
  xMax: number; // timestamp in ms
  yMin: number; 
  yMax: number;
  options: RectangleOptions;
}

export class RectanglePlugin {
  private _chart: IChartApi;
  private _rectangles: Rectangle[] = [];
  private _overlayId = 'rectangle-plugin-overlay';
  private _priceRange: { min: number; max: number } | null = null;

  constructor(chart: IChartApi, priceRange?: { min: number; max: number }) {
    this._chart = chart;
    if (priceRange) {
      this._priceRange = priceRange;
    }
    this._init();
  }

  public setPriceRange(min: number, max: number): void {
    this._priceRange = { min, max };
    this._drawRectangles();
  }

  private _init(): void {
    // Create an overlay for our rectangles
    const chartElement = this._chart.chartElement();
    const container = chartElement.parentElement;
    if (!container) return;

    // Remove any existing overlay
    const existingOverlay = document.getElementById(this._overlayId);
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create a new overlay element
    const overlay = document.createElement('div');
    overlay.id = this._overlayId;
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2';
    
    container.style.position = 'relative';
    container.appendChild(overlay);

    // Subscribe to chart events to update rectangles
    this._chart.timeScale().subscribeVisibleTimeRangeChange(() => this._drawRectangles());
    this._chart.subscribeCrosshairMove(() => this._drawRectangles());
  }

  public addRectangle(rectangle: Rectangle): void {
    this._rectangles.push(rectangle);
    this._drawRectangles();
  }

  public clearRectangles(): void {
    this._rectangles = [];
    this._drawRectangles();
  }

  public setRectangles(rectangles: Rectangle[]): void {
    this._rectangles = rectangles;
    this._drawRectangles();
  }

  private _drawRectangles(): void {
    const overlay = document.getElementById(this._overlayId);
    if (!overlay) return;

    // Clear previous boxes
    overlay.innerHTML = '';

    this._rectangles.forEach((rect, index) => {
      try {
        // Convert timestamps to coordinates
        const xMin = this._chart.timeScale().timeToCoordinate(rect.xMin / 1000 as Time);
        const xMax = this._chart.timeScale().timeToCoordinate(rect.xMax / 1000 as Time);
        
        if (xMin === null || xMax === null) return;
        
        // Calculate visible container height
        const containerHeight = this._chart.chartElement().clientHeight;
        
        // Calculate Y coordinates manually based on container height
        // Since we can't access priceToCoordinate directly in all versions
        const chartHeight = containerHeight;
        
        // Determine min and max prices for coordinate calculation
        let minPrice = rect.yMin;
        let maxPrice = rect.yMax;
        
        // Use provided price range if available
        if (this._priceRange) {
          minPrice = this._priceRange.min;
          maxPrice = this._priceRange.max;
        }
        
        const priceRange = maxPrice - minPrice;
        
        // Calculate Y position (inverting because CSS Y is top-down)
        // This is approximated - without internal APIs we can't get exact coordinates
        const yMaxPct = 1 - ((rect.yMax - minPrice) / priceRange);
        const yMinPct = 1 - ((rect.yMin - minPrice) / priceRange);
        
        const yMax = Math.max(0, Math.min(chartHeight, yMaxPct * chartHeight));
        const yMin = Math.max(0, Math.min(chartHeight, yMinPct * chartHeight));
        
        // Create a div for the rectangle
        const rectElement = document.createElement('div');
        rectElement.style.position = 'absolute';
        rectElement.style.left = `${Math.min(xMin, xMax)}px`;
        rectElement.style.top = `${Math.min(yMin, yMax)}px`;
        rectElement.style.width = `${Math.abs(xMax - xMin)}px`;
        rectElement.style.height = `${Math.abs(yMax - yMin)}px`;
        
        // Apply styles
        const opacity = rect.options.fillOpacity || 0.2;
        // Convert opacity to hex
        const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');
        rectElement.style.backgroundColor = `${rect.options.fillColor}${hexOpacity}`;
        
        if (rect.options.borderVisible !== false) {
          rectElement.style.border = `${rect.options.borderWidth}px ${this._getBorderStyle(rect.options.borderStyle)} ${rect.options.borderColor}`;
        }
        
        // Add label
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.top = '2px';
        label.style.left = '2px';
        label.style.color = 'white';
        label.style.backgroundColor = 'rgba(0,0,0,0.7)';
        label.style.padding = '2px 4px';
        label.style.fontSize = '10px';
        label.style.borderRadius = '2px';
        label.textContent = `Box ${index + 1}`;
        
        rectElement.appendChild(label);
        overlay.appendChild(rectElement);
      } catch (err) {
        console.error(`Error creating rectangle ${index}:`, err);
      }
    });
  }

  private _getBorderStyle(style?: number): string {
    // Convert LineStyle enum to CSS border style
    switch (style) {
      case LineStyle.Solid: return 'solid';
      case LineStyle.Dotted: return 'dotted';
      case LineStyle.Dashed: return 'dashed';
      case LineStyle.LargeDashed: return 'dashed';
      default: return 'solid';
    }
  }

  public destroy(): void {
    const overlay = document.getElementById(this._overlayId);
    if (overlay) {
      overlay.remove();
    }
    
    // Clean up subscriptions
    // Note: Lightweight Charts doesn't provide a way to unsubscribe from events directly
    // so we rely on the chart's destroy method to clean up all subscriptions
  }
}
