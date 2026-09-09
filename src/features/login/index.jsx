import { useEffect, useState } from "react";
import { useLocation, Link as WouterLink } from "wouter";

import logo from "/src/assets/logoipsum-custom-logo.svg";
import background from "/src/assets/background.jpg";

import { omit } from "es-toolkit";
import { IconExclamationMark } from "@tabler/icons-react";

import { useLocalStorage } from "@mantine/hooks";
import { useForm, isNotEmpty } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  Button,
  MantineProvider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Card,
  LoadingOverlay,
  Group,
  Switch,
  Anchor,
  Divider,
  rem,
  FocusTrap,
  Image,
} from "@mantine/core";

import { useAuthStore } from "@stores/auth.store";
import { landingPathFor } from "@domain/roles";
import { useCaptcha } from "@hooks/useCaptcha";
import CaptchaField from "@components/CaptchaField";
import { isCaptchaApiError } from "@config/captcha";
import { LOGIN_VARIANTS } from "./constants/copy";

const FORM_WIDHT = "35rem";
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
  const [loading, setLoading] = useState(false);
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
      username: isNotEmpty("Usuario requerido"),
      password: isNotEmpty("Contraseña requerida"),
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

      // Redirigir al home que corresponde al rol: CUSTOMER → portal, SU/AD → `/`.
      setLocation(landingPathFor(useAuthStore.getState().user));
    } catch (error) {
      console.error("Login error:", error);

      // Captcha faltante/inválido/vencido (SHG-BE-032): el backend nunca llega
      // a intentar autenticar (TurnstileLoginFilter corta antes). Re-emitimos
      // el challenge — el token es de un solo uso, no sirve reintentar con el
      // mismo aunque el usuario no haya hecho nada mal.
      if (isCaptchaApiError(error)) {
        captcha.reset();
        notifications.show({
          color: "red",
          title: "No pudimos verificar que sos una persona",
          message:
            "La verificación de seguridad venció o no es válida. Resolvela de nuevo e intentá otra vez.",
          icon: (
            <IconExclamationMark style={{ width: rem(20), height: rem(20) }} />
          ),
        });
        return;
      }

      // El backend bloquea el login de un CUSTOMER hasta verificar el email y
      // devuelve un 401 con un mensaje explícito (SHG-BE-002) — mostrarlo tal cual.
      const apiMessage = error?.response?.data?.message;
      const isUnverified =
        error?.response?.status === 401 &&
        typeof apiMessage === "string" &&
        apiMessage.toLowerCase().includes("verific");

      notifications.show({
        color: "red",
        title: isUnverified
          ? "Cuenta sin verificar"
          : "Usuario y/o contraseña incorrectos",
        message: isUnverified
          ? apiMessage
          : "Por favor, verificá los datos ingresados",
        icon: (
          <IconExclamationMark style={{ width: rem(20), height: rem(20) }} />
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MantineProvider forceColorScheme="light">
      <Group align="flex-start" gap="0" wrap="nowrap">
        <Card
          w={{ base: '100%', sm: FORM_WIDHT }}
          miw={{ base: 0, sm: FORM_WIDHT }}
          mih="100svh"
          p="xl"
          withBorder
        >
          <Stack
            p="xl"
            gap="lg"
            my="auto"
            component="form"
            justify="center"
            onSubmit={form.onSubmit((values) => handleFormSubmit(values))}
          >
            <LoadingOverlay visible={loading} />

            <Stack gap={0}>
              <Anchor component={WouterLink} href="/" aria-label="ShipGo — inicio" w="300">
                <Image src={logo} alt="ShipGo logo" w="300" fit="contain" />
              </Anchor>
              <Title order={1}>{copy.title}</Title>
              <Text>{copy.subtitle}</Text>
            </Stack>

            <FocusTrap active>
              <Stack gap="xs">
                <TextInput
                  {...form.getInputProps("username")}
                  autoFocus
                  size="md"
                  label="Usuario"
                  autoComplete="username"
                  disabled={loading}
                  key={form.key("username")}
                  placeholder="Ingresá tu usuario"
                />
                <PasswordInput
                  {...form.getInputProps("password")}
                  size="md"
                  label="Contraseña"
                  autoComplete="current-password"
                  disabled={loading}
                  key={form.key("password")}
                  placeholder="Introducí tu contraseña"
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
              <Anchor href="/recuperar-cuenta">Olvidé mi contraseña</Anchor>
            </Group>

            <CaptchaField captcha={captcha} />

            <Button
              size="lg"
              type="submit"
              disabled={loading || !captcha.token}
            >
              Iniciar sesión
            </Button>

            <Group justify="center">
              <Anchor href="https://shipgo.gitbook.io/manual" target="_blank">
                Necesito ayuda
              </Anchor>
              <Divider orientation="vertical" />
              <Anchor href="/registro">Crear una cuenta</Anchor>
            </Group>
          </Stack>
        </Card>
        <Image
          h="100svh"
          src={background}
          alt=""
          miw={`calc(100svw - ${FORM_WIDHT})`}
          visibleFrom="sm"
        />
      </Group>
    </MantineProvider>
  );
};

export default LoginPage;
