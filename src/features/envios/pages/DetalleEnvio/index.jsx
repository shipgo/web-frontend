import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconEdit,
  IconMail,
  IconMapPin,
  IconPackage,
  IconPhone,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { envioApi } from "@api";
import { estadoBadge, normalizarEstado } from "@domain/estados";

const ESTADOS_NO_EDITABLES = ["entregado", "rechazado"];

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

const DetalleEnvio = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [envio, setEnvio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadEnvio = async () => {
      try {
        setLoading(true);
        const data = await envioApi.getById(id);
        setEnvio(data);
      } catch (error) {
        console.error("Error cargando envío:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la información del envío",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/envios");
      } finally {
        setLoading(false);
      }
    };

    loadEnvio();
  }, [id, navigate]);

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando envío...</Text>
        </Card>
      </PageContainer>
    );
  }

  if (!envio) {
    return (
      <PageContainer>
        <Card withBorder>
          <Text c="dimmed">No se encontró información del envío</Text>
        </Card>
      </PageContainer>
    );
  }

  const estadoInfo = estadoBadge("envio", envio.estado);
  const canEdit = !ESTADOS_NO_EDITABLES.includes(normalizarEstado(envio.estado));
  const destino = envio.destino ?? {};
  const localidad = destino.localidad ?? {};
  const provincia = localidad.provincia ?? {};
  const direccion = [destino.nombreCalle, destino.numeroCalle].filter(Boolean).join(" ");
  const detalleEnvios = envio.detalleEnvios ?? [];
  const pesoTotal = detalleEnvios.reduce((sum, d) => sum + (d.peso ?? 0), 0);

  return (
    <PageContainer>
      <Card>
        <Group justify="space-between">
          <Box>
            <Group gap="xs" mb={4}>
              <Title order={2}>Detalle del envío</Title>
              {envio.estado && (
                <Badge color={estadoInfo.color} variant="light">
                  {estadoInfo.label}
                </Badge>
              )}
            </Group>
            <Text size="sm" c="dimmed">
              {envio.codigoSeguimiento
                ? `Código de seguimiento: ${envio.codigoSeguimiento}`
                : `Envío #${id}`}
            </Text>
          </Box>
          <Group>
            {canEdit && (
              <Button
                leftSection={<IconEdit size={18} />}
                onClick={() => navigate(`~/envios/editar/${id}`)}
              >
                Editar
              </Button>
            )}
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate("~/envios")}
            >
              Volver
            </Button>
          </Group>
        </Group>
      </Card>

      <Card withBorder shadow="sm" p="xl">
        <Stack gap="md">
          <Group gap="xs">
            <IconUser size={24} />
            <Box>
              <Text size="lg" fw={600}>
                Remitente y receptor
              </Text>
              <Text size="sm" c="dimmed">
                Datos de contacto del envío
              </Text>
            </Box>
          </Group>
          <Divider />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <InfoItem
              icon={<IconUser size={16} />}
              label="Nombre completo"
              value={`${envio.nombre ?? ""} ${envio.apellido ?? ""}`.trim()}
            />
            <InfoItem
              icon={<IconMail size={16} />}
              label="Email remitente"
              value={envio.emailRemitente}
            />
            <InfoItem
              icon={<IconMail size={16} />}
              label="Email receptor"
              value={envio.emailReceptor}
            />
            <InfoItem
              icon={<IconPhone size={16} />}
              label="Teléfono"
              value={
                envio.prefijo || envio.telefono
                  ? `${envio.prefijo ?? ""} ${envio.telefono ?? ""}`.trim()
                  : null
              }
            />
          </SimpleGrid>
        </Stack>
      </Card>

      <Card withBorder shadow="sm" p="xl">
        <Stack gap="md">
          <Group gap="xs">
            <IconMapPin size={24} />
            <Box>
              <Text size="lg" fw={600}>
                Destino
              </Text>
              <Text size="sm" c="dimmed">
                Dirección de entrega
              </Text>
            </Box>
          </Group>
          <Divider />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <InfoItem icon={<IconMapPin size={16} />} label="Dirección" value={direccion} />
            <InfoItem icon={<IconMapPin size={16} />} label="Localidad" value={localidad.nombre} />
            <InfoItem icon={<IconMapPin size={16} />} label="Provincia" value={provincia.nombre} />
          </SimpleGrid>
        </Stack>
      </Card>

      <Card withBorder shadow="sm" p="xl">
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconPackage size={24} />
              <Box>
                <Text size="lg" fw={600}>
                  Paquetes
                </Text>
                <Text size="sm" c="dimmed">
                  {detalleEnvios.length} {detalleEnvios.length === 1 ? "paquete" : "paquetes"} · {pesoTotal} kg en total
                </Text>
              </Box>
            </Group>
          </Group>
          <Divider />
          {detalleEnvios.length === 0 ? (
            <Text c="dimmed" size="sm">
              Este envío no tiene paquetes cargados
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Categoría</Table.Th>
                  <Table.Th>Peso</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {detalleEnvios.map((d, index) => (
                  <Table.Tr key={d.id ?? index}>
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>{d.categoria?.nombre ?? "-"}</Table.Td>
                    <Table.Td>{d.peso != null ? `${d.peso} kg` : "-"}</Table.Td>
                    <Table.Td>{d.descripcion || "-"}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>
    </PageContainer>
  );
};

export default DetalleEnvio;
