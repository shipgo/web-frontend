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

import { EMPTY } from "@domain/format";
import { toLocalDate } from "@utils/dates";
import { rolBadge } from "@domain/roles";
import { useIsMobile } from "@hooks/useIsMobile";
import FormSections from "./FormSections";
import { useFormSections } from "./useFormSections";
import { iniciales, nombreCompleto, tieneNombre } from "@domain/usuario";

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
        {value || EMPTY}
      </Text>
    </Stack>
  </Group>
);


/**
 * Componente reutilizable para mostrar el perfil/detalle de un usuario
 * @param {Object} props
 * @param {Object} props.usuario - Datos del usuario a mostrar
 * @param {boolean} props.showAllInfo - Si debe mostrar toda la información o solo la básica
 */
const UsuarioPerfilContenido = ({ usuario, showAllInfo }) => {
  const isMobile = useIsMobile();
  const fullName = nombreCompleto(usuario, "Sin nombre");
  const initials = iniciales(usuario) || "U";

  const authorities = usuario.authorities || [];

  const sections = [
    {
      value: "personal",
      title: "Información personal",
      icon: <IconUser size={20} stroke={1.5} />,
      fields: [],
      children: (
        <>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                <InfoItem
                  icon={IconUser}
                  label="Nombre completo"
                  value={tieneNombre(usuario) ? fullName : null}
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
        </>
      ),
    },
    {
      value: "contacto",
      title: "Información de contacto",
      icon: <IconPhone size={20} stroke={1.5} />,
      fields: [],
      children: (
        <>
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
        </>
      ),
    },
    {
      value: "direccion",
      title: "Dirección",
      icon: <IconMapPin size={20} stroke={1.5} />,
      fields: [],
      children: (
        <>
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
        </>
      ),
    },
    {
      value: "laboral",
      title: "Información laboral",
      icon: <IconBriefcase size={20} stroke={1.5} />,
      fields: [],
      children: (
        <>
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
                    {authorities.map((auth, index) => {
                      const rol = rolBadge(auth);
                      return (
                        <Badge key={index} color={rol.color} variant="filled" size="md">
                          {rol.label}
                        </Badge>
                      );
                    })}
                  </Group>
                </Stack>
              </SimpleGrid>
        </>
      ),
    },
  ];
  const { opened, setOpened } = useFormSections(sections);

  return (
    <Stack>
      {/* Información Principal */}
      <Card>
        <Group align="flex-start" gap={isMobile ? "md" : "xl"} wrap="nowrap">
          {/* Avatar */}
          <Avatar
            src={
              usuario.profile
                ? `/api${API_URLS.FILES_URL}/${usuario.profile}`
                : null
            }
            size={isMobile ? 72 : 120}
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
              <Title order={isMobile ? 3 : 2}>{fullName}</Title>
              <Text size="sm" c="dimmed">
                @{usuario.username}
              </Text>
            </div>

            <Group gap="xs">
              {authorities.map((auth, index) => {
                const rol = rolBadge(auth);
                return (
                  <Badge key={index} color={rol.color} variant="light" size="lg">
                    {rol.label}
                  </Badge>
                );
              })}
            </Group>
          </Stack>
        </Group>
      </Card>

      {showAllInfo && (
        <FormSections sections={sections} opened={opened} onChange={setOpened} />
      )}
    </Stack>
  );
};

const UsuarioPerfil = ({ usuario, showAllInfo = true }) =>
  usuario ? (
    <UsuarioPerfilContenido usuario={usuario} showAllInfo={showAllInfo} />
  ) : (
    <Card>
      <Text c="dimmed">No se encontró información del usuario</Text>
    </Card>
  );

export default UsuarioPerfil;
