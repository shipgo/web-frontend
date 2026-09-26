import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm, schemaResolver } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconDeviceFloppy, IconX } from '@tabler/icons-react';

import ScreenContainer from '@components/ScreenContainer';
import { applyApiError } from '@domain/apiError';
import { useAuthStore } from '@stores/auth.store';

// Reuso del card de cambio de contraseña propia (`POST /api/changePassword`):
// componente compartido (`src/app/components`, CLAUDE.md) — no depende de
// nada específico de un feature, sólo del usuario logueado en `auth.store`
// (ver JSDoc del componente) — habilitado para CUSTOMER desde `SHG-BE-074`,
// junto con el `PUT /api/customer/me` de esta pantalla.
import CambiarPasswordCard from '@components/CambiarPasswordCard';

import { portalApi } from '../../api/portal.api';
import { useMiPerfil, MI_PERFIL_QUERY_KEY } from './hooks/useMiPerfil';
import { MI_PERFIL_SCHEMA, MI_PERFIL_INITIAL_VALUES } from './constants/schema';

/**
 * `/portal/perfil` — datos del CUSTOMER logueado (`SHG-FE-102`).
 * Contrato: `ENDPOINTS.md` Anexo 2026-09-25, tabla `/api/customer`
 * (`SHG-CONTRACT-016`) · backend `SHG-BE-024` (GET) / `SHG-BE-074` (PUT).
 *
 * `email`/`emailVerificado` son de sólo lectura (no hay cambio de email,
 * fuera de alcance de esta tarea). `nombre`/`apellido`/`telefono` se editan
 * acá; los tres son obligatorios del lado del backend.
 */
const MiPerfilPage = () => {
  const queryClient = useQueryClient();
  const getUserInfo = useAuthStore((state) => state.getUserInfo);
  const { data, isLoading, isError, refetch } = useMiPerfil();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: MI_PERFIL_INITIAL_VALUES,
    validate: schemaResolver(MI_PERFIL_SCHEMA, { sync: true }),
  });

  // Sincroniza el form con la respuesta del `GET` (y con lo que devuelva el
  // `PUT` al guardar, vía `queryClient.setQueryData`).
  useEffect(() => {
    if (!data) return;
    form.setValues({
      nombre: data.nombre ?? '',
      apellido: data.apellido ?? '',
      telefono: data.telefono ?? '',
    });
    form.resetDirty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);
    try {
      const updated = await portalApi.updateMe({
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        telefono: values.telefono.trim(),
      });
      queryClient.setQueryData(MI_PERFIL_QUERY_KEY, updated);

      notifications.show({
        title: 'Perfil actualizado',
        message: 'Tus datos se guardaron correctamente.',
        color: 'green',
        icon: <IconCheck />,
      });

      // El nombre visible en `PortalLayout` (menú de la cuenta) sale de
      // `auth.store`, no de esta query: hay que refrescarlo aparte. Reusa el
      // mismo fallback `GET /api/customer/me` que ya arma `getUserInfo()`
      // para un CUSTOMER (`WHOAMI_URL` le da `403`), así no duplicamos acá la
      // lógica de armar el `Usuario` con `authorities: [ROLE_CUSTOMER]`.
      // Best-effort y FUERA del try del PUT: el guardado ya fue exitoso (y ya
      // se avisó), así que si esto falla no hay que mostrar un error — sólo
      // loguearlo. El nombre del header queda desactualizado hasta el
      // próximo refresh, pero eso no es un error del usuario.
      try {
        await getUserInfo();
      } catch (refreshError) {
        console.error('No se pudo refrescar auth.store tras guardar el perfil:', refreshError);
      }
    } catch (error) {
      const message = applyApiError(form, error, {
        fallbackMessage: 'No se pudieron guardar los cambios. Intentá nuevamente.',
      });
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
        icon: <IconX />,
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Stack gap="lg" maw={640} mx="auto">
      <Stack gap={4}>
        <Title order={2}>Mi perfil</Title>
        <Text c="dimmed">Revisá y editá tus datos de contacto.</Text>
      </Stack>

      <Card withBorder padding="lg">
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando tus datos...' }}
          onError={{
            show: isError && !isLoading,
            title: 'No pudimos cargar tu perfil',
            description: 'Ocurrió un error al traer tus datos. Intentá nuevamente en unos minutos.',
            onClick: () => refetch(),
          }}
        >
          {data && (
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <TextInput
                    label="Email"
                    value={data.email ?? ''}
                    disabled
                    readOnly
                    flex={1}
                  />
                  <Badge
                    mt={22}
                    color={data.emailVerificado ? 'teal' : 'gray'}
                    variant="light"
                  >
                    {data.emailVerificado ? 'Email verificado' : 'Email sin verificar'}
                  </Badge>
                </Group>

                <Group grow align="flex-start">
                  <TextInput
                    label="Nombre"
                    withAsterisk
                    key={form.key('nombre')}
                    {...form.getInputProps('nombre')}
                    disabled={submitting}
                  />
                  <TextInput
                    label="Apellido"
                    withAsterisk
                    key={form.key('apellido')}
                    {...form.getInputProps('apellido')}
                    disabled={submitting}
                  />
                </Group>

                <TextInput
                  label="Teléfono"
                  autoComplete="tel"
                  withAsterisk
                  key={form.key('telefono')}
                  {...form.getInputProps('telefono')}
                  disabled={submitting}
                />

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    loading={submitting}
                    leftSection={<IconDeviceFloppy size={18} />}
                  >
                    Guardar cambios
                  </Button>
                </Group>
              </Stack>
            </form>
          )}
        </ScreenContainer>
      </Card>

      <CambiarPasswordCard />
    </Stack>
  );
};

export default MiPerfilPage;
