import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";

import { useForm, schemaResolver } from "@mantine/form";
import {
  Alert,
  Anchor,
  Button,
  Center,
  Group,
  Loader,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";

import { applyApiError } from "@domain/apiError";
import { useAuthStore } from "@stores/auth.store";

import AuthCardShell from "../components/AuthCardShell";
import {
  NUEVA_PASSWORD_INITIAL_VALUES,
  NUEVA_PASSWORD_SCHEMA,
} from "../constants/schema";

const ESTADO = {
  VALIDANDO: "validando",
  VALIDO: "valido",
  INVALIDO: "invalido",
  LISTO: "listo",
};

/**
 * Textos por variante (SHG-FE-133). `recuperar` es "olvidé mi contraseña"
 * (`/recuperar-cuenta/:token`); `activar` es el link de bienvenida/invitación
 * (`/activar-cuenta/:token`). Mismo flujo y mismos endpoints.
 */
const TEXTOS = {
  recuperar: {
    titulo: "Creá una nueva contraseña",
    subtitulo: "Elegí una contraseña que no hayas usado antes.",
    boton: "Guardar contraseña",
    exitoTitulo: "Contraseña actualizada",
    exitoMensaje: "Ya podés iniciar sesión con tu nueva contraseña.",
    invalidoMensaje: "Pedí un nuevo enlace de recuperación e intentá otra vez.",
    invalidoLink: "Pedir un nuevo enlace",
    errorTitulo: "No se pudo cambiar la contraseña",
    errorFallback:
      "No se pudo cambiar la contraseña. El enlace puede haber expirado.",
  },
  activar: {
    titulo: "Activá tu cuenta",
    subtitulo: "Elegí una contraseña para empezar a usar ShipGo.",
    boton: "Activar cuenta",
    exitoTitulo: "Cuenta activada",
    exitoMensaje:
      "Ya podés iniciar sesión con tu email y la contraseña que elegiste.",
    invalidoMensaje:
      "Si todavía no activaste tu cuenta, pedí un nuevo enlace desde “Olvidé mi contraseña”.",
    invalidoLink: "Olvidé mi contraseña",
    errorTitulo: "No se pudo activar la cuenta",
    errorFallback:
      "No se pudo activar la cuenta. El enlace puede haber expirado.",
  },
};

/**
 * Paso 2 de "olvidé mi contraseña" (`/recuperar-cuenta/:token`) y activación de
 * cuenta (`/activar-cuenta/:token`, `variant="activar"`).
 *
 * Al montar valida el token contra `GET /api/token/{token}` (`verifyToken`).
 * Si es válido muestra el form de nueva contraseña → `POST /api/user/changePassword`
 * (`resetPasswordWithToken`). Si no, un mensaje de error con link para pedir otro.
 */
const RecuperarCuentaToken = ({ variant = "recuperar" }) => {
  const textos = TEXTOS[variant] ?? TEXTOS.recuperar;
  const { token } = useParams();
  const verifyToken = useAuthStore((state) => state.verifyToken);
  const resetPasswordWithToken = useAuthStore(
    (state) => state.resetPasswordWithToken
  );

  const [estado, setEstado] = useState(ESTADO.VALIDANDO);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: NUEVA_PASSWORD_INITIAL_VALUES,
    validate: schemaResolver(NUEVA_PASSWORD_SCHEMA, { sync: true }),
  });

  useEffect(() => {
    let activo = true;

    if (!token) {
      setEstado(ESTADO.INVALIDO);
      return;
    }

    setEstado(ESTADO.VALIDANDO);
    verifyToken(token)
      .then(() => {
        if (activo) setEstado(ESTADO.VALIDO);
      })
      .catch(() => {
        if (activo) setEstado(ESTADO.INVALIDO);
      });

    return () => {
      activo = false;
    };
  }, [token, verifyToken]);

  const handleSubmit = async ({ newPassword }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await resetPasswordWithToken({ token, newPassword });
      setEstado(ESTADO.LISTO);
    } catch (error) {
      setErrorMsg(
        applyApiError(form, error, {
          fallbackMessage: textos.errorFallback,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (estado === ESTADO.VALIDANDO) {
    return (
      <AuthCardShell title="Verificando el enlace">
        <Center py="lg">
          <Loader size="md" />
        </Center>
      </AuthCardShell>
    );
  }

  if (estado === ESTADO.INVALIDO) {
    return (
      <AuthCardShell title="Enlace no válido">
        <Alert color="red" title="El enlace expiró o ya se usó">
          {textos.invalidoMensaje}
        </Alert>
        <Anchor component={Link} href="/recuperar-cuenta">
          {textos.invalidoLink}
        </Anchor>
        <Anchor component={Link} href="/login" c="dimmed">
          <Group gap={6}>
            <IconArrowLeft size={16} />
            <Text size="sm">Volver a iniciar sesión</Text>
          </Group>
        </Anchor>
      </AuthCardShell>
    );
  }

  if (estado === ESTADO.LISTO) {
    return (
      <AuthCardShell title={textos.exitoTitulo}>
        <Alert color="green" icon={<IconCheck size={18} />} title="Listo">
          {textos.exitoMensaje}
        </Alert>
        <Anchor component={Link} href="/login">
          Ir a iniciar sesión
        </Anchor>
      </AuthCardShell>
    );
  }

  return (
    <AuthCardShell
      title={textos.titulo}
      subtitle={textos.subtitulo}
    >
      <Stack gap="lg" component="form" onSubmit={form.onSubmit(handleSubmit)} noValidate>
        {errorMsg ? (
          <Alert color="red" title={textos.errorTitulo}>
            {errorMsg}
          </Alert>
        ) : null}

        <PasswordInput
          {...form.getInputProps("newPassword")}
          key={form.key("newPassword")}
          size="md"
          label="Nueva contraseña"
          autoComplete="new-password"
          autoFocus
          disabled={loading}
        />
        <PasswordInput
          {...form.getInputProps("confirmPassword")}
          key={form.key("confirmPassword")}
          size="md"
          label="Repetí la contraseña"
          autoComplete="new-password"
          disabled={loading}
        />

        <Button type="submit" size="md" loading={loading}>
          {textos.boton}
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
    </AuthCardShell>
  );
};

export default RecuperarCuentaToken;
