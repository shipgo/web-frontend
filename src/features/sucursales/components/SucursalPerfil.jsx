import {
  Accordion,
  Box,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconBuilding,
  IconMail,
  IconMapPin,
  IconPhone,
} from "@tabler/icons-react";

import { useIsMobile } from "@hooks/useIsMobile";

const InfoItem = ({ icon, label, value }) => (
  <Box>
    <Group gap="xs" mb={4}>
      {icon}
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
    </Group>
    <Text size="sm" fw={500}>
      {value || "-"}
    </Text>
  </Box>
);

/**
 * Componente reutilizable para mostrar el perfil/detalle de una sucursal
 */
const SucursalPerfil = ({ sucursal }) => {
  const isMobile = useIsMobile();

  if (!sucursal) {
    return (
      <Card>
        <Text c="dimmed">No se encontró información de la sucursal</Text>
      </Card>
    );
  }

  const puntoEntrega = sucursal.puntoEntrega || {};
  const localidad = puntoEntrega.localidad || {};
  const provincia = localidad.provincia || {};

  const direccion =
    puntoEntrega.nombreCalle || puntoEntrega.numeroCalle
      ? `${puntoEntrega.nombreCalle || ""} ${puntoEntrega.numeroCalle || ""}`.trim()
      : "Sin dirección";

  const telefono = sucursal.prefijo
    ? `${sucursal.prefijo} ${sucursal.telefono || ""}`.trim()
    : sucursal.telefono || "Sin teléfono";

  const sections = [
    {
      value: "seccion-0",
      icon: <IconBuilding size={20} />,
      title: "Información de la sucursal",
      content: (
        <>
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <InfoItem
        icon={<IconBuilding size={16} />}
        label="Nombre"
        value={sucursal.nombre}
      />
      <InfoItem
        icon={<IconMail size={16} />}
        label="Email"
        value={sucursal.email}
      />
      <InfoItem
        icon={<IconPhone size={16} />}
        label="Teléfono"
        value={telefono}
      />
    </SimpleGrid>
        </>
      ),
    },
    {
      value: "seccion-1",
      icon: <IconMapPin size={20} />,
      title: "Dirección",
      content: (
        <>
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      <InfoItem
        icon={<IconMapPin size={16} />}
        label="Calle"
        value={direccion}
      />
      <InfoItem
        icon={<IconMapPin size={16} />}
        label="Localidad"
        value={localidad.nombre}
      />
      <InfoItem
        icon={<IconMapPin size={16} />}
        label="Provincia"
        value={provincia.nombre}
      />
    </SimpleGrid>
        </>
      ),
    },
  ];

  if (isMobile) {
    return (
      <Accordion multiple defaultValue={[sections[0].value]} variant="separated">
        {sections.map(({ value, icon, title, content }) => (
          <Accordion.Item key={value} value={value}>
            <Accordion.Control icon={icon}>
              <Title order={4}>{title}</Title>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">{content}</Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  }

  return (
    <Stack>
      {sections.map(({ value, icon, title, content }) => (
        <Card key={value}>
          <Stack gap="md">
            <Group gap="0.75rem">
              {icon}
              <Title order={4}>{title}</Title>
            </Group>

            {content}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
};

export default SucursalPerfil;
