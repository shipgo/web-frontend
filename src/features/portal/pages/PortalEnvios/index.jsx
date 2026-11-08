import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Badge,
  Card,
  Chip,
  Group,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import ScreenContainer from '@components/ScreenContainer';
import { estadoBadge } from '@domain/estados';
import { formatFecha, EMPTY } from '@domain/format';
import { PORTAL_HOME_PATH } from '@domain/roles';
import { REINTENTAR_MAS_TARDE } from '@copy/common';
import { useIsMobile } from '@hooks/useIsMobile';

import { useMisEnvios } from './hooks/useMisEnvios';

/** Fecha de alta = `historialEstado` con `estado === 'creado'` (CONTRACTS.md §4). */
const getFechaAlta = (envio) =>
  (envio.historialEstado ?? []).find((h) => h.estado === 'creado')
    ?.fechaHoraInicio ?? null;

const getDestino = (envio) => {
  const d = envio.destino ?? {};
  const localidad = d.localidad?.nombre;
  const provincia = d.localidad?.provincia?.nombre;
  const partes = [localidad, provincia].filter(Boolean).join(', ');
  return partes || EMPTY;
};

const ESTADOS_EN_CURSO = [
  'creado',
  'en_sucursal',
  'asignado_a_viaje',
  'en_vehiculo',
  'en_camino',
];

/** Filtros por estado del portal: `match` decide a qué grupo pertenece un envío. */
const FILTROS_ESTADO = [
  { value: 'todos', label: 'Todos', match: () => true },
  { value: 'en_curso', label: 'En curso', match: (e) => ESTADOS_EN_CURSO.includes(e.estado) },
  { value: 'entregados', label: 'Entregados', match: (e) => e.estado === 'entregado' },
  // Otros = lo que no es ni "en curso" ni "entregado" (hoy: rechazado).
  {
    value: 'otros',
    label: 'Otros',
    match: (e) => e.estado !== 'entregado' && !ESTADOS_EN_CURSO.includes(e.estado),
  },
];

/**
 * Lista en cards para pantallas angostas (SHG-FE-112): a 390 px la tabla cortaba
 * Destino y truncaba el badge de estado, así que cada envío es una card con
 * código, estado, fecha y destino completos (el texto envuelve, no se corta).
 */
const EnviosCards = ({ envios, onOpen }) => (
  <Stack gap="xs" p="sm" data-testid="portal-envios-cards">
    {envios.map((envio) => {
      const info = estadoBadge('envio', envio.estado);
      const fecha = getFechaAlta(envio);
      const codigo = envio.codigoSeguimiento || null;
      return (
        <Paper
          key={envio.id ?? codigo}
          withBorder
          p="sm"
          style={codigo ? { cursor: 'pointer' } : undefined}
          onClick={codigo ? () => onOpen(codigo) : undefined}
          onKeyDown={
            codigo
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpen(codigo);
                  }
                }
              : undefined
          }
          tabIndex={codigo ? 0 : undefined}
          role={codigo ? 'button' : undefined}
          aria-label={codigo ? `Ver detalle del envío ${codigo}` : undefined}
        >
          <Stack gap={6}>
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
              <Text size="sm" ff="monospace" fw={600}>
                {codigo ?? EMPTY}
              </Text>
              <Badge
                color={info.color}
                variant="light"
                radius="md"
                style={{ overflow: 'visible', maxWidth: '100%' }}
              >
                {info.label}
              </Badge>
            </Group>
            <Text size="sm">
              <Text span c="dimmed">Fecha: </Text>
              {fecha ? formatFecha(fecha) : EMPTY}
            </Text>
            <Text size="sm">
              <Text span c="dimmed">Destino: </Text>
              {getDestino(envio)}
            </Text>
          </Stack>
        </Paper>
      );
    })}
  </Stack>
);

/**
 * `/portal/envios` — lista paginada de los envíos del CUSTOMER logueado.
 * Contrato: `planning/CONTRACTS.md §7` (CONTRACT-007) · backend `SHG-BE-002`
 * (`GET /api/envio/mios`).
 */
const PortalEnviosPage = () => {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  // Breakpoint `sm` de Mantine (48em): por debajo, cards en lugar de tabla.
  const isMobile = useIsMobile();
  const { envios: todos, totalPages, totalElements, isLoading, isError, isFetching, refetch } =
    useMisEnvios(page);

  // Filtro local sobre los envíos ya cargados (página actual; sin tocar el backend).
  const conteos = Object.fromEntries(
    FILTROS_ESTADO.map((f) => [f.value, todos.filter(f.match).length]),
  );
  const termino = busqueda.trim().toLowerCase();
  const filtroActivo = FILTROS_ESTADO.find((f) => f.value === filtro) ?? FILTROS_ESTADO[0];
  const envios = todos.filter(
    (envio) =>
      filtroActivo.match(envio) &&
      (!termino || (envio.codigoSeguimiento ?? '').toLowerCase().includes(termino)),
  );
  const hayDatos = todos.length > 0;
  const sinCoincidencias = hayDatos && envios.length === 0;

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Mis envíos</Title>
        <Text c="dimmed">
          Seguí el estado de todos los envíos asociados a tu email.
        </Text>
      </Stack>

      {hayDatos ? (
        <Stack gap="xs">
          <TextInput
            aria-label="Buscar por código"
            placeholder="Buscar por código"
            size="md"
            leftSection={<IconSearch size={16} />}
            value={busqueda}
            onChange={(event) => setBusqueda(event.currentTarget.value)}
          />
          <Chip.Group multiple={false} value={filtro} onChange={setFiltro}>
            <Group gap="xs">
              {FILTROS_ESTADO.map((f) => (
                <Chip
                  key={f.value}
                  value={f.value}
                  size="md"
                  styles={{ label: { minHeight: 44, display: 'inline-flex', alignItems: 'center' } }}
                >
                  {f.label} ({conteos[f.value]})
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Stack>
      ) : null}

      <Card withBorder padding={envios.length > 0 ? 0 : 'lg'}>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando tus envíos...' }}
          onError={{
            show: isError && !isLoading,
            title: 'No pudimos cargar tus envíos',
            description: REINTENTAR_MAS_TARDE,
            onClick: () => refetch(),
          }}
          onEmptyData={{
            show: !isLoading && !isError && envios.length === 0,
            title: sinCoincidencias ? 'No hay envíos que coincidan' : 'Todavía no tenés envíos',
            description: sinCoincidencias
              ? 'Probá con otro código o cambiá el filtro de estado.'
              : 'Cuando alguien te envíe un paquete o vos generes uno con este email, va a aparecer acá.',
          }}
        >
          {envios.length > 0 && isMobile && (
            <EnviosCards
              envios={envios}
              onOpen={(codigo) => navigate(`~${PORTAL_HOME_PATH}/${codigo}`)}
            />
          )}
          {envios.length > 0 && !isMobile && (
            <Table.ScrollContainer minWidth={480}>
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Código</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Destino</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {envios.map((envio) => {
                    const info = estadoBadge('envio', envio.estado);
                    const fecha = getFechaAlta(envio);
                    // El backend genera `codigoSeguimiento` en el alta; si por lo
                    // que sea falta, la fila no es navegable (el detalle se
                    // consulta por código).
                    const codigo = envio.codigoSeguimiento || null;
                    return (
                      // `role="button"` + `tabIndex`/`onKeyDown` en la fila para
                      // navegación por teclado (SHG-QA-002). A diferencia de
                      // ListaViajesTabla, acá las celdas sólo tienen `Text`/`Badge`
                      // (sin checkbox ni menú de acciones), así que no hay
                      // elementos focoables anidados dentro del botón — no aplica
                      // el trade-off documentado en ese otro componente.
                      <Table.Tr
                        key={envio.id ?? codigo}
                        style={codigo ? { cursor: 'pointer' } : undefined}
                        onClick={
                          codigo
                            ? () => navigate(`~${PORTAL_HOME_PATH}/${codigo}`)
                            : undefined
                        }
                        onKeyDown={
                          codigo
                            ? (event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  navigate(`~${PORTAL_HOME_PATH}/${codigo}`);
                                }
                              }
                            : undefined
                        }
                        tabIndex={codigo ? 0 : undefined}
                        role={codigo ? 'button' : undefined}
                        aria-label={codigo ? `Ver detalle del envío ${codigo}` : undefined}
                      >
                        <Table.Td>
                          <Text size="sm" ff="monospace">
                            {codigo ?? EMPTY}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={info.color} variant="light" radius="md">
                            {info.label}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {fecha ? formatFecha(fecha) : EMPTY}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{getDestino(envio)}</Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </ScreenContainer>
      </Card>

      {totalPages > 1 ? (
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            {totalElements} envío{totalElements === 1 ? '' : 's'}
          </Text>
          <Pagination
            value={page}
            onChange={setPage}
            total={totalPages}
            disabled={isFetching}
            size="sm"
          />
        </Group>
      ) : null}
    </Stack>
  );
};

export default PortalEnviosPage;
