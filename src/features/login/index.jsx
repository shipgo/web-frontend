import { useEffect, useState } from "react";
import { useLocation, useSearch, Link as WouterLink } from "wouter";

import { omit } from "es-toolkit";
import { IconAlertCircle } from "@tabler/icons-react";

import { useLocalStorage } from "@mantine/hooks";
import { useForm, isNotEmpty } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  Alert,
  Button,
  PasswordInput,
  Stack,
  TextInput,
  LoadingOverlay,
  Group,
  Switch,
  Anchor,
  Divider,
  FocusTrap,
} from "@mantine/core";
import AuthShell from "@components/AuthShell";

import { useAuthStore } from "@stores/auth.store";
import { getRateLimitMessage } from "@domain/apiError";
import { landingPathFor } from "@domain/roles";
import { resolvePostLoginRedirect } from "@utils/redirect";
import { useCaptcha } from "@hooks/useCaptcha";
import CaptchaField from "@components/CaptchaField";
import { isCaptchaApiError } from "@config/captcha";
import { LOGIN_VARIANTS } from "./constants/copy";

const LOCAL_STORAGE_KEY = "shipgo_stored_user";
const DEFAULT_FORM_VALUES = { username: "", password: "", remember: false };

/**
 * @param {Object} props
 * @param {'operator'|'customer'} [props.variant='operator']  Cambia el copy
 *   (título/subtítulo) del formulario — el destino post-login sigue siendo el
 *   mismo `landingPathFor(user)` en ambos casos, según el rol real del usuario
 *   que loguea (SHG-FE-044: entrada dedicada del customer en `/portal/ingresar`,
 *   sin duplicar el form).
 */
const LoginPage = ({ variant = "operator" }) => {
  const copy = LOGIN_VARIANTS[variant] ?? LOGIN_VARIANTS.operator;
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [loading, setLoading] = useState(false);
  // Error del último intento (se muestra dentro del formulario, sobre los campos).
  const [formError, setFormError] = useState(null);
  const [storedUser, setStoredUser] = useLocalStorage({
    key: LOCAL_STORAGE_KEY,
    defaultValue: null,
  });
  const { login } = useAuthStore();
  const captcha = useCaptcha();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: DEFAULT_FORM_VALUES,
    validate: {
      username: isNotEmpty("Ingresá tu usuario."),
      password: isNotEmpty("Ingresá tu contraseña."),
    },
  });

  // Cargar usuario guardado al montar el componente
  useEffect(() => {
    if (storedUser) {
      form.setValues({
        username: storedUser,
        password: "",
        remember: true,
      });
    }
  }, [storedUser]); // Solo depende de storedUser

  const handleFormSubmit = async (formValues) => {
    setLoading(true);
    setFormError(null);

    try {
      const credentials = {
        ...omit(formValues, ["remember"]),
        captchaToken: captcha.token,
      };

      // Llamar al login del auth store
      await login(credentials);

      // Guardar o limpiar usuario según "recordar"
      if (formValues.remember) {
        setStoredUser(formValues.username);
      } else {
        setStoredUser(null);
      }

      notifications.clean();

      // Post-login (SHG-FE-054): si vino `?redirect=<ruta>` (acceso directo a
      // una ruta protegida sin sesión) y sanea a una ruta interna válida,
      // vuelve ahí; si no, al home que corresponde al rol (CUSTOMER → portal,
      // SU/AD → `/`). Si el destino no fuera accesible para el rol logueado,
      // la guarda de esa ruta lo rebota a su home sin loop — ver
      // `@utils/redirect`.
      const rawRedirect = new URLSearchParams(search).get("redirect");
      const authenticatedUser = useAuthStore.getState().user;
      setLocation(
        resolvePostLoginRedirect(rawRedirect, landingPathFor(authenticatedUser)),
      );
    } catch (error) {
      console.error("Login error:", error);

      // Captcha faltante/inválido/vencido (SHG-BE-032): el backend nunca llega
      // a intentar autenticar (TurnstileLoginFilter corta antes). Re-emitimos
      // el challenge — el token es de un solo uso, no sirve reintentar con el
      // mismo aunque el usuario no haya hecho nada mal.
      if (isCaptchaApiError(error)) {
        captcha.reset();
        setFormError({
          title: "No pudimos completar la verificación de seguridad",
          message:
            "La verificación venció o no es válida. Completala de nuevo e intentá otra vez.",
        });
        return;
      }

      // Límite de intentos (SHG-CONTRACT-013): 429 `rate_limited`. No es un
      // error de credenciales: hay que esperar, no seguir probando.
      const rateLimitMessage = getRateLimitMessage(error);
      if (rateLimitMessage) {
        setFormError({ title: "Demasiados intentos", message: rateLimitMessage });
        return;
      }

      // El backend bloquea el login de un CUSTOMER hasta verificar el email y
      // devuelve un 401 con un mensaje explícito (SHG-BE-002) — mostrarlo tal cual.
      const apiMessage = error?.response?.data?.message;
      const isUnverified =
        error?.response?.status === 401 &&
        typeof apiMessage === "string" &&
        apiMessage.toLowerCase().includes("verific");

      setFormError({
        title: isUnverified
          ? "Cuenta sin verificar"
          : "Usuario y/o contraseña incorrectos",
        message: isUnverified
          ? apiMessage
          : "Revisá tus datos e intentá de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  // El molde `AuthShell` fuerza tema light (foto de marca fija que no fue diseñada
  // para dark mode) y arma las dos mitades: formulario a la izquierda, foto a la
  // derecha desde `sm`. Es una vista pública; contrasta con las rutas
  // autenticadas que sí respetan la preferencia del usuario (SHG-FE-061).
  return (
    <AuthShell
      variant="split"
      title={copy.title}
      subtitle={copy.subtitle}
      footer={
        <>
          <Anchor href="https://shipgo.gitbook.io/manual" target="_blank" size="sm" c="dimmed">
            Ayuda
          </Anchor>
          <Anchor component={WouterLink} href="/" size="sm" c="dimmed">
            Volver al inicio
          </Anchor>
        </>
      }
    >
      <Stack
        gap="lg"
        component="form"
        noValidate
        pos="relative"
        onSubmit={form.onSubmit((values) => handleFormSubmit(values))}
      >
        <LoadingOverlay visible={loading} />

        {formError ? (
          <Alert
            color="red"
            icon={<IconAlertCircle size={18} />}
            title={formError.title}
          >
            {formError.message}
          </Alert>
        ) : null}

        <FocusTrap active>
          <Stack gap="sm">
            <TextInput
              {...form.getInputProps("username")}
              autoFocus
              size="lg"
              label="Usuario"
              autoComplete="username"
              disabled={loading}
              key={form.key("username")}
              placeholder="Ingresá tu usuario"
            />
            <PasswordInput
              {...form.getInputProps("password")}
              size="lg"
              label="Contraseña"
              autoComplete="current-password"
              disabled={loading}
              key={form.key("password")}
              placeholder="Ingresá tu contraseña"
            />
          </Stack>
        </FocusTrap>

        <Group justify="space-between">
          <Switch
            {...form.getInputProps("remember", { type: "checkbox" })}
            size="md"
            label="Recordame"
            key={form.key("remember")}
          />
          <Anchor href="/recuperar-cuenta" fw={600}>
            Olvidé mi contraseña
          </Anchor>
        </Group>

        <CaptchaField captcha={captcha} />

        <Button
          size="lg"
          h={48}
          type="submit"
          disabled={loading || !captcha.token}
        >
          Iniciar sesión
        </Button>

        <Stack gap="sm">
          <Divider label="¿Primera vez en ShipGo?" labelPosition="center" />
          <Button
            component={WouterLink}
            href="/registro"
            variant="outline"
            size="lg"
            h={48}
          >
            Crear una cuenta
          </Button>
        </Stack>
      </Stack>
    </AuthShell>
  );
};

export default LoginPage;
