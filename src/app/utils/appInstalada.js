import { MOBILE_QUERY } from '@hooks/useIsMobile';

/**
 * `true` si la web corre instalada (modo `standalone`, "Agregar a inicio" / instalar desde
 * Chrome) en un celular. En una pestaña del navegador, o instalada en escritorio, es `false`.
 *
 * Lo usa el splash de marca: sólo tiene sentido en la app instalada del celular, donde
 * reemplaza al splash nativo de Chrome. `navigator.standalone` cubre iOS < 16.4 (que no
 * resuelve `display-mode`).
 */
export const esAppInstaladaMovil = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  const instalada =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  return instalada && window.matchMedia(MOBILE_QUERY).matches;
};
