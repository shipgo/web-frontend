import {
  Avatar,
  Divider,
  Drawer,
  Group,
  NavLink,
  SegmentedControl,
  Stack,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
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
 * Hoja inferior del usuario (mobile): perfil, apariencia (Auto / Claro / Oscuro)
 * y "Cerrar sesión". La abre el avatar del header; reemplaza al menú desplegable
 * de escritorio, que en mobile no se muestra, y deja el cajón sólo con navegación.
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
      size="auto"
      radius="md"
      withCloseButton={false}
      title={
        <Group wrap="nowrap" gap="sm">
          <Avatar
            src={user.profile ? `/api${user.profile}` : undefined}
            radius="xl"
            size="lg"
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
      }
      styles={{
        title: { flex: 1, minWidth: 0 },
        content: { maxHeight: "85dvh" },
        body: {
          paddingBottom:
            "calc(var(--mantine-spacing-md) + env(safe-area-inset-bottom))",
        },
      }}
      data-testid="user-sheet"
    >
      <Stack gap="xs">
        {!sinEmpresa && (
          <NavLink
            component={Link}
            to={`/usuarios/${user.id}`}
            label="Mi perfil"
            mih={ROW_MIN_HEIGHT}
            leftSection={<IconUser size={18} />}
            onClick={onClose}
          />
        )}

        <Stack gap={4} px="md" py="xs">
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            Apariencia
          </Text>
          <SegmentedControl
            fullWidth
            size="md"
            aria-label="Apariencia"
            value={colorScheme}
            onChange={setColorScheme}
            data={APARIENCIAS}
          />
        </Stack>

        <Divider />

        <NavLink
          color="red"
          label="Cerrar sesión"
          mih={ROW_MIN_HEIGHT}
          onClick={handleLogout}
          leftSection={<IconLogout size={18} />}
        />
      </Stack>
    </Drawer>
  );
};

export default UserSheet;
