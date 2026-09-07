import { useMemo } from 'react';
import { Link, useSearch } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClockExclamation,
} from '@tabler/icons-react';

import { registroApi } from '../../api/portal.api';

/**
 * Verificación de email del CUSTOMER (`/registro/verificar?token=...`).
 * Contrato: `planning/CONTRACTS.md §7` (CONTRACT-007) · backend `SHG-BE-002`
 * (`GET /api/register/verify?token=...`).
 *
 * El link lo arma el backend con `<app.frontend-url>/registro/verificar?token=`
 * (path acordado en `coordination/frontend.md`, ver bitácora de SHG-FE-026).
 *
 * Estados: verificando · verificada (iniciá sesión) · token inválido (404) ·
 * token expirado (400).
 */
const clasificar = (error) => {
  const status = error?.response?.status;
  if (status === 404) return 'invalido';
  if (status === 400) return 'expirado';
  return 'error';
};

const VerificarCuentaPage = () => {
  const search = useSearch();
  const token = useMemo(
    () => new URLSearchParams(search).get('token') ?? '',
    [search],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['register-verify', token],
    queryFn: () => registroApi.verify(token),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return (
      <Stack gap="lg" maw={520} mx="auto">
        <Alert
          color="yellow"
          variant="light"
          icon={<IconAlertTriangle size={20} />}
          title="Enlace incompleto"
        >
          El enlace de verificación no es válido. Revisá que hayas copiado la URL
          completa del email.
        </Alert>
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Center py="xl">
        <Loader />
      </Center>
    );
  }

  if (isError) {
    const kind = clasificar(error);
    const cfg =
      kind === 'invalido'
        ? {
            color: 'red',
            icon: <IconAlertTriangle size={20} />,
            title: 'Enlace inválido',
            body: 'No encontramos una verificación para este enlace. Puede que ya lo hayas usado.',
          }
        : kind === 'expirado'
          ? {
              color: 'orange',
              icon: <IconClockExclamation size={20} />,
              title: 'El enlace venció',
              body: 'El enlace de verificación vence a las 24 horas. Registrate de nuevo para recibir uno nuevo.',
            }
          : {
              color: 'red',
              icon: <IconAlertTriangle size={20} />,
              title: 'No pudimos verificar tu cuenta',
              body: 'Ocurrió un error al verificar tu cuenta. Intentá nuevamente en unos minutos.',
            };

    return (
      <Stack gap="lg" maw={520} mx="auto">
        <Alert color={cfg.color} variant="light" icon={cfg.icon} title={cfg.title}>
          {cfg.body}
        </Alert>
        <Group justify="center">
          <Anchor component={Link} href="/registro">
            Volver al registro
          </Anchor>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" maw={520} mx="auto" align="center">
      <Alert
        color="teal"
        variant="light"
        icon={<IconCircleCheck size={20} />}
        title="Cuenta verificada"
        w="100%"
      >
        {data?.mensaje ||
          'Tu cuenta quedó verificada. Ya podés iniciar sesión y ver tus envíos.'}
      </Alert>
      <Button component={Link} href="/login">
        Iniciar sesión
      </Button>
      <Text size="sm" c="dimmed">
        ¿Sólo querés seguir un envío puntual?{' '}
        <Anchor component={Link} href="/tracking">
          Seguí tu envío sin cuenta
        </Anchor>
      </Text>
    </Stack>
  );
};

export default VerificarCuentaPage;
