import { Badge, Card, Group, Stack, Table, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import ScreenContainer from '@components/ScreenContainer';
import { IconAlertCircle } from '@tabler/icons-react';

const INCIDENCIAS = [
  { ref: 'V-103', descripcion: 'Vehículo averiado en ruta', tipo: 'crítica' },
  { ref: 'E-044', descripcion: 'Dirección incorrecta', tipo: 'moderada' },
  { ref: 'E-078', descripcion: 'Cliente ausente al momento de entrega', tipo: 'leve' },
  { ref: 'V-097', descripcion: 'Retraso por tráfico en acceso sur', tipo: 'moderada' },
  { ref: 'E-031', descripcion: 'Paquete dañado en tránsito', tipo: 'crítica' },
];

const TIPO_COLOR = {
  crítica: 'red',
  moderada: 'orange',
  leve: 'yellow',
};

const IncidenciasTable = ({ periodoLabel, isLoading }) => (
  <Card h="100%">
    <Group gap="xs" mb="md">
      <ThemeIcon variant="light" color="red" size="xl">
        <IconAlertCircle />
      </ThemeIcon>
      <Stack gap={0}>
        <Group gap={4} align="center">
          <Text size="sm" fw={600}>Incidencias recientes</Text>
          <Tooltip label="Las 5 incidencias más recientes del período, ordenadas por criticidad." withArrow>
            <IconInfoCircle size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
          </Tooltip>
        </Group>
        <Text size="xs" c="dimmed">Top 5 · {periodoLabel}</Text>
      </Stack>
    </Group>
    <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Referencia</Table.Th>
            <Table.Th>Descripción</Table.Th>
            <Table.Th>Tipo</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {INCIDENCIAS.map((inc) => (
            <Table.Tr key={inc.ref}>
              <Table.Td>
                <Text size="xs" fw={600}>{inc.ref}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs">{inc.descripcion}</Text>
              </Table.Td>
              <Table.Td>
                <Badge size="xs" color={TIPO_COLOR[inc.tipo]} variant="light">
                  {inc.tipo}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScreenContainer>
  </Card>
);

export default IncidenciasTable;
