import { Badge, Card, Group, Stack, Table, Text, Title } from '@mantine/core';
import { IconBuilding, IconMapPin } from '@tabler/icons-react';

import { estadoBadge } from '@domain/estados';
import { formatDireccion, formatPeso } from '@domain/format';

/** `puntoEntrega` y `sucursalDestino` son XOR (ver CONTRACTS.md §8). */
const destinoDe = (recorrido) => {
  if (recorrido.puntoEntrega) {
    return {
      icon: <IconMapPin size={16} />,
      label: formatDireccion(recorrido.puntoEntrega, { completa: true }),
    };
  }
  if (recorrido.sucursalDestino) {
    const direccion = recorrido.sucursalDestino.puntoEntrega
      ? formatDireccion(recorrido.sucursalDestino.puntoEntrega, { completa: true })
      : null;
    return {
      icon: <IconBuilding size={16} />,
      label: [`Sucursal: ${recorrido.sucursalDestino.nombre ?? '—'}`, direccion].filter(Boolean).join(' · '),
    };
  }
  return { icon: <IconMapPin size={16} />, label: '—' };
};

const pesoEnvio = (envio) => {
  const detalle = envio?.detalleEnvios ?? [];
  if (!detalle.length) return null;
  return detalle.reduce((sum, d) => sum + (d.peso ?? 0), 0);
};

const destinatarioDe = (envio) => [envio?.nombre, envio?.apellido].filter(Boolean).join(' ') || '—';

const RecorridoCard = ({ recorrido }) => {
  const estadoInfo = estadoBadge('recorrido', recorrido.estado);
  const destino = destinoDe(recorrido);
  const envios = recorrido.detalleRecorridos ?? [];

  return (
    <Card withBorder shadow="sm" p="lg">
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <Text fw={600}>Recorrido #{recorrido.orden ?? '—'}</Text>
            <Badge color={estadoInfo.color} variant="light">
              {estadoInfo.label}
            </Badge>
          </Group>
        </Group>

        <Group gap="xs">
          {destino.icon}
          <Text size="sm">{destino.label}</Text>
        </Group>

        {envios.length === 0 ? (
          <Text size="sm" c="dimmed">
            Este recorrido no tiene envíos cargados.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Código de seguimiento</Table.Th>
                <Table.Th>Destinatario</Table.Th>
                <Table.Th>Peso</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {envios.map((detalle) => (
                <Table.Tr key={detalle.id ?? detalle.envio?.id}>
                  <Table.Td>{detalle.envio?.codigoSeguimiento ?? '—'}</Table.Td>
                  <Table.Td>{destinatarioDe(detalle.envio)}</Table.Td>
                  <Table.Td>{formatPeso(pesoEnvio(detalle.envio))}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Card>
  );
};

const RecorridosList = ({ recorridos = [] }) => {
  const ordenados = [...recorridos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return (
    <Card>
      <Stack gap="md">
        <Title order={4}>Recorridos</Title>
        {ordenados.length === 0 ? (
          <Text size="sm" c="dimmed">
            Este viaje no tiene recorridos cargados.
          </Text>
        ) : (
          <Stack gap="md">
            {ordenados.map((recorrido) => (
              <RecorridoCard key={recorrido.id ?? recorrido.orden} recorrido={recorrido} />
            ))}
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

export default RecorridosList;
