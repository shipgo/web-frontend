import { useEffect, useState } from "react";
import { useLocation } from "wouter";

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

const FORM_WIDHT = "35rem";
const LOCAL_STORAGE_KEY = "shipgo_stored_user";
const DEFAULT_FORM_VALUES = { username: "", password: "", remember: false };

const LoginPage = () => {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [storedUser, setStoredUser] = useLocalStorage({
    key: LOCAL_STORAGE_KEY,
    defaultValue: null,
  });
  const { login } = useAuthStore();

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
      const credentials = omit(formValues, ["remember"]);

      // Llamar al login del auth store
      await login(credentials);

      // Guardar o limpiar usuario según "recordar"
      if (formValues.remember) {
        setStoredUser(formValues.username);
      } else {
        setStoredUser(null);
      }

      notifications.clean();

      // Redirigir al home después del login exitoso
      setLocation("/");
    } catch (error) {
      console.error("Login error:", error);

      notifications.show({
        color: "red",
        title: "Usuario y/o contraseña incorrectos",
        message: "Por favor, verificá los datos ingresados",
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
        <Card miw={FORM_WIDHT} mih="100svh" p="xl" withBorder>
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
              <Image src={logo} w="300" fit="contain" />
              <Title order={1}>Iniciar sesión</Title>
              <Text>Completá con tus datos</Text>
            </Stack>

            <FocusTrap active>
              <Stack active gap="xs">
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

            <Button size="lg" type="submit" disabled={loading}>
              Iniciar sesión
            </Button>

            <Group justify="center">
              <Anchor href="https://shipgo.gitbook.io/manual" target="_blank">
                Necesito ayuda
              </Anchor>
              <Divider orientation="vertical" />
              <Anchor>No tengo una cuenta</Anchor>
            </Group>
          </Stack>
        </Card>
        <Image
          h="100svh"
          src={background}
          miw={`calc(100svw - ${FORM_WIDHT})`}
        />
      </Group>
    </MantineProvider>
  );
};

export default LoginPage;
