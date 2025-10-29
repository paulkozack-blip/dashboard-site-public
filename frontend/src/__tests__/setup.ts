import { vi } from 'vitest';

// ...matchMedia как раньше
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: any) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});




if (!HTMLCanvasElement.prototype.getContext) {
// @ts-expect-error
    HTMLCanvasElement.prototype.getContext = function () {
    return {
        canvas: this,
        //... (любые методы, см. выше)
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        fillRect: () => {},
        clearRect: () => {},
        save: () => {},
        restore: () => {},
        getLineDash: () => [],
        setLineDash: () => {},
        lineTo: () => {},
        moveTo: () => {},
        beginPath: () => {},
        closePath: () => {},
        stroke: () => {},
        fill: () => {},
        // ... (add others as needed)
    };
  };
}