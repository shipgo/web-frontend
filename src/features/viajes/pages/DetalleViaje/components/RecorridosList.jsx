import { Accordion, Badge, Card, Group, Stack, Table, Text, Title } from '@mantine/core';
import { IconBuilding, IconMapPin } from '@tabler/icons-react';

import { estadoBadge } from '@domain/estados';
import { formatDireccion, formatPeso } from '@domain/format';
import { useIsMobile } from '@hooks/useIsMobile';

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

const EstadoBadge = ({ recorrido }) => {
  const estadoInfo = estadoBadge('recorrido', recorrido.estado);
  return (
    /* `c={estadoInfo.textColor}`: ver `BADGE_TEXT_CONTRAST_OVERRIDE` en `@domain/estados`
       (contraste 4.5:1, SHG-FE-041). */
    <Badge color={estadoInfo.color} variant="light" c={estadoInfo.textColor}>
      {estadoInfo.label}
    </Badge>
  );
};

/** Envíos de la parada: tabla en escritorio, lista apilada en mobile (sin scroll horizontal). */
const EnviosParada = ({ envios, isMobile }) => {
  if (envios.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Esta parada no tiene envíos cargados.
      </Text>
    );
  }

  if (isMobile) {
    return (
      <Stack gap="xs">
        {envios.map((detalle) => (
          <Stack key={detalle.id ?? detalle.envio?.id} gap={0}>
            <Text size="sm" fw={600} ff="monospace">{detalle.envio?.codigoSeguimiento ?? '—'}</Text>
            <Text size="sm" c="dimmed">
              {destinatarioDe(detalle.envio)} · {formatPeso(pesoEnvio(detalle.envio))}
            </Text>
          </Stack>
        ))}
      </Stack>
    );
  }

  return (
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
  );
};

const RecorridoCard = ({ recorrido }) => {
  const destino = destinoDe(recorrido);
  const envios = recorrido.detalleRecorridos ?? [];

  return (
    <Card withBorder shadow="sm" p="lg">
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <Text fw={600}>Parada {recorrido.orden ?? '—'}</Text>
            <EstadoBadge recorrido={recorrido} />
          </Group>
        </Group>

        <Group gap="xs">
          {destino.icon}
          <Text size="sm">{destino.label}</Text>
        </Group>

        <EnviosParada envios={envios} isMobile={false} />
      </Stack>
    </Card>
  );
};

/** Mobile: paradas plegables, la primera abierta. */
const RecorridosAcordeon = ({ recorridos }) => (
  <Accordion
    multiple
    variant="separated"
    defaultValue={[String(recorridos[0].id ?? recorridos[0].orden)]}
  >
    {recorridos.map((recorrido) => {
      const destino = destinoDe(recorrido);
      const envios = recorrido.detalleRecorridos ?? [];
      return (
        <Accordion.Item key={recorrido.id ?? recorrido.orden} value={String(recorrido.id ?? recorrido.orden)}>
          <Accordion.Control>
            <Group gap="xs" wrap="nowrap">
              <Text fw={600}>Parada {recorrido.orden ?? '—'}</Text>
              <EstadoBadge recorrido={recorrido} />
              <Text size="xs" c="dimmed">{envios.length} envío{envios.length === 1 ? '' : 's'}</Text>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="sm">
              <Group gap="xs" wrap="nowrap" align="flex-start">
                {destino.icon}
                <Text size="sm">{destino.label}</Text>
              </Group>
              <EnviosParada envios={envios} isMobile />
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      );
    })}
  </Accordion>
);

const RecorridosList = ({ recorridos = [] }) => {
  const isMobile = useIsMobile();
  const ordenados = [...recorridos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return (
    <Card>
      <Stack gap="md">
        <Title order={4}>Paradas</Title>
        {ordenados.length === 0 ? (
          <Text size="sm" c="dimmed">
            Este viaje no tiene paradas cargadas.
          </Text>
        ) : isMobile ? (
          <RecorridosAcordeon recorridos={ordenados} />
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
