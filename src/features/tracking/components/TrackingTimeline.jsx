import { Text, Timeline } from '@mantine/core';
import { IconCircleDot } from '@tabler/icons-react';

import { estadoBadge, estadoLabel } from '@domain/estados';
import { formatFechaHora } from '@domain/format';

/**
 * Línea de tiempo de estados de un envío a partir del `historial` del
 * `PublicTrackingDTO` (`[{ estado, fecha }]`, orden cronológico ascendente).
 *
 * Usa el mapa canónico de `@domain/estados` para labels y colores — nunca los
 * strings que pueda mandar el backend. Reutilizable por el portal CUSTOMER
 * (`SHG-FE-026`).
 *
 * @param {Object} props
 * @param {Array<{ estado: string, fecha: string }>} [props.historial=[]]
 */
const TrackingTimeline = ({ historial = [] }) => {
  if (historial.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Todavía no hay movimientos registrados para este envío.
      </Text>
    );
  }

  return (
    <Timeline active={historial.length - 1} bulletSize={22} lineWidth={2}>
      {historial.map((item, index) => {
        const { color } = estadoBadge('envio', item.estado);
        return (
          <Timeline.Item
            key={`${item.estado}-${item.fecha ?? index}`}
            bullet={<IconCircleDot size={14} />}
            color={color}
            title={estadoLabel('envio', item.estado)}
          >
            <Text size="xs" c="dimmed">
              {formatFechaHora(item.fecha)}
            </Text>
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
};

export default TrackingTimeline;
