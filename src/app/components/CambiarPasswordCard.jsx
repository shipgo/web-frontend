import { useState } from "react";
import { z } from "zod";

import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  Button,
  Card,
  Group,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconCheck, IconLock, IconX } from "@tabler/icons-react";

import { applyApiError } from "@domain/apiError";
import { PASSWORD_MIN } from "@domain/validation";
import { useAuthStore } from "@stores/auth.store";

const PASSWORD_INCORRECTA_MESSAGE = "La contraseña actual es incorrecta";

/**
 * Contraseña actual incorrecta (SHG-BE-083, CONTRACTS.md §13): `400` + `code:
 * "password_incorrecta"`. Un `401` significa sesión vencida, no contraseña
 * incorrecta, así que no se trata acá.
 */
const isPasswordIncorrecta = (error) =>
  error?.response?.data?.code === "password_incorrecta";

/**
 * Cambio de contraseña del PROPIO usuario logueado (`POST /api/changePassword`,
 * `ChangePasswordForm { oldPassword, newPassword }`). El backend re-autentica con
 * la contraseña actual e invalida el token viejo, así que en éxito el store hace
 * `logout()` y redirige a `/login`.
 *
 * Distinto del botón "Resetear contraseña" de `DetalleUsuario` (SHG-FE-017): ese
 * es un SU/AD disparando el mail de recuperación a OTRO usuario. Éste sólo aparece
 * cuando editás tu propio perfil (`isSelf`).
 */
const CAMBIAR_PASSWORD_SCHEMA = z
  .object({
    oldPassword: z.string().min(1, "Ingresá tu contraseña actual"),
    newPassword: z
      .string()
      .min(
        PASSWORD_MIN,
        `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`,
      ),
    confirmPassword: z.string().min(1, "Repetí la contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "La nueva contraseña debe ser distinta de la actual",
  });

const INITIAL_VALUES = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const CambiarPasswordCard = () => {
  const changePassword = useAuthStore((state) => state.changePassword);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validate: schemaResolver(CAMBIAR_PASSWORD_SCHEMA, { sync: true }),
  });

  const handleSubmit = async ({ oldPassword, newPassword }) => {
    setLoading(true);
    try {
      // En éxito el store cierra la sesión y redirige a /login: no hace falta
      // navegar ni limpiar el form manualmente.
      await changePassword({ oldPassword, newPassword });
      notifications.show({
        title: "Contraseña actualizada",
        message: "Volvé a iniciar sesión con tu nueva contraseña.",
        color: "green",
        icon: <IconCheck />,
      });
    } catch (error) {
      console.error("Error cambiando contraseña:", error);
      let message;
      if (isPasswordIncorrecta(error)) {
        message = PASSWORD_INCORRECTA_MESSAGE;
        form.setFieldError("oldPassword", message);
      } else {
        message = applyApiError(form, error, {
          fallbackMessage: "No se pudo cambiar la contraseña. Intentá nuevamente.",
        });
      }
      notifications.show({
        title: "Error",
        message,
        color: "red",
        icon: <IconX />,
      });
      setLoading(false);
    }
  };

  return (
    <Card component="form" onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="md">
        <Group gap="0.75rem">
          <IconLock size={20} stroke={1.5} />
          <Title order={4}>Cambiar contraseña</Title>
        </Group>
        <Text size="sm" c="dimmed">
          Al cambiarla se cerrará la sesión y tendrás que volver a iniciarla.
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <PasswordInput
            {...form.getInputProps("oldPassword")}
            key={form.key("oldPassword")}
            label="Contraseña actual"
            autoComplete="current-password"
            disabled={loading}
          />
          <PasswordInput
            {...form.getInputProps("newPassword")}
            key={form.key("newPassword")}
            label="Nueva contraseña"
            autoComplete="new-password"
            disabled={loading}
          />
          <PasswordInput
            {...form.getInputProps("confirmPassword")}
            key={form.key("confirmPassword")}
            label="Repetí la contraseña"
            autoComplete="new-password"
            disabled={loading}
          />
        </SimpleGrid>

        <Group justify="flex-end">
          <Button type="submit" loading={loading}>
            Cambiar contraseña
          </Button>
        </Group>
      </Stack>
    </Card>
  );
};

export default CambiarPasswordCard;
