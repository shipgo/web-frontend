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

// Convención para tests que consultan ítems de un `Menu`/`RowActionsMenu`
// (Mantine): usar `hidden: true` en `getByRole/findByRole/queryByRole` de
// `menuitem`. En jsdom todos los rects son 0x0, así que el middleware `hide()`
// de floating-ui (Popover de Mantine) marca la referencia como oculta y deja
// el dropdown con `display: none` inline, de forma intermitente según el
// timing del cómputo de posición. Los roles inaccesibles quedan excluidos por
// defecto y `menuitem` falla al azar ("Unable to find role=menuitem"). Con
// `hidden: true` los ítems se encuentran según lo que está montado, y las
// aserciones de ausencia siguen siendo válidas (el ítem no está en el DOM).
