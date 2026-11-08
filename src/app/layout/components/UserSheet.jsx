import {
  Avatar,
  Box,
  Drawer,
  Group,
  NavLink,
  SegmentedControl,
  Stack,
  Text,
  useMantineColorScheme,
  VisuallyHidden,
} from "@mantine/core";
import { IconChevronRight, IconLogout, IconUser } from "@tabler/icons-react";
import { Link } from "wouter";

import { useAuth } from "@contexts/auth";
import { useAuthStore } from "@stores/auth.store";
import { necesitaOnboardingEmpresa } from "@domain/empresa";
import { rolLabel } from "@domain/roles";
import { iniciales, nombreCompleto } from "@domain/usuario";

const ROW_MIN_HEIGHT = 44;

const APARIENCIAS = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

/**
 * Hoja inferior del usuario (mobile): quién sos, "Mi perfil", apariencia
 * (Auto / Claro / Oscuro) y "Cerrar sesión". La abren el avatar del header y la
 * fila del usuario fijada abajo del cajón; reemplaza al menú desplegable de
 * escritorio, que en mobile no se muestra. Mide lo que su contenido (con
 * tope de 85 % del alto), con un tirador arriba.
 *
 * @param {Object} props
 * @param {boolean} props.opened
 * @param {() => void} props.onClose
 */
const UserSheet = ({ opened, onClose }) => {
  const { user } = useAuth();
  const { logout } = useAuthStore();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  if (!user) return null;

  const role = rolLabel(user.authorities?.[0]?.name || user.role);
  const detalle = [role, user.email].filter(Boolean).join(" · ");
  const sinEmpresa = necesitaOnboardingEmpresa(user);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      withCloseButton={false}
      // El título es el nombre accesible del diálogo; visualmente es sólo el tirador.
      title={
        <>
          <VisuallyHidden>Opciones de usuario</VisuallyHidden>
          <Box aria-hidden w={32} h={4} bg="gray.4" style={{ borderRadius: 2 }} />
        </>
      }
      styles={{
        content: {
          // Alto del contenido (el `size` de Mantine fija un alto y deja vacío abajo).
          flex: "0 0 auto",
          width: "100%",
          height: "auto",
          maxHeight: "85dvh",
          borderRadius: "18px 18px 0 0",
        },
        header: {
          minHeight: 0,
          padding: "8px 16px 0",
          justifyContent: "center",
        },
        title: { flex: "0 0 auto", lineHeight: 1 },
        body: {
          padding: "8px 16px",
          paddingBottom:
            "calc(var(--mantine-spacing-sm) + env(safe-area-inset-bottom))",
        },
      }}
      data-testid="user-sheet"
    >
      <Stack gap="xs">
        <Group wrap="nowrap" gap="sm" py={4}>
          <Avatar
            src={user.profile ? `/api${user.profile}` : undefined}
            radius="xl"
            size={44}
            color="colorPalette"
          >
            {iniciales(user) || "U"}
          </Avatar>
          <Stack gap={0} miw={0}>
            <Text fw={700} truncate="end">
              {nombreCompleto(user, "Usuario")}
            </Text>
            <Text size="xs" c="dimmed" truncate="end">
              {detalle}
            </Text>
          </Stack>
        </Group>

        {!sinEmpresa && (
          <NavLink
            component={Link}
            to={`/usuarios/${user.id}`}
            label="Mi perfil"
            mih={ROW_MIN_HEIGHT}
            px={4}
            leftSection={<IconUser size={18} />}
            rightSection={<IconChevronRight size={16} />}
            onClick={onClose}
          />
        )}

        <Stack gap={4}>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            Apariencia
          </Text>
          <SegmentedControl
            fullWidth
            aria-label="Apariencia"
            value={colorScheme}
            onChange={setColorScheme}
            data={APARIENCIAS}
          />
        </Stack>

        <NavLink
          color="red"
          label="Cerrar sesión"
          mih={ROW_MIN_HEIGHT}
          px={4}
          onClick={handleLogout}
          leftSection={<IconLogout size={18} />}
        />
      </Stack>
    </Drawer>
  );
};

export default UserSheet;
