import { useState } from "react";
import { Avatar, Button, Card, FileButton, Group, Stack, Text, Title } from "@mantine/core";
import { IconCamera, IconPhoto } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { API_URLS } from "@constants/apiUrls";
import { usuarioApi } from "@api";

// Mismos formatos que valida `FileService.isImage` en el backend — el chequeo
// acá es sólo para evitar un roundtrip innecesario, el backend sigue siendo la
// fuente de verdad (400 "The file is not an image" si se lo salteara).
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

/**
 * Sube la foto de perfil del usuario **logueado** (`POST /api/files`, multipart).
 *
 * `FileService.uploadFile` del backend siempre asocia la imagen a
 * `getCurrentUser()` — no recibe un `userId` — así que este control sólo tiene
 * sentido cuando quien edita el formulario es el propio usuario (ver
 * `EditarUsuario`, que lo renderiza únicamente cuando `id === usuario logueado`).
 * No existe forma de que un SU/AD suba la foto de otro empleado.
 *
 * @param {Object} props
 * @param {string|null} props.profile - Nombre de archivo actual (`UserDTO.profile`, sin path).
 * @param {string} props.fullName - Para las iniciales del avatar de fallback.
 * @param {(usuarioActualizado: object) => void} props.onUploaded - Recibe el `UserDTO` actualizado.
 */
const FotoPerfilUpload = ({ profile, fullName, onUploaded }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      notifications.show({
        title: "Formato no soportado",
        message: "La foto debe ser JPG, PNG o GIF",
        color: "red",
      });
      return;
    }

    try {
      setUploading(true);
      const usuarioActualizado = await usuarioApi.uploadProfileFile(file);
      onUploaded?.(usuarioActualizado);

      notifications.show({
        title: "Foto actualizada",
        message: "Tu foto de perfil se actualizó correctamente",
        color: "green",
      });
    } catch (error) {
      console.error("Error subiendo foto de perfil:", error);
      notifications.show({
        title: "Error",
        message:
          error.response?.data?.message || "No se pudo subir la foto de perfil",
        color: "red",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <Stack gap="md">
        <Group gap="0.75rem">
          <IconPhoto size={20} />
          <Title order={4}>Foto de perfil</Title>
        </Group>

        <Group gap="lg" wrap="nowrap">
          <Avatar
            src={profile ? `/api${API_URLS.FILES_URL}/${profile}` : null}
            size={80}
            radius="md"
          >
            {!profile && (fullName?.charAt(0) || "U")}
          </Avatar>

          <Stack gap={4}>
            <Text size="xs" c="dimmed">
              JPG, PNG o GIF
            </Text>
            <FileButton onChange={handleUpload} accept="image/png,image/jpeg,image/gif">
              {(buttonProps) => (
                <Button
                  {...buttonProps}
                  variant="light"
                  size="xs"
                  leftSection={<IconCamera size={16} />}
                  loading={uploading}
                >
                  Cambiar foto
                </Button>
              )}
            </FileButton>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
};

export default FotoPerfilUpload;
