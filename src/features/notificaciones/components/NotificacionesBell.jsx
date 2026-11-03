import { useAuth } from '@contexts/auth';
import { hasAnyRole, isCustomer, ROLES_WEB } from '@domain/roles';

import { usePushNotifications } from '../hooks/usePushNotifications';
import NotificacionesMenu from './NotificacionesMenu';

/**
 * Punto de entrada de la campana de notificaciones para el `Header`.
 *
 * - Gatea por rol: SUPERUSER / ADMIN (panel) y CUSTOMER (portal, `SHG-BE-106`).
 * - Inicializa OneSignal web + registro de token push sólo para SUPERUSER / ADMIN
 *   (degradado a sólo in-app si no hay config o el permiso está bloqueado). El
 *   CUSTOMER no tiene push: ve su bandeja al abrir el portal.
 * - Para el CUSTOMER (y no admin) los avisos navegan a `/portal/envios/:codigo`.
 */
const NotificacionesBell = () => {
  const { user } = useAuth();
  const esAdmin = hasAnyRole(user, ROLES_WEB);
  const esPortal = !esAdmin && isCustomer(user);

  usePushNotifications({ enabled: esAdmin });

  if (!esAdmin && !esPortal) return null;

  return <NotificacionesMenu portal={esPortal} />;
};

export default NotificacionesBell;
