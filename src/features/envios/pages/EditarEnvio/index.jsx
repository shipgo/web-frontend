import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ActionIcon,
  Box,
  Button,
  Card,
  Group,
  NumberFormatter,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconMail,
  IconMapPin,
  IconPackage,
  IconPhone,
  IconTrash,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import ScreenContainer from "@components/ScreenContainer";
import { envioApi, categoriaApi, provinciaApi, localidadApi } from "@api";

import DetalleEnvioModal from "./components/DetalleEnvioModal";

const INITIAL_VALUES = {
  nombre: "",
  apellido: "",
  emailRemitente: "",
  emailReceptor: "",
  prefijo: "",
  telefono: "",
  nombreCalle: "",
  numeroCalle: "",
  provinciaID: null,
  localidadID: null,
  detalleEnvios: [],
};

const getCategoriaLabel = (categorias, categoriaID) =>
  categorias.find((c) => c.value === String(categoriaID))?.label ?? "-";

const EditarEnvio = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  // Metadata que no forma parte de los inputs del form pero se necesita al armar el payload
  const [destinoMeta, setDestinoMeta] = useState({ id: null, latitud: 0, longitud: 0 });

  const form = useForm({
    mode: "controlled",
    initialValues: INITIAL_VALUES,
    validate: {
      nombre: (value) => (!value?.trim() ? "El nombre es requerido" : null),
      apellido: (value) => (!value?.trim() ? "El apellido es requerido" : null),
      emailRemitente: (value) =>
        !value || !/^\S+@\S+\.\S+$/.test(value) ? "Email inválido" : null,
      emailReceptor: (value) =>
        !value || !/^\S+@\S+\.\S+$/.test(value) ? "Email inválido" : null,
      prefijo: (value) => (!value?.trim() ? "El prefijo es requerido" : null),
      telefono: (value) => (!value?.trim() ? "El teléfono es requerido" : null),
      nombreCalle: (value) => (!value?.trim() ? "La calle es requerida" : null),
      localidadID: (value) => (!value ? "Seleccioná una localidad" : null),
      detalleEnvios: (value) =>
        !value || value.length === 0 ? "Agregá al menos un paquete" : null,
    },
  });

  // Cargar catálogos
  useEffect(() => {
    categoriaApi
      .getAll()
      .then((data) =>
        setCategorias(
          (data ?? []).map((c) => ({ value: String(c.id), label: c.nombre }))
        )
      )
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las categorías",
          color: "red",
          icon: <IconX />,
        });
      });

    provinciaApi
      .getAll()
      .then((data) =>
        setProvincias(
          (data ?? []).map((p) => ({ value: String(p.id), label: p.nombre }))
        )
      )
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las provincias",
          color: "red",
          icon: <IconX />,
        });
      });
  }, []);

  // Cargar localidades cuando cambia la provincia
  useEffect(() => {
    const provinciaID = form.values.provinciaID;
    if (!provinciaID) {
      setLocalidades([]);
      return;
    }
    localidadApi
      .getByProvincia(provinciaID)
      .then((data) =>
        setLocalidades(
          (data ?? []).map((l) => ({ value: String(l.id), label: l.nombre }))
        )
      )
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las localidades",
          color: "red",
          icon: <IconX />,
        });
      });
  }, [form.values.provinciaID]);

  // Cargar el envío existente
  useEffect(() => {
    if (!id) return;

    const loadEnvio = async () => {
      try {
        setLoading(true);
        const envio = await envioApi.getById(id);
        const destino = envio.destino ?? {};
        const localidad = destino.localidad ?? {};
        const provincia = localidad.provincia ?? {};

        form.setValues({
          nombre: envio.nombre ?? "",
          apellido: envio.apellido ?? "",
          emailRemitente: envio.emailRemitente ?? "",
          emailReceptor: envio.emailReceptor ?? "",
          prefijo: envio.prefijo ?? "",
          telefono: envio.telefono ?? "",
          nombreCalle: destino.nombreCalle ?? "",
          numeroCalle: destino.numeroCalle ?? "",
          provinciaID: provincia.id ? String(provincia.id) : null,
          localidadID: localidad.id ? String(localidad.id) : null,
          detalleEnvios: (envio.detalleEnvios ?? []).map((d) => ({
            id: d.id,
            categoriaID: d.categoria?.id ? String(d.categoria.id) : null,
            descripcion: d.descripcion ?? "",
            peso: d.peso,
          })),
        });
        form.resetDirty();

        setDestinoMeta({
          id: destino.id ?? null,
          latitud: destino.latitud ?? 0,
          longitud: destino.longitud ?? 0,
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddPaquete = (paquete) => {
    form.insertListItem("detalleEnvios", paquete);
  };

  const handleEditPaquete = (index, paquete) => {
    form.setFieldValue(`detalleEnvios.${index}`, paquete);
  };

  const handleRemovePaquete = (index) => {
    form.removeListItem("detalleEnvios", index);
  };

  const handleSubmit = form.onSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const payload = {
        nombre: values.nombre,
        apellido: values.apellido,
        emailRemitente: values.emailRemitente,
        emailReceptor: values.emailReceptor,
        prefijo: values.prefijo,
        telefono: values.telefono,
        destino: {
          id: destinoMeta.id ?? undefined,
          nombreCalle: values.nombreCalle,
          numeroCalle: values.numeroCalle,
          localidad: { id: Number(values.localidadID) },
          latitud: destinoMeta.latitud ?? 0,
          longitud: destinoMeta.longitud ?? 0,
        },
        detalleEnvios: values.detalleEnvios.map((d) => ({
          id: d.id ?? undefined,
          categoria: { id: Number(d.categoriaID) },
          descripcion: d.descripcion || null,
          peso: Number(d.peso),
        })),
      };

      await envioApi.update(id, payload);

      notifications.show({
        title: "Éxito",
        message: "El envío fue actualizado correctamente",
        color: "green",
        icon: <IconCheck />,
      });

      navigate("~/envios");
    } catch (error) {
      console.error("Error actualizando envío:", error);
      notifications.show({
        title: "Error",
        message:
          error?.response?.data?.mensaje ||
          error?.response?.data?.message ||
          "No se pudo actualizar el envío",
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando envío...</Text>
        </Card>
      </PageContainer>
    );
  }

  const paquetes = form.values.detalleEnvios;

  return (
    <PageContainer>
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Editar envío</Title>
          <Text c="dimmed">Modificá los datos del envío #{id}</Text>
        </Box>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => navigate("~/envios")}
        >
          Volver
        </Button>
      </Group>

      <form onSubmit={handleSubmit} noValidate>
        <Stack>
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconUser size={20} />
                <Title order={4}>Remitente y receptor</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  key={form.key("nombre")}
                  {...form.getInputProps("nombre")}
                  required
                  label="Nombre"
                  placeholder="Ej: Juan"
                />
                <TextInput
                  key={form.key("apellido")}
                  {...form.getInputProps("apellido")}
                  required
                  label="Apellido"
                  placeholder="Ej: García"
                />
                <TextInput
                  key={form.key("emailRemitente")}
                  {...form.getInputProps("emailRemitente")}
                  required
                  type="email"
                  leftSection={<IconMail size={16} />}
                  label="Email del remitente"
                  placeholder="remitente@ejemplo.com"
                />
                <TextInput
                  key={form.key("emailReceptor")}
                  {...form.getInputProps("emailReceptor")}
                  required
                  type="email"
                  leftSection={<IconMail size={16} />}
                  label="Email del receptor"
                  placeholder="receptor@ejemplo.com"
                />
                <TextInput
                  key={form.key("prefijo")}
                  {...form.getInputProps("prefijo")}
                  required
                  leftSection={<IconPhone size={16} />}
                  label="Prefijo"
                  placeholder="Ej: 351"
                />
                <TextInput
                  key={form.key("telefono")}
                  {...form.getInputProps("telefono")}
                  required
                  leftSection={<IconPhone size={16} />}
                  label="Teléfono"
                  placeholder="Ej: 1234567"
                />
              </SimpleGrid>
            </Stack>
          </Card>

          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconMapPin size={20} />
                <Title order={4}>Destino</Title>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  key={form.key("nombreCalle")}
                  {...form.getInputProps("nombreCalle")}
                  required
                  label="Calle"
                  placeholder="Ej: Av. Colón"
                />
                <TextInput
                  key={form.key("numeroCalle")}
                  {...form.getInputProps("numeroCalle")}
                  label="Número"
                  placeholder="Ej: 1234"
                />
                <Select
                  label="Provincia"
                  placeholder="Seleccioná una provincia"
                  data={provincias}
                  searchable
                  value={form.values.provinciaID}
                  onChange={(value) => {
                    form.setFieldValue("provinciaID", value);
                    form.setFieldValue("localidadID", null);
                  }}
                />
                <Select
                  key={form.key("localidadID")}
                  {...form.getInputProps("localidadID")}
                  required
                  label="Localidad"
                  placeholder="Seleccioná una localidad"
                  data={localidades}
                  searchable
                  disabled={!form.values.provinciaID}
                />
              </SimpleGrid>
            </Stack>
          </Card>

          <Card>
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="0.75rem">
                  <IconPackage size={20} />
                  <Title order={4}>Paquetes</Title>
                </Group>
                <DetalleEnvioModal categorias={categorias} onSave={handleAddPaquete} />
              </Group>

              {form.errors.detalleEnvios && (
                <Text c="red" size="sm">
                  {form.errors.detalleEnvios}
                </Text>
              )}

              <ScreenContainer
                onEmptyData={{
                  show: paquetes.length === 0,
                  title: "Sin paquetes cargados",
                  description:
                    'Usá el botón "Añadir paquete" para agregar paquetes al envío',
                }}
              >
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Categoría</Table.Th>
                      <Table.Th>Peso</Table.Th>
                      <Table.Th>Descripción</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paquetes.map((paquete, index) => (
                      <Table.Tr key={paquete.id ?? `nuevo-${index}`}>
                        <Table.Td>{index + 1}</Table.Td>
                        <Table.Td>
                          <DetalleEnvioModal
                            categorias={categorias}
                            initialValues={paquete}
                            onSave={(updated) => handleEditPaquete(index, updated)}
                            trigger={getCategoriaLabel(categorias, paquete.categoriaID)}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberFormatter value={paquete.peso} suffix=" kg" />
                        </Table.Td>
                        <Table.Td>{paquete.descripcion || "-"}</Table.Td>
                        <Table.Td>
                          <ActionIcon
                            size="lg"
                            color="red"
                            variant="subtle"
                            onClick={() => handleRemovePaquete(index)}
                          >
                            <IconTrash size={20} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScreenContainer>
            </Stack>
          </Card>

          <Group justify="flex-end" gap="xs">
            <Button
              variant="subtle"
              color="red"
              disabled={isSubmitting}
              onClick={() => navigate("~/envios")}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </PageContainer>
  );
};

export default EditarEnvio;
