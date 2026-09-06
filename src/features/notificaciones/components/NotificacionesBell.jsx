import { useAuth } from '@contexts/auth';
import { hasAnyRole, ROLES_WEB } from '@domain/roles';

import { usePushNotifications } from '../hooks/usePushNotifications';
import NotificacionesMenu from './NotificacionesMenu';

/**
 * Punto de entrada de la campana de notificaciones para el `Header`.
 *
 * - Gatea por rol: sólo SUPERUSER / ADMIN (los únicos roles que operan la web y
 *   reciben notificaciones in-app — `CONTRACTS.md §3`, `planning/NOTIFICATIONS.md`).
 * - Inicializa OneSignal web + registro de token push (degradado a sólo in-app si
 *   no hay config o el permiso está bloqueado).
 */
const NotificacionesBell = () => {
  const { user } = useAuth();
  const habilitado = hasAnyRole(user, ROLES_WEB);

  usePushNotifications({ enabled: habilitado });

  if (!habilitado) return null;

  return <NotificacionesMenu />;
};

export default NotificacionesBell;
