import { useState } from 'react';
import { Link } from 'wouter';
import {
  Alert,
  Anchor,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  PasswordInput,
  Title,
} from '@mantine/core';
import { useForm, schemaResolver } from '@mantine/form';
import { IconCircleCheck, IconMailCheck } from '@tabler/icons-react';

import { parseApiError } from '@domain/apiError';
import { useCaptcha } from '@hooks/useCaptcha';
import CaptchaField from '@components/CaptchaField';
import { isCaptchaApiError } from '@config/captcha';

import { registroApi } from '../../api/portal.api';
import { REGISTRO_SCHEMA, REGISTRO_INITIAL_VALUES } from './constants/schema';

/**
 * Registro público de CUSTOMER (`/registro`) → `POST /api/register`.
 * Contrato: `planning/CONTRACTS.md §7` (CONTRACT-007) · backend `SHG-BE-002`.
 *
 * No hay auto-login: el backend exige verificar el email antes de poder entrar.
 * Al éxito se muestra una pantalla "revisá tu email".
 */
const RegistroPage = () => {
  const [submitting, setSubmitting] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const captcha = useCaptcha();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: REGISTRO_INITIAL_VALUES,
    validate: schemaResolver(REGISTRO_SCHEMA, { sync: true }),
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);
    try {
      await registroApi.register(
        {
          email: values.email.trim(),
          password: values.password,
          nombre: values.nombre.trim(),
          apellido: values.apellido.trim(),
          telefono: values.telefono.trim(),
        },
        captcha.token,
      );
      setRegisteredEmail(values.email.trim());
    } catch (error) {
      // Captcha faltante/inválido/vencido (SHG-BE-032): re-emitimos el
      // challenge — el token es de un solo uso — y avisamos con un mensaje
      // propio en vez de mostrarlo como si fuera un error del campo email.
      if (isCaptchaApiError(error)) {
        captcha.reset();
        form.setErrors({
          email:
            'No pudimos verificar la seguridad del formulario. Resolvé el captcha de nuevo e intentá otra vez.',
        });
        return;
      }

      // El `400` de "email ya registrado" llega como `{ statusCode, message }`
      // sin `fields` (CONTRACT-005): lo mostramos como error del campo `email`.
      // Si el backend mandara `fields`, se respetan tal cual.
      const { fieldErrors, message } = parseApiError(error, {
        fallbackMessage: 'No se pudo completar el registro. Intentá nuevamente.',
      });
      if (Object.keys(fieldErrors).length > 0) {
        form.setErrors(fieldErrors);
      } else {
        form.setErrors({ email: message });
      }
    } finally {
      setSubmitting(false);
    }
  });

  if (registeredEmail) {
    return (
      <Stack gap="lg" maw={520} mx="auto">
        <Alert
          color="teal"
          variant="light"
          icon={<IconMailCheck size={20} />}
          title="Revisá tu email"
        >
          Te enviamos un correo a <strong>{registeredEmail}</strong> con un enlace
          para verificar tu cuenta. El enlace vence en 24 horas. Una vez
          verificada vas a poder iniciar sesión.
        </Alert>
        <Group justify="center">
          <Anchor component={Link} href="/login">
            Ir a iniciar sesión
          </Anchor>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="lg" maw={520} mx="auto">
      <Stack gap={4}>
        <Title order={2}>Creá tu cuenta</Title>
        <Text c="dimmed">
          Registrate para seguir todos tus envíos desde un solo lugar.
        </Text>
      </Stack>

      <Card withBorder padding="lg" component="form" onSubmit={handleSubmit}>
        <Stack gap="md">
          <Group grow align="flex-start">
            <TextInput
              label="Nombre"
              placeholder="Tu nombre"
              withAsterisk
              key={form.key('nombre')}
              {...form.getInputProps('nombre')}
            />
            <TextInput
              label="Apellido"
              placeholder="Tu apellido"
              withAsterisk
              key={form.key('apellido')}
              {...form.getInputProps('apellido')}
            />
          </Group>

          <TextInput
            label="Email"
            type="email"
            placeholder="vos@email.com"
            autoComplete="email"
            withAsterisk
            key={form.key('email')}
            {...form.getInputProps('email')}
          />

          <TextInput
            label="Teléfono"
            placeholder="3511234567"
            autoComplete="tel"
            withAsterisk
            key={form.key('telefono')}
            {...form.getInputProps('telefono')}
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Al menos 8 caracteres"
            autoComplete="new-password"
            withAsterisk
            key={form.key('password')}
            {...form.getInputProps('password')}
          />

          <CaptchaField captcha={captcha} />

          <Button
            type="submit"
            loading={submitting}
            disabled={!captcha.token}
            leftSection={<IconCircleCheck size={18} />}
          >
            Crear cuenta
          </Button>

          <Text size="sm" c="dimmed" ta="center">
            ¿Ya tenés cuenta?{' '}
            <Anchor component={Link} href="/login">
              Iniciá sesión
            </Anchor>
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
};

export default RegistroPage;
