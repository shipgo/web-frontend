import { useMediaQuery } from '@mantine/hooks';

/**
 * Corte único de "mobile" para toda la web: menos de `sm` de Mantine (48 em,
 * 768 px). Entre 768 y 1024 px se mantiene el layout de escritorio (menú lateral).
 *
 * `getInitialValueInEffect: false` evalúa la media query en el primer render para
 * evitar el parpadeo escritorio→mobile al montar. En SSR/tests sin `matchMedia`
 * devuelve `false`.
 *
 * Para ocultar/mostrar markup puro prefiriendo CSS, usá `visibleFrom`/`hiddenFrom="sm"`
 * de Mantine; este hook es para cuando cambia la estructura (tabla ↔ tarjetas).
 */
export const MOBILE_QUERY = '(max-width: 47.99em)';

export const useIsMobile = () =>
  useMediaQuery(MOBILE_QUERY, false, { getInitialValueInEffect: false }) ?? false;
