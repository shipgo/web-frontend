import { Avatar, Badge, Checkbox, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import { IconAlertTriangle, IconEdit, IconMapSearch, IconRoute, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useLocation } from 'wouter';

import { timeFromNow, toLocalDate } from '@utils/dates';
import { ESTADOS_VIAJE_CON_TRACKING, estadoBadge, normalizarEstado } from '@domain/estados';
import { RowActionsMenu } from '@components';
import { useAuthStore } from '@stores/auth.store';

import { VIAJE_ESTADOS_EDITABLES } from '../../../constants';
import { ESTADOS_CANCELABLES, puedeCancelar } from '../../DetalleViaje/acciones';
import { useViajeAcciones } from '../../DetalleViaje/hooks/useViajeAcciones';

const showWarning = (item, fecha) =>
  ESTADOS_CANCELABLES.includes(normalizarEstado(item.estado)) &&
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

/**
 * Una fila de la tabla — componente propio (no un `.map()` inline) porque
 * necesita llamar al hook `useViajeAcciones` (confirmación + llamada real de
 * "Cancelar viaje", SHG-FE-096) con el `id` de ESTE viaje; un hook no se puede
 * invocar condicionalmente ni dentro del callback de `.map()`.
 */
const ViajeRow = ({ item, isSelected, onToggle, onCancelSuccess }) => {
  const [, navigate] = useLocation();
  const user = useAuthStore((state) => state.user);
  const estado = normalizarEstado(item.estado);
  const { confirmCancelar } = useViajeAcciones(item.id, { onSuccess: onCancelSuccess });

  const { label: estadoLabel, color: estadoColor, textColor: estadoTextColor } = estadoBadge('viaje', item.estado);
  const fecha = item.fechaHoraInicioPlanificada;
  const cantidadRecorridos = recorridosCount(item);
  const cantidadEnvios = enviosCount(item);

  const actions = [
    { icon: <IconRoute size={18} />, label: 'Ver hoja de ruta', onClick: () => navigate(`/${item.id}`) },
  ];

  if (VIAJE_ESTADOS_EDITABLES.includes(estado)) {
    actions.push({
      icon: <IconEdit size={18} />,
      label: 'Editar viaje',
      onClick: () => navigate(`/${item.id}/editar`),
    });
  }

  if (puedeCancelar(user, estado)) {
    actions.push({
      icon: <IconTrash size={18} />,
      label: 'Cancelar viaje',
      color: 'red',
      dividerBefore: true,
      onClick: confirmCancelar,
    });
  }

  if (ESTADOS_VIAJE_CON_TRACKING.includes(estado)) {
    // Ruta absoluta (`~`): `/mapa` no está anidado bajo `/viajes` (ver
    // `app/routes/index.jsx`). El mapa lee `?viaje=` y preselecciona/centra
    // ese viaje (genérico: lo reusa también SHG-FE-097 desde Envíos).
    actions.push({
      icon: <IconMapSearch size={18} />,
      label: 'Monitorear',
      onClick: () => navigate(`~/mapa?viaje=${item.id}`),
    });
  }

  return (
    // `role="button"` en la fila para que "ver detalle" sea alcanzable con
    // teclado (Enter/Espacio, ver onKeyDown abajo) sin agregar una columna
    // extra. La fila contiene un `Checkbox` y un `RowActionsMenu`, ambos
    // focoables por su cuenta (con su propio `stopPropagation`/`tabIndex`),
    // así que esto es "interactivo anidado dentro de interactivo": un
    // lector de pantalla puede aplanar el contenido no interactivo de las
    // celdas al anunciar la fila como botón. Se acepta como fix rápido de
    // SHG-QA-002 (navegación por teclado funciona, verificado en vivo por
    // el revisor) — un rediseño con un link/botón "Ver detalles" explícito
    // por fila, sin el `role="button"` en el `<tr>`, queda para una tarea
    // SHG-FE de UX si se quiere el patrón ARIA "correcto". Ver PR #75.
    <Table.Tr
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
      bg={isSelected ? 'var(--mantine-color-blue-light)' : undefined}
    >
      <Table.Td onClick={(event) => event.stopPropagation()}>
        <Checkbox
          aria-label={`Seleccionar viaje ${item.id}`}
          checked={isSelected}
          onChange={() => onToggle(item.id)}
        />
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
        {/* `c={estadoTextColor}`: ver `BADGE_TEXT_CONTRAST_OVERRIDE`
            en `@domain/estados` — sin esto, "En camino"/"Finalizado"
            no llegan a 4.5:1 (axe-core `color-contrast`, SHG-FE-041).
            `undefined` para el resto de los estados, sin efecto. */}
        <Badge color={estadoColor} variant="light" radius="md" c={estadoTextColor}>
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
        <RowActionsMenu actions={actions} ariaLabel={`Acciones del viaje ${item.id}`} />
      </Table.Td>
    </Table.Tr>
  );
};

const ListaViajesTabla = ({ items = [], selectedIds, onToggle, onToggleAll, onCancelSuccess }) => {
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <Table.ScrollContainer minWidth={860}>
    <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox
              aria-label="Seleccionar todos los viajes"
              checked={allSelected}
              indeterminate={indeterminate}
              onChange={onToggleAll}
            />
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
        {items.map((item) => (
          <ViajeRow
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
            onToggle={onToggle}
            onCancelSuccess={onCancelSuccess}
          />
        ))}
      </Table.Tbody>
    </Table>
    </Table.ScrollContainer>
  );
};

export default ListaViajesTabla;
