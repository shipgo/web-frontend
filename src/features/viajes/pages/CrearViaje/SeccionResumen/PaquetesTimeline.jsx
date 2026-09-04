import { IconFlag3, IconPin } from "@tabler/icons-react";
import { Card, ScrollArea, Text, ThemeIcon, Timeline } from "@mantine/core";

import { formatFechaHora } from "@domain/format";

/**
 * Paradas reales del viaje: una por cada entrada de `enviosIncluidos`
 * (`groupLabels`/`groupCounts`, ver `SeccionEnvios/utils.getGroupProperties`),
 * en el mismo orden en que se van a mandar como `enviosPuntoEntrega`.
 */
const PaquetesTimeline = ({
  groupLabels = [],
  groupCounts = [],
  fechaSalida,
  sucursalOrigen,
}) => {
  return (
    <Card withBorder shadow="0" p="0" h={400} maw="35%">
      <ScrollArea flex={1}>
        <Timeline bulletSize={24} lineWidth={2} m="md">
          <Timeline.Item
            bullet={
              <ThemeIcon size={22} bg="white" radius="xl">
                <IconFlag3 size={13} color="black" />
              </ThemeIcon>
            }
            title="Salida"
          >
            <Text c="dimmed" size="sm">
              {sucursalOrigen ?? "Sucursal de origen"}
            </Text>
            <Text size="xs" mt={4}>
              {fechaSalida
                ? `(${formatFechaHora(fechaSalida)} planificado)`
                : "(sin fecha planificada todavía)"}
            </Text>
          </Timeline.Item>

          {groupLabels.length === 0 && (
            <Timeline.Item bullet={<IconPin size={12} />} title="Sin paradas">
              <Text c="dimmed" size="sm">
                Seleccioná envíos en la sección de arriba para ver las paradas
                del viaje
              </Text>
            </Timeline.Item>
          )}

          {groupLabels.map((label, index) => (
            <Timeline.Item
              key={`${label}-${index}`}
              bullet={<IconPin size={12} />}
              title={label}
            >
              <Text c="dimmed" size="sm">
                ({groupCounts[index]}{" "}
                {groupCounts[index] === 1 ? "envío" : "envíos"})
              </Text>
            </Timeline.Item>
          ))}
        </Timeline>
      </ScrollArea>
    </Card>
  );
};

export default PaquetesTimeline;
