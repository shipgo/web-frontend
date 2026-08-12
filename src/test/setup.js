import "@testing-library/jest-dom/vitest";

// jsdom does not implement matchMedia; Mantine's color scheme detection
// relies on it, so provide a minimal stub for all tests.
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom does not implement scrollIntoView; Mantine's Combobox calls it when
// navigating options with the keyboard/selection, which otherwise throws an
// unhandled error in tests that open a searchable Select/MultiSelect.
if (
  typeof Element !== "undefined" &&
  !Element.prototype.scrollIntoView
) {
  Element.prototype.scrollIntoView = () => {};
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
