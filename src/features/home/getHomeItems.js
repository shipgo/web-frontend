import { hasAnyRole } from '@domain/roles';

import ITEMS from './items.jsx';

/**
 * Filtra `ITEMS` por rol: descarta opciones cuyo `roles` no incluya un rol
 * del usuario, y las secciones que quedan sin opciones. Las opciones sin
 * `roles` (ej. "Opciones") quedan siempre visibles.
 */
export const getHomeItems = (user) =>
  ITEMS.map(({ options, ...section }) => ({
    ...section,
    options: options.filter(({ roles }) => !roles || hasAnyRole(user, roles)),
  })).filter((section) => section.options.length > 0);
