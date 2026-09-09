import { Alert, Button } from '@mantine/core';
import {
  IconAlertTriangle,
  IconClockExclamation,
  IconPackageOff,
  IconShieldExclamation,
} from '@tabler/icons-react';

const CONFIG = {
  not_found: {
    color: 'yellow',
    icon: IconPackageOff,
    title: 'No encontramos ese envío',
    message:
      'Revisá que el código esté bien escrito. Si recién hiciste el envío, puede tardar unos minutos en aparecer.',
  },
  rate_limited: {
    color: 'orange',
    icon: IconClockExclamation,
    title: 'Demasiadas consultas',
    message: 'Hiciste muchas consultas seguidas. Probá de nuevo en un minuto.',
  },
  captcha_invalid: {
    color: 'red',
    icon: IconShieldExclamation,
    title: 'No pudimos verificar que sos una persona',
    message:
      'La verificación de seguridad venció o no es válida. Resolvela de nuevo y volvé a consultar.',
  },
  network: {
    color: 'red',
    icon: IconAlertTriangle,
    title: 'No pudimos conectar',
    message:
      'Hubo un problema de conexión con el servidor. Revisá tu conexión e intentá otra vez.',
  },
  unknown: {
    color: 'red',
    icon: IconAlertTriangle,
    title: 'Algo salió mal',
    message: 'No pudimos consultar el envío. Intentá nuevamente en unos minutos.',
  },
};

/**
 * Alerta de error del tracking público. `kind` sale de `clasificarErrorTracking`
 * (`usePublicTracking`). Reutilizable por el portal CUSTOMER (`SHG-FE-026`).
 *
 * @param {Object} props
 * @param {'not_found'|'rate_limited'|'network'|'unknown'} props.kind
 * @param {() => void} [props.onRetry]  Si se pasa, muestra un botón "Reintentar".
 */
const TrackingErrorAlert = ({ kind, onRetry }) => {
  const cfg = CONFIG[kind] ?? CONFIG.unknown;
  const Icon = cfg.icon;

  return (
    <Alert color={cfg.color} icon={<Icon size={18} />} title={cfg.title} variant="light">
      {cfg.message}
      {onRetry ? (
        <div style={{ marginTop: 12 }}>
          <Button size="xs" variant="white" color={cfg.color} onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : null}
    </Alert>
  );
};

export default TrackingErrorAlert;
