import { useState } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import {
  Alert,
  Anchor,
  Card,
  Center,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

import { useCaptcha } from '@hooks/useCaptcha';
import CaptchaField from '@components/CaptchaField';
import { usePublicTracking } from '../../hooks/usePublicTracking';
import { codigoEsValido, CODIGO_INVALIDO_MSG, normalizarCodigo } from '../../utils';
import TrackingSearchForm from '../../components/TrackingSearchForm';
import TrackingResultado from '../../components/TrackingResultado';
import TrackingErrorAlert from '../../components/TrackingErrorAlert';

/**
 * Vista pública (guest) de tracking por código de seguimiento.
 * Rutas: `/tracking` (input) y `/tracking/:codigo` (autoconsulta).
 * Contrato: `planning/CONTRACTS.md §7` (CONTRACT-007) · backend `SHG-BE-001`.
 */
const TrackingPublicoPage = () => {
  const { codigo: codigoParam } = useParams();
  const [, setLocation] = useLocation();

  const codigoNormalizado = codigoParam ? normalizarCodigo(codigoParam) : '';
  const codigoValido = codigoParam ? codigoEsValido(codigoParam) : false;

  const captcha = useCaptcha();
  const { data, isLoading, isFetching, errorKind, refetch } = usePublicTracking(
    codigoNormalizado,
    { enabled: codigoValido, captchaToken: captcha.token },
  );

  // Una búsqueda inválida (formato) no navega: sin esto el resultado de la
  // búsqueda anterior quedaría visible debajo del error (SHG-FE-112).
  // No es un estado que sólo limpie el submit: se resetea cuando cambia el código
  // de la ruta (botón "atrás", links a otro /tracking/XXX).
  const [busquedaInvalida, setBusquedaInvalida] = useState(false);
  const [codigoPrevio, setCodigoPrevio] = useState(codigoParam);
  if (codigoPrevio !== codigoParam) {
    setCodigoPrevio(codigoParam);
    setBusquedaInvalida(false);
  }

  const handleSubmit = (codigo) => {
    setBusquedaInvalida(false);
    setLocation(`/tracking/${codigo}`);
  };

  const handleRetry = () => {
    if (errorKind === 'captcha_invalid') {
      captcha.reset();
    }
    refetch();
  };

  const consultando =
    codigoValido && Boolean(captcha.token) && (isLoading || isFetching) && !data;

  return (
    <Stack gap="xl">
      <Stack gap={4}>
        <Title order={2}>Seguí tu envío</Title>
        <Text c="dimmed">
          Ingresá el código de seguimiento para ver el estado de tu envío.
        </Text>
      </Stack>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <TrackingSearchForm
            initialValue={codigoNormalizado}
            onSubmit={handleSubmit}
            onInvalid={() => setBusquedaInvalida(true)}
            loading={consultando}
            disabled={!captcha.token}
          />
          <CaptchaField captcha={captcha} />
        </Stack>
      </Card>

      {codigoParam && !codigoValido ? (
        <Alert
          color="yellow"
          variant="light"
          icon={<IconAlertCircle size={18} />}
          title="Código inválido"
        >
          {CODIGO_INVALIDO_MSG}
        </Alert>
      ) : null}

      {consultando && !busquedaInvalida ? (
        <Center py="xl">
          <Loader />
        </Center>
      ) : null}

      {codigoValido && !busquedaInvalida && !consultando && errorKind ? (
        <TrackingErrorAlert kind={errorKind} onRetry={handleRetry} />
      ) : null}

      {data && !busquedaInvalida ? <TrackingResultado data={data} /> : null}

      <Text size="sm" c="dimmed" ta="center">
        ¿Sos cliente y querés ver todos tus envíos?{' '}
        {/* `/registro` = portal CUSTOMER (SHG-FE-026). */}
        <Anchor component={Link} href="/registro">
          Creá tu cuenta
        </Anchor>
      </Text>
    </Stack>
  );
};

export default TrackingPublicoPage;
