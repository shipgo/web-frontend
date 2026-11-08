import { Accordion, Card, Stack, Text, Timeline, Title } from '@mantine/core';
import { IconCircleDot } from '@tabler/icons-react';

import { estadoBadge, estadoLabel } from '@domain/estados';
import { formatFechaHora } from '@domain/format';
import { useIsMobile } from '@hooks/useIsMobile';

const fechaDe = (item) => item.fechaHoraInicio ?? item.fecha;

const HistorialTimeline = ({ historial = [] }) => {
  const isMobile = useIsMobile();
  const ordenado = [...historial].sort((a, b) => new Date(fechaDe(a)) - new Date(fechaDe(b)));

  const contenido =
    ordenado.length === 0 ? (
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
    );

  // Mobile: sección plegable (cerrada) para no alargar la pantalla.
  if (isMobile) {
    return (
      <Accordion variant="separated">
        <Accordion.Item value="historial">
          <Accordion.Control>
            <Title order={4}>Historial de estados</Title>
          </Accordion.Control>
          <Accordion.Panel>{contenido}</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    );
  }

  return (
    <Card>
      <Stack gap="md">
        <Title order={4}>Historial de estados</Title>
        {contenido}
      </Stack>
    </Card>
  );
};

export default HistorialTimeline;
