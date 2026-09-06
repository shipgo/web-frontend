import { createContext, useContext, useLayoutEffect } from "react";

/**
 * Contexto del slot `AppShell.footer` del layout.
 *
 * Reemplaza la lista `ROUTES_WITH_FOOTER` hardcodeada que tenía
 * `src/app/layout/index.jsx`: en vez de mirar la URL, cada pantalla que
 * renderiza un footer canónico (`<PageFooter>`, que llama
 * `useRegisterFooterSlot`) registra su presencia mientras está montada y el
 * layout lee `hasFooter` para decidir si el slot está colapsado. Ver
 * `SHG-FE-036`. El `Provider` vive en `FooterSlotProvider.jsx`.
 */
export const FooterSlotContext = createContext(null);

const NO_PROVIDER = { hasFooter: false, register: () => () => {} };

/**
 * Lee el estado del slot. Sólo tiene sentido dentro de `FooterSlotProvider`
 * (el layout); devuelve `{ hasFooter: false }` fuera de él.
 */
export const useFooterSlot = () => useContext(FooterSlotContext) ?? NO_PROVIDER;

/**
 * Registra un footer de página mientras el componente que llama a este hook
 * está montado. No-op si no hay `FooterSlotProvider` ancestro (p. ej. en tests
 * que montan una pantalla con un `<AppShell>` pelado).
 */
export const useRegisterFooterSlot = () => {
  const context = useContext(FooterSlotContext);
  const register = context?.register;

  useLayoutEffect(() => {
    if (!register) return undefined;
    return register();
  }, [register]);
};
