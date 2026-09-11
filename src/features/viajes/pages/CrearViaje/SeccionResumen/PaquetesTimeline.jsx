import {
  IconChevronDown,
  IconChevronUp,
  IconFlag3,
  IconPin,
} from "@tabler/icons-react";
import {
  ActionIcon,
  Card,
  Group,
  ScrollArea,
  Text,
  ThemeIcon,
  Timeline,
} from "@mantine/core";

import { formatFechaHora } from "@domain/format";

/**
 * Paradas reales del viaje: una por cada entrada de `enviosIncluidos`
 * (`groupLabels`/`groupCounts`, ver `SeccionEnvios/utils.getGroupProperties`),
 * en el mismo orden en que se van a mandar como `enviosPuntoEntrega`.
 *
 * `onMoveParada(fromIndex, toIndex)` (`SHG-FE-048`) reordena manualmente vía
 * botones subir/bajar en vez de drag & drop: no había ninguna librería de DnD
 * en el proyecto, y sumar una sólo para esto no valía el riesgo/tamaño de
 * bundle para un caso de uso simple (listas cortas, reordenar de a un lugar
 * por vez alcanza).
 */
const PaquetesTimeline = ({
  groupLabels = [],
  groupCounts = [],
  fechaSalida,
  sucursalOrigen,
  onMoveParada,
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
              title={
                <Group gap="xs" wrap="nowrap" justify="space-between">
                  <Text size="sm" fw={500} truncate>
                    {label}
                  </Text>
                  <Group gap={2} wrap="nowrap">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      disabled={index === 0}
                      aria-label={`Subir parada ${index + 1}`}
                      onClick={() => onMoveParada(index, index - 1)}
                    >
                      <IconChevronUp size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="gray"
                      disabled={index === groupLabels.length - 1}
                      aria-label={`Bajar parada ${index + 1}`}
                      onClick={() => onMoveParada(index, index + 1)}
                    >
                      <IconChevronDown size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              }
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
