import { useLayoutEffect, useState } from "react";

import logo from "/src/assets/logoipsum-custom-logo.svg";

import { isEqual, omit } from "es-toolkit";
import { IconExclamationMark } from "@tabler/icons-react";
import { useLocation } from "wouter";

import { useLocalStorage } from "@mantine/hooks";
import { useForm, isNotEmpty } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@contexts/auth";
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

const FORM_WIDHT = "35rem";
const LOCAL_STORAGE_VALUES = { key: "storedUser", defaultValue: null };
const DEFAULT_FORM_VALUES = { email: "", password: "", remember: false };

const LoginPage = () => {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [storedUser, setStoredUser] = useLocalStorage(LOCAL_STORAGE_VALUES);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: DEFAULT_FORM_VALUES,
    validate: {
      email: isNotEmpty(),
      password: isNotEmpty(),
    },
  });

  useLayoutEffect(() => {
    if (!storedUser) return;

    form.initialize({
      password: "",
      remember: true,
      email: storedUser,
    });
  }, []);

  const handleRemember = ({ email, remember }) => {
    if (remember) {
      setStoredUser(email);
      return;
    }

    setStoredUser(null);
  };

  const handleFormSubmit = async (formValues) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const userValues = omit(formValues, ["remember"]);

    const correctCredentials = isEqual(userValues, {
      email: "admin",
      password: "admin",
    });

    if (correctCredentials) {
      handleRemember(formValues);
      notifications.clean();
      login({
        fullname: "Joaquín Dolcemascolo",
        email: formValues.email,
        role: "Administrador",
      });
      navigate("/");
      return;
    }

    setLoading(false);
    notifications.show({
      color: "red",
      title: "Usuario y/o contraseña incorrectos",
      message: "Por favor, verificá los datos ingresados",
      icon: <IconExclamationMark style={{ width: rem(20), height: rem(20) }} />,
    });
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
                  {...form.getInputProps("email")}
                  autoFocus
                  size="md"
                  label="Correo"
                  autoComplete="off"
                  disabled={loading}
                  key={form.key("email")}
                  placeholder="usuario@ejemplo.com"
                />
                <PasswordInput
                  {...form.getInputProps("password")}
                  size="md"
                  label="Contraseña"
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
              <Anchor>Olvidé mi contraseña</Anchor>
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
          src="src/assets/background.jpg"
          miw={`calc(100svw - ${FORM_WIDHT})`}
        />
      </Group>
    </MantineProvider>
  );
};

export default LoginPage;
