import { Link, useParams } from 'wouter';
import { Anchor, Button, Center, Group, Loader, Stack, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';

import {
  usePublicTracking,
  TrackingResultado,
  TrackingErrorAlert,
  normalizarCodigo,
} from '@features/tracking';
import { PORTAL_HOME_PATH } from '@domain/roles';

// `~` = ruta absoluta desde la raíz (esta pantalla vive dentro del nest `/portal`).
const VOLVER_HREF = `~${PORTAL_HOME_PATH}`;

/**
 * `/portal/envios/:codigo` — detalle de un envío del CUSTOMER: timeline +
 * tracking. Contrato: `planning/CONTRACTS.md §7` (CONTRACT-007).
 *
 * Decisión (bitácora SHG-FE-026): **no hay endpoint de detalle propio para
 * CUSTOMER**. El detalle se arma con `usePublicTracking(codigo)`, es decir el
 * mismo `GET /api/public/tracking/{codigo}` que usa el guest (endpoint público;
 * el customer llega autenticado pero no hace falta). Se reutilizan los
 * componentes de `SHG-FE-025` (`TrackingResultado`, `TrackingErrorAlert`).
 */
const PortalEnvioDetallePage = () => {
  const { codigo: codigoParam } = useParams();
  const codigo = codigoParam ? normalizarCodigo(codigoParam) : '';

  const { data, isLoading, isFetching, errorKind, refetch } =
    usePublicTracking(codigo);

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Anchor component={Link} href={VOLVER_HREF} size="sm">
          <Group gap={4} wrap="nowrap">
            <IconArrowLeft size={16} />
            Volver a mis envíos
          </Group>
        </Anchor>
      </Group>

      <Title order={2}>Envío {codigo}</Title>

      {isLoading || (isFetching && !data) ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : errorKind ? (
        <Stack gap="md">
          <TrackingErrorAlert kind={errorKind} onRetry={() => refetch()} />
          <Button
            component={Link}
            href={VOLVER_HREF}
            variant="light"
            w="fit-content"
          >
            Volver a mis envíos
          </Button>
        </Stack>
      ) : data ? (
        <TrackingResultado data={data} />
      ) : null}
    </Stack>
  );
};

export default PortalEnvioDetallePage;
