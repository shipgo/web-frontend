import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Badge,
  Card,
  Group,
  Pagination,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';

import ScreenContainer from '@components/ScreenContainer';
import { estadoBadge } from '@domain/estados';
import { formatFecha, EMPTY } from '@domain/format';
import { PORTAL_HOME_PATH } from '@domain/roles';

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

/**
 * `/portal/envios` — lista paginada de los envíos del CUSTOMER logueado.
 * Contrato: `planning/CONTRACTS.md §7` (CONTRACT-007) · backend `SHG-BE-002`
 * (`GET /api/envio/mios`).
 */
const PortalEnviosPage = () => {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const { envios, totalPages, totalElements, isLoading, isError, isFetching, refetch } =
    useMisEnvios(page);

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Mis envíos</Title>
        <Text c="dimmed">
          Seguí el estado de todos los envíos asociados a tu email.
        </Text>
      </Stack>

      <Card withBorder padding={envios.length > 0 ? 0 : 'lg'}>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando tus envíos...' }}
          onError={{
            show: isError && !isLoading,
            title: 'No pudimos cargar tus envíos',
            description: 'Ocurrió un error al traer tus envíos. Intentá nuevamente en unos minutos.',
            onClick: () => refetch(),
          }}
          onEmptyData={{
            show: !isLoading && !isError && envios.length === 0,
            title: 'Todavía no tenés envíos',
            description: 'Cuando alguien te envíe un paquete o vos generes uno con este email, va a aparecer acá.',
          }}
        >
          {envios.length > 0 && (
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
