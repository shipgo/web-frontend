import { Avatar, Badge, Checkbox, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import {
  IconAlertTriangle,
  IconEdit,
  IconMapSearch,
  IconMessageReport,
  IconRoute,
  IconTrash,
  IconUserX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useLocation } from 'wouter';

import { timeFromNow, toLocalDate } from '@utils/dates';
import { estadoBadge, normalizarEstado } from '@domain/estados';
import { RowActionsMenu } from '@components';

// Fases en las que el viaje todavía se puede editar/cancelar desde acá.
const ESTADOS_EDITABLES = ['creado', 'planificado', 'en_proceso_de_carga'];
// Fases "en ruta": tiene sentido monitorear / reportar un incidente.
const ESTADOS_EN_RUTA = ['en_camino', 'con_problemas'];

const getActionsForRow = (estado, { onEditar } = {}) => {
  const valor = normalizarEstado(estado);
  const actions = [{ icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' }];

  if (ESTADOS_EDITABLES.includes(valor)) {
    actions.push({ icon: <IconEdit size={18} />, label: 'Editar viaje', onClick: onEditar });
    if (valor === 'en_proceso_de_carga') {
      actions.push({ icon: <IconUserX size={18} />, label: 'Desvincular chofer' });
    }
    actions.push({ icon: <IconTrash size={18} />, label: 'Cancelar viaje', color: 'red', dividerBefore: true });
  }

  if (ESTADOS_EN_RUTA.includes(valor)) {
    actions.push(
      { icon: <IconMapSearch size={18} />, label: 'Monitorear' },
      { icon: <IconMessageReport size={18} />, label: 'Reportar incidente' },
    );
  }

  return actions;
};

const showWarning = (item, fecha) =>
  ESTADOS_EDITABLES.includes(normalizarEstado(item.estado)) &&
  !!fecha &&
  dayjs(fecha).isBefore(dayjs());

const nombreCompleto = (persona) =>
  persona?.nombre && persona?.apellido
    ? `${persona.nombre} ${persona.apellido}`
    : persona?.nombre || persona?.username || 'Sin nombre';

const ChoferCell = ({ chofer, choferes = [] }) => {
  if (chofer) {
    return (
      <Group gap="0.5rem" wrap="nowrap">
        <Avatar name={nombreCompleto(chofer)} color="initials" size="sm" />
        <Text size="sm">{nombreCompleto(chofer)}</Text>
      </Group>
    );
  }

  if (choferes.length > 0) {
    return (
      <Stack gap={0}>
        <Text size="sm">{nombreCompleto(choferes[0])}</Text>
        {choferes.length > 1 && (
          <Text size="xs" c="dimmed">+{choferes.length - 1} más</Text>
        )}
      </Stack>
    );
  }

  return <Text size="sm" c="dimmed">Sin chofer asignado</Text>;
};

const recorridosCount = (item) => item.recorridos?.length ?? 0;
const enviosCount = (item) =>
  item.recorridos?.reduce((total, recorrido) => total + (recorrido.detalleRecorridos?.length ?? 0), 0) ?? 0;

const ListaViajesTabla = ({ items = [], selectedIds, onToggle, onToggleAll }) => {
  const [, navigate] = useLocation();
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <Table.ScrollContainer minWidth={860}>
    <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={onToggleAll} />
          </Table.Th>
          <Table.Th>ID Viaje</Table.Th>
          <Table.Th>Fecha planificada</Table.Th>
          <Table.Th>Estado</Table.Th>
          <Table.Th>Chofer</Table.Th>
          <Table.Th>Vehículo</Table.Th>
          <Table.Th>Recorridos / Envíos</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map((item) => {
          const { label: estadoLabel, color: estadoColor } = estadoBadge('viaje', item.estado);
          const fecha = item.fechaHoraInicioPlanificada;
          const cantidadRecorridos = recorridosCount(item);
          const cantidadEnvios = enviosCount(item);

          return (
            <Table.Tr
              key={item.id}
              onClick={() => navigate(`/${item.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/${item.id}`);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Ver detalle del viaje ${item.id}`}
              style={{ cursor: 'pointer' }}
              bg={selectedIds.has(item.id) ? 'var(--mantine-color-blue-light)' : undefined}
            >
              <Table.Td onClick={(event) => event.stopPropagation()}>
                <Checkbox checked={selectedIds.has(item.id)} onChange={() => onToggle(item.id)} />
              </Table.Td>

              <Table.Td>{item.id}</Table.Td>

              <Table.Td>
                <Group gap="xs" align="center" wrap="nowrap">
                  <Stack gap="0">
                    <Text size="sm">{toLocalDate(fecha)}</Text>
                    <Text size="xs" fw="bold">{timeFromNow(fecha)}</Text>
                  </Stack>
                  {showWarning(item, fecha) && (
                    <Tooltip withArrow label="Viaje retrasado">
                      <IconAlertTriangle size={20} color="orange" />
                    </Tooltip>
                  )}
                </Group>
              </Table.Td>

              <Table.Td>
                <Badge color={estadoColor} variant="light" radius="md">
                  {estadoLabel}
                </Badge>
              </Table.Td>

              <Table.Td>
                <ChoferCell chofer={item.chofer} choferes={item.choferes} />
              </Table.Td>

              <Table.Td>
                <Text size="sm" fw={600}>{item.vehiculo?.patente || 'Sin vehículo'}</Text>
              </Table.Td>

              <Table.Td>
                <Text size="sm">
                  {cantidadRecorridos} recorrido{cantidadRecorridos === 1 ? '' : 's'} · {cantidadEnvios} envío{cantidadEnvios === 1 ? '' : 's'}
                </Text>
              </Table.Td>

              <Table.Td onClick={(event) => event.stopPropagation()}>
                <RowActionsMenu
                  actions={getActionsForRow(item.estado, {
                    onEditar: () => navigate(`/${item.id}/editar`),
                  })}
                  ariaLabel={`Acciones del viaje ${item.id}`}
                />
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
    </Table.ScrollContainer>
  );
};

export default ListaViajesTabla;
