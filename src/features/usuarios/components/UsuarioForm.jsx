import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Group,
  LoadingOverlay,
  MultiSelect,
  Select,
  SimpleGrid,
  Stack,
  Title,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconUser,
  IconMail,
  IconMapPin,
  IconBriefcase,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { sucursalApi, authorityApi } from "@api";
import { catalogsApi, locationApi } from "@api";
import { useAuthStore } from "@stores/auth.store";

const AUTHORITIES = ["ROLE_SUPER", "ROLE_ADMIN", "ROLE_CHOFER"];

const normalizeText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const filterIgnoreAccents = ({ options, search }) => {
  if (!search) return options;

  const normalizedSearch = normalizeText(search);
  const splittedSearch = normalizedSearch.trim().split(" ");

  return options.filter((option) => {
    const normalizedLabel = normalizeText(option.label || "");
    const words = normalizedLabel.trim().split(" ");
    return splittedSearch.every((searchWord) =>
      words.some((word) => word.includes(searchWord))
    );
  });
};

/**
 * Componente de formulario reutilizable para crear/editar usuarios
 * @param {Object} props
 * @param {Object} props.form - Instancia de useForm de Mantine
 * @param {Function} props.onSubmit - Función a ejecutar al enviar el formulario
 * @param {boolean} props.loading - Estado de carga del submit
 * @param {Function} props.onCancel - Función para cancelar
 * @param {boolean} props.isEdit - Si es modo edición o creación
 */
const UsuarioForm = ({ form, onSubmit, loading, onCancel, isEdit = false }) => {
  const { user } = useAuthStore();
  const isSuper = user?.hasRole("ROLE_SUPER");
  const isAdmin = user?.hasRole("ROLE_ADMIN");

  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [sucursales, setSucursales] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [sexos, setSexos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setCatalogsLoading(true);

        const promises = [
          authorityApi.getAll(),
          catalogsApi.getTiposDocumento(),
          catalogsApi.getSexos(),
          locationApi.getProvincias(),
        ];

        if (isSuper) {
          promises.unshift(sucursalApi.getAll());
        }

        const results = await Promise.all(promises);

        let resultIndex = 0;

        if (isSuper) {
          setSucursales(
            results[resultIndex].map((s) => ({
              value: s.id.toString(),
              label: s.nombre,
            }))
          );
          resultIndex++;
        }

        const authoritiesData = AUTHORITIES.map((a) => ({
          value: a,
          label: a.replace("ROLE_", ""),
        }));

        if (isSuper) {
          setAuthorities(authoritiesData);
        } else {
          setAuthorities(
            authoritiesData.filter((auth) => auth.value !== "ROLE_SUPER")
          );
        }

        setTiposDocumento(
          results[resultIndex + 1].map((t) => ({
            value: t.id.toString(),
            label: t.nombre,
          }))
        );

        setSexos(
          results[resultIndex + 2].map((s) => ({
            value: s.id.toString(),
            label: s.nombre,
          }))
        );

        setProvincias(
          results[resultIndex + 3].map((p) => ({
            value: p.id.toString(),
            label: p.nombre,
          }))
        );
      } catch (error) {
        console.error("Error cargando catálogos:", error);
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar los catálogos necesarios",
          color: "red",
        });
      } finally {
        setCatalogsLoading(false);
      }
    };

    loadCatalogs();
  }, [isSuper, isAdmin]);

  // Cargar localidades cuando cambia la provincia
  useEffect(() => {
    const loadLocalidades = async () => {
      const provinciaID = form.values.provinciaID;

      if (!provinciaID) {
        setLocalidades([]);
        return;
      }

      try {
        const localidadesRes = await locationApi.getLocalidadesByProvincia(
          provinciaID
        );
        setLocalidades(
          localidadesRes.map((l) => ({
            value: l.id.toString(),
            label: l.nombre,
          }))
        );
      } catch (error) {
        console.error("Error cargando localidades:", error);
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las localidades",
          color: "red",
        });
      }
    };

    loadLocalidades();
  }, [form.values.provinciaID]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack>
        {/* Información Personal */}
        <Card pos="relative">
          <LoadingOverlay
            visible={catalogsLoading}
            overlayProps={{ radius: "md", blur: 2 }}
          />

          <Stack gap="md">
            <Group gap="0.75rem">
              <IconUser size={20} />
              <Title order={4}>Información personal</Title>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              <TextInput
                label="Usuario"
                placeholder="Ej: jperez"
                required
                disabled={isEdit}
                {...form.getInputProps("username")}
              />
              <TextInput
                label="Nombre"
                placeholder="Ej: Juan"
                required
                {...form.getInputProps("nombre")}
              />
              <TextInput
                label="Apellido"
                placeholder="Ej: Pérez"
                required
                {...form.getInputProps("apellido")}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              <DateInput
                label="Fecha de Nacimiento"
                placeholder="Seleccione la fecha"
                required
                valueFormat="DD/MM/YYYY"
                maxDate={new Date()}
                {...form.getInputProps("fechaNacimiento")}
              />
              <Select
                label="Tipo de Documento"
                placeholder="Seleccione"
                required
                data={tiposDocumento}
                searchable
                filter={filterIgnoreAccents}
                {...form.getInputProps("tipoDocumentoID")}
              />
              <TextInput
                label="DNI"
                placeholder="Ej: 12345678"
                required
                {...form.getInputProps("dni")}
              />
              <Select
                label="Sexo"
                placeholder="Seleccione"
                required
                data={sexos}
                {...form.getInputProps("sexoID")}
              />
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Información de Contacto */}
        <Card>
          <Stack gap="md">
            <Group gap="0.75rem">
              <IconMail size={20} />
              <Title order={4}>Información de contacto</Title>
            </Group>

            <TextInput
              label="Email"
              placeholder="Ej: juan@example.com"
              required
              type="email"
              {...form.getInputProps("email")}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <TextInput
                label="Prefijo"
                placeholder="Ej: +54"
                required
                {...form.getInputProps("prefijo")}
              />
              <TextInput
                label="Teléfono"
                placeholder="Ej: 1234567890"
                required
                {...form.getInputProps("telefono")}
              />
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Dirección */}
        <Card>
          <Stack gap="md">
            <Group gap="0.75rem">
              <IconMapPin size={20} />
              <Title order={4}>Dirección</Title>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <TextInput
                label="Nombre de Calle"
                placeholder="Ej: Av. Corrientes"
                required
                {...form.getInputProps("nombreCalle")}
              />
              <TextInput
                label="Número de Calle"
                placeholder="Ej: 1234"
                required
                {...form.getInputProps("numeroCalle")}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <Select
                label="Provincia"
                placeholder="Seleccione"
                required
                data={provincias}
                searchable
                filter={filterIgnoreAccents}
                {...form.getInputProps("provinciaID")}
                onChange={(value) => {
                  form.setFieldValue("provinciaID", value);
                  form.setFieldValue("localidadID", null);
                }}
              />
              <Select
                label="Localidad"
                placeholder="Seleccione primero una provincia"
                required
                data={localidades}
                searchable
                filter={filterIgnoreAccents}
                disabled={!form.values.provinciaID}
                {...form.getInputProps("localidadID")}
              />
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Información Laboral */}
        <Card>
          <Stack gap="md">
            <Group gap="0.75rem">
              <IconBriefcase size={20} />
              <Title order={4}>Información laboral</Title>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <MultiSelect
                label="Roles"
                placeholder="Seleccione los roles"
                required
                data={authorities}
                searchable
                filter={filterIgnoreAccents}
                hidePickedOptions
                {...form.getInputProps("authorities")}
              />
              {isSuper && (
                <Select
                  label="Sucursal"
                  placeholder={
                    isAdmin ? "Sucursal asignada" : "Seleccione (opcional)"
                  }
                  data={sucursales}
                  searchable
                  filter={filterIgnoreAccents}
                  clearable={isSuper}
                  {...form.getInputProps("sucursalID")}
                />
              )}
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Botones de acción */}
        <Group justify="flex-end" gap="xs">
          <Button variant="subtle" color="red" disabled={loading} onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {isEdit ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default UsuarioForm;

