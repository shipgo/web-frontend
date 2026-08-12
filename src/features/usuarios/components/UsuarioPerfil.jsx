import { API_URLS } from "@constants/apiUrls";
import {
  Avatar,
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconAt,
  IconBriefcase,
  IconBuilding,
  IconCalendar,
  IconId,
  IconMapPin,
  IconPhone,
  IconUser,
} from "@tabler/icons-react";

import { toLocalDate } from "@utils/dates";

const InfoItem = ({ icon: Icon, label, value, color = "blue" }) => (
  <Group gap="sm" wrap="nowrap">
    <Icon
      size={20}
      stroke={1.5}
      style={{ color: `var(--mantine-color-${color}-6)` }}
    />
    <Stack gap={0} style={{ flex: 1 }}>
      <Text size="xs" c="dimmed" fw={500}>
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value || "No especificado"}
      </Text>
    </Stack>
  </Group>
);

const getRolColor = (rol) => {
  const normalizedRol = rol?.toUpperCase();
  const colores = {
    ADMIN: "red",
    ROLE_ADMIN: "red",
    SUPER: "violet",
    ROLE_SUPER: "violet",
    CHOFER: "blue",
    ROLE_CHOFER: "blue",
    SUPERVISOR: "yellow",
    ROLE_SUPERVISOR: "yellow",
  };
  return colores[normalizedRol] || "gray";
};

const getRolLabel = (authority) => {
  const rolName = authority?.name || authority?.authority || authority || "";
  return rolName.replace("ROLE_", "").replace(/_/g, " ");
};

/**
 * Componente reutilizable para mostrar el perfil/detalle de un usuario
 * @param {Object} props
 * @param {Object} props.usuario - Datos del usuario a mostrar
 * @param {boolean} props.showAllInfo - Si debe mostrar toda la información o solo la básica
 */
const UsuarioPerfil = ({ usuario, showAllInfo = true }) => {
  if (!usuario) {
    return (
      <Card>
        <Text c="dimmed">No se encontró información del usuario</Text>
      </Card>
    );
  }

  const fullName =
    usuario.nombre && usuario.apellido
      ? `${usuario.nombre} ${usuario.apellido}`
      : usuario.nombre || usuario.username || "Sin nombre";

  const initials =
    usuario.nombre && usuario.apellido
      ? `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`
      : usuario.username?.charAt(0) || "U";

  const authorities = usuario.authorities || [];

  return (
    <Stack>
      {/* Información Principal */}
      <Card>
        <Group align="flex-start" gap="xl" wrap="nowrap">
          {/* Avatar */}
          <Avatar
            src={
              usuario.profile
                ? `/api${API_URLS.FILES_URL}/${usuario.profile}`
                : null
            }
            size={120}
            radius="md"
          >
            {!usuario.profile && (
              <Text size="xl" fw={700}>
                {initials}
              </Text>
            )}
          </Avatar>

          {/* Información básica */}
          <Stack gap="sm" style={{ flex: 1 }}>
            <div>
              <Title order={2}>{fullName}</Title>
              <Text size="sm" c="dimmed">
                @{usuario.username}
              </Text>
            </div>

            <Group gap="xs">
              {authorities.map((auth, index) => (
                <Badge
                  key={index}
                  color={getRolColor(auth.name || auth.authority || auth)}
                  variant="light"
                  size="lg"
                >
                  {getRolLabel(auth)}
                </Badge>
              ))}
            </Group>
          </Stack>
        </Group>
      </Card>

      {showAllInfo && (
        <>
          {/* Información Personal */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconUser size={20} stroke={1.5} />
                <Title order={4}>Información personal</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                <InfoItem
                  icon={IconUser}
                  label="Nombre completo"
                  value={fullName}
                />
                <InfoItem
                  icon={IconId}
                  label="Tipo de documento"
                  value={usuario.tipoDocumento?.nombre}
                />
                <InfoItem icon={IconId} label="DNI" value={usuario.dni} />
                <InfoItem
                  icon={IconUser}
                  label="Sexo"
                  value={usuario.sexo?.nombre}
                />
                <InfoItem
                  icon={IconCalendar}
                  label="Fecha de nacimiento"
                  value={
                    usuario.fechaNacimiento
                      ? toLocalDate(usuario.fechaNacimiento)
                      : null
                  }
                />
                <InfoItem
                  icon={IconCalendar}
                  label="Fecha de registro"
                  value={
                    usuario.fechaCreacion
                      ? toLocalDate(usuario.fechaCreacion)
                      : null
                  }
                />
              </SimpleGrid>
            </Stack>
          </Card>

          {/* Información de Contacto */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconPhone size={20} stroke={1.5} />
                <Title order={4}>Información de contacto</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <InfoItem
                  icon={IconAt}
                  label="Email"
                  value={usuario.email}
                  color="cyan"
                />
                <InfoItem
                  icon={IconPhone}
                  label="Teléfono"
                  value={
                    usuario.prefijo && usuario.telefono
                      ? `${usuario.prefijo} ${usuario.telefono}`
                      : null
                  }
                  color="green"
                />
              </SimpleGrid>
            </Stack>
          </Card>

          {/* Dirección */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconMapPin size={20} stroke={1.5} />
                <Title order={4}>Dirección</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <InfoItem
                  icon={IconMapPin}
                  label="Calle"
                  value={
                    usuario.nombreCalle && usuario.numeroCalle
                      ? `${usuario.nombreCalle} ${usuario.numeroCalle}`
                      : null
                  }
                  color="red"
                />
                <InfoItem
                  icon={IconMapPin}
                  label="Localidad"
                  value={usuario.localidad?.nombre}
                  color="red"
                />
                <InfoItem
                  icon={IconMapPin}
                  label="Provincia"
                  value={usuario.localidad?.provincia?.nombre}
                  color="red"
                />
              </SimpleGrid>
            </Stack>
          </Card>

          {/* Información Laboral */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconBriefcase size={20} stroke={1.5} />
                <Title order={4}>Información laboral</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <InfoItem
                  icon={IconBuilding}
                  label="Sucursal"
                  value={usuario.sucursal?.nombre}
                  color="violet"
                />
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconBriefcase
                      size={20}
                      stroke={1.5}
                      style={{ color: "var(--mantine-color-violet-6)" }}
                    />
                    <Text size="xs" c="dimmed" fw={500}>
                      Roles asignados
                    </Text>
                  </Group>
                  <Group gap="xs">
                    {authorities.map((auth, index) => (
                      <Badge
                        key={index}
                        color={getRolColor(auth.name || auth.authority || auth)}
                        variant="filled"
                        size="md"
                      >
                        {getRolLabel(auth)}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </SimpleGrid>
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
};

export default UsuarioPerfil;
