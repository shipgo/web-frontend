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
  Text,
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
import { modals } from "@mantine/modals";
import dayjs from "dayjs";

import { sucursalApi, authorityApi } from "@api";
import { catalogsApi, locationApi } from "@api";
import { useAuthStore } from "@stores/auth.store";
import {
  rolLabel,
  normalizarRol,
  ROLE_ADMIN,
  ROLE_CARGA,
  ROLE_CHOFER,
  ROLE_SUPERUSER,
} from "@domain/roles";

// Roles asignables desde el panel web (CONTRACTS.md §3): CHOFER/CARGA se dan de
// alta acá pero solo operan desde la app; ROLE_CUSTOMER nunca se asigna desde acá
// (se auto-registra). Se usa como allow-list para filtrar el catálogo real de
// `authorityApi.getAll()` — no como fuente de datos en sí.
const ASSIGNABLE_ROLES = [ROLE_SUPERUSER, ROLE_ADMIN, ROLE_CHOFER, ROLE_CARGA];

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

  // Mismo patrón de cancelación que el `Footer` canónico de `CrearEnvios`:
  // si hay cambios sin guardar se pide confirmación antes de salir.
  const handleCancel = () => {
    if (!form.isDirty()) {
      onCancel();
      return;
    }
    modals.openConfirmModal({
      title: isEdit ? "Cancelar edición" : "Cancelar creación",
      children: (
        <Text size="sm">
          Tenés cambios sin guardar. ¿Seguro que querés salir?
        </Text>
      ),
      labels: { confirm: "Sí, cancelar", cancel: "Seguir editando" },
      confirmProps: { color: "red" },
      cancelProps: { variant: "subtle" },
      groupProps: { gap: "xs" },
      onConfirm: onCancel,
    });
  };
  const isSuper = user?.hasRole(ROLE_SUPERUSER);
  const isAdmin = user?.hasRole(ROLE_ADMIN);

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

        // `results[resultIndex]` es la respuesta de `authorityApi.getAll()` (catálogo
        // real del backend, `GET /api/authority/all`). Se filtra a los roles
        // asignables desde la web y, si quien crea/edita no es SUPERUSER, se saca
        // ROLE_SUPERUSER de las opciones (solo un SUPERUSER puede crear otro).
        const authoritiesRaw = results[resultIndex] || [];
        const authoritiesData = authoritiesRaw
          .map((a) => normalizarRol(a))
          .filter((rol) => ASSIGNABLE_ROLES.includes(rol))
          .map((rol) => ({ value: rol, label: rolLabel(rol) }));

        setAuthorities(
          isSuper
            ? authoritiesData
            : authoritiesData.filter((auth) => auth.value !== ROLE_SUPERUSER)
        );

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

  // Un ADMIN no elige sucursal para el usuario que crea/edita: siempre queda
  // asignado a la sucursal propia del ADMIN (CONTRACTS.md §3). No se muestra el
  // Select para ADMIN (más abajo) y acá se fuerza el valor en el form.
  useEffect(() => {
    if (!isSuper && user?.sucursal?.id) {
      form.setFieldValue("sucursalID", user.sucursal.id.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuper, user?.sucursal?.id]);

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
                maxDate={dayjs().format("YYYY-MM-DD")}
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
              {isSuper ? (
                <Select
                  label="Sucursal"
                  placeholder="Seleccione (opcional)"
                  data={sucursales}
                  searchable
                  filter={filterIgnoreAccents}
                  clearable
                  {...form.getInputProps("sucursalID")}
                />
              ) : (
                <TextInput
                  label="Sucursal"
                  description="Los usuarios que crees quedan asignados a tu sucursal"
                  value={user?.sucursal?.nombre || ""}
                  disabled
                />
              )}
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Botones de acción — consistentes con el Footer canónico de CrearEnvios */}
        <Group justify="flex-end" gap="xs">
          <Button
            variant="light"
            color="red"
            disabled={loading}
            onClick={handleCancel}
          >
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

