import { useState } from "react";
import { Link } from "wouter";

import { useForm, schemaResolver } from "@mantine/form";
import {
  Alert,
  Anchor,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";

import { applyApiError } from "@domain/apiError";
import { useAuthStore } from "@stores/auth.store";

import AuthCardShell from "../components/AuthCardShell";
import {
  RECUPERAR_EMAIL_INITIAL_VALUES,
  RECUPERAR_EMAIL_SCHEMA,
} from "../constants/schema";

/**
 * Paso 1 de "olvidé mi contraseña" (`/recuperar-cuenta`).
 *
 * Envía el email a `POST /api/user/resetPassword` (vía `verifyEmail` del store).
 * El backend siempre responde 200 aunque el email no exista (no filtra si hay
 * cuenta), así que el mensaje de éxito es deliberadamente genérico.
 */
const RecuperarCuenta = () => {
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: RECUPERAR_EMAIL_INITIAL_VALUES,
    validate: schemaResolver(RECUPERAR_EMAIL_SCHEMA, { sync: true }),
  });

  const handleSubmit = async ({ userEmail }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await verifyEmail(userEmail.trim());
      setEnviado(true);
    } catch (error) {
      setErrorMsg(
        applyApiError(form, error, {
          fallbackMessage: "No pudimos procesar tu pedido. Intentá de nuevo.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <AuthCardShell title="Revisá tu correo">
        <Alert color="green" icon={<IconCheck size={18} />} title="Pedido enviado">
          Si el email ingresado corresponde a una cuenta, te enviamos un enlace
          para restablecer la contraseña. Revisá también la carpeta de spam.
        </Alert>
        <Anchor component={Link} href="/login">
          <Group gap={6}>
            <IconArrowLeft size={16} />
            Volver a iniciar sesión
          </Group>
        </Anchor>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell
      title="Recuperá tu cuenta"
      subtitle="Ingresá tu email y te enviaremos un enlace para crear una nueva contraseña."
    >
      <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
        <Stack gap="lg">
          {errorMsg ? (
            <Alert color="red" title="No se pudo enviar">
              {errorMsg}
            </Alert>
          ) : null}

          <TextInput
            {...form.getInputProps("userEmail")}
            key={form.key("userEmail")}
            size="md"
            inputMode="email"
            label="Email"
            autoComplete="email"
            autoFocus
            disabled={loading}
            placeholder="tu@email.com"
          />

          <Button type="submit" size="md" loading={loading}>
            Enviar enlace
          </Button>

          <Group justify="center">
            <Anchor component={Link} href="/login" c="dimmed">
              <Group gap={6}>
                <IconArrowLeft size={16} />
                <Text size="sm">Volver a iniciar sesión</Text>
              </Group>
            </Anchor>
          </Group>
        </Stack>
      </form>
    </AuthCardShell>
  );
};

export default RecuperarCuenta;
