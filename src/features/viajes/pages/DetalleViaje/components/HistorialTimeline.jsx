import { Card, Stack, Text, Timeline, Title } from '@mantine/core';
import { IconCircleDot } from '@tabler/icons-react';

import { estadoBadge, estadoLabel } from '@domain/estados';
import { formatFechaHora } from '@domain/format';

const fechaDe = (item) => item.fechaHoraInicio ?? item.fecha;

const HistorialTimeline = ({ historial = [] }) => {
  const ordenado = [...historial].sort((a, b) => new Date(fechaDe(a)) - new Date(fechaDe(b)));

  return (
    <Card>
      <Stack gap="md">
        <Title order={4}>Historial de estados</Title>
        {ordenado.length === 0 ? (
          <Text size="sm" c="dimmed">
            Este viaje todavía no tiene historial de estados.
          </Text>
        ) : (
          <Timeline active={ordenado.length - 1} bulletSize={22} lineWidth={2}>
            {ordenado.map((item, index) => {
              const { color } = estadoBadge('viaje', item.estado);
              return (
                <Timeline.Item
                  key={item.id ?? index}
                  bullet={<IconCircleDot size={14} />}
                  color={color}
                  title={estadoLabel('viaje', item.estado)}
                >
                  <Text size="xs" c="dimmed">
                    {formatFechaHora(fechaDe(item))}
                  </Text>
                  {item.motivo && (
                    <Text size="sm" mt={2}>
                      {item.motivo}
                    </Text>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </Stack>
    </Card>
  );
};

export default HistorialTimeline;
