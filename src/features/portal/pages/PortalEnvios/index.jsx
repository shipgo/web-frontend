import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Alert,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Pagination,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertTriangle, IconPackageOff } from '@tabler/icons-react';

import { estadoBadge } from '@domain/estados';
import { formatFecha, EMPTY } from '@domain/format';

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
  const { envios, totalPages, totalElements, isLoading, isError, isFetching } =
    useMisEnvios(page);

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Mis envíos</Title>
        <Text c="dimmed">
          Seguí el estado de todos los envíos asociados a tu email.
        </Text>
      </Stack>

      {isLoading ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : isError ? (
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertTriangle size={20} />}
          title="No pudimos cargar tus envíos"
        >
          Ocurrió un error al traer tus envíos. Intentá nuevamente en unos
          minutos.
        </Alert>
      ) : envios.length === 0 ? (
        <Alert
          color="gray"
          variant="light"
          icon={<IconPackageOff size={20} />}
          title="Todavía no tenés envíos"
        >
          Cuando alguien te envíe un paquete o vos generes uno con este email, va
          a aparecer acá.
        </Alert>
      ) : (
        <Card withBorder padding={0}>
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
                  return (
                    <Table.Tr
                      key={envio.id ?? envio.codigoSeguimiento}
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        navigate(`~/portal/envios/${envio.codigoSeguimiento}`)
                      }
                    >
                      <Table.Td>
                        <Text size="sm" ff="monospace">
                          {envio.codigoSeguimiento}
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
        </Card>
      )}

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
