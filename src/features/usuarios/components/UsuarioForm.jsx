import { useEffect, useState } from "react";
import {
  Box,
  Button,
  LoadingOverlay,
  MultiSelect,
  Select,
  SimpleGrid,
  Text,
  TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconUser, IconMail, IconMapPin, IconBriefcase } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import dayjs from "dayjs";

import PageFooter from "@components/PageFooter";
import { useFieldSize } from "@components/useFieldSize";
import { useIsMobile } from "@hooks/useIsMobile";
import FormSections from "./FormSections";
import { useFormSections } from "./useFormSections";
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
import { SALIR_SIN_GUARDAR, REINTENTAR_MAS_TARDE } from "@copy/common";

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
 * @param {boolean} [props.usernameEditable] - Permite editar el username aunque sea edición
 *   ("Completá tu cuenta", SHG-FE-133)
 * @param {boolean} [props.hideCancel] - Oculta el botón Cancelar
 * @param {boolean} [props.lockRolesAndSucursal] - Roles y sucursal no editables (se mandan los actuales)
 * @param {string} [props.submitLabel] - Texto del botón de submit
 */
const UsuarioForm = ({
  form,
  onSubmit,
  loading,
  onCancel,
  isEdit = false,
  usernameEditable = false,
  hideCancel = false,
  submitLabel,
  lockRolesAndSucursal = false,
}) => {
  const { user } = useAuthStore();

  // Mismo patrón de cancelación que el `Footer` canónico de `CrearEnvios`:
  // si hay cambios sin guardar se pide confirmación antes de salir.
  const handleCancel = () => {
    if (!form.isDirty()) {
      onCancel();
      return;
    }
    modals.openConfirmModal({
      title: SALIR_SIN_GUARDAR.titulo,
      children: (
        <Text size="sm">{SALIR_SIN_GUARDAR.mensaje}</Text>
      ),
      labels: { confirm: SALIR_SIN_GUARDAR.salir, cancel: SALIR_SIN_GUARDAR.seguir },
      confirmProps: { color: "red" },
      cancelProps: { variant: "subtle" },
      groupProps: { gap: "xs" },
      onConfirm: onCancel,
    });
  };
  const size = useFieldSize();
  const isMobile = useIsMobile();
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
        // ROLE_SUPERUSER y ROLE_ADMIN de las opciones (solo un SUPERUSER puede
        // asignar esos roles; el backend responde 403 a un ADMIN, SHG-BE-107).
        const authoritiesRaw = results[resultIndex] || [];
        const authoritiesData = authoritiesRaw
          .map((a) => normalizarRol(a))
          .filter((rol) => ASSIGNABLE_ROLES.includes(rol))
          .map((rol) => ({ value: rol, label: rolLabel(rol) }));

        setAuthorities(
          isSuper
            ? authoritiesData
            : authoritiesData.filter(
                (auth) => auth.value !== ROLE_SUPERUSER && auth.value !== ROLE_ADMIN
              )
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
          title: "No se pudieron cargar las opciones del formulario",
          message: REINTENTAR_MAS_TARDE,
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
          title: "No se pudieron cargar las localidades",
          message: REINTENTAR_MAS_TARDE,
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

  // Un ADMIN que edita a alguien con un rol que no puede asignar (ADMIN o
  // SUPERUSER): ese rol ya no está entre las opciones, así que el campo quedaría
  // vacío y un cambio accidental se mandaría al backend. Se muestra el rol actual
  // (etiqueta legible) y el campo queda deshabilitado; el valor sigue en el form.
  const rolesActuales = Array.isArray(form.values.authorities)
    ? form.values.authorities
    : [];
  const rolesNoAsignables = isSuper
    ? []
    : rolesActuales.filter((rol) => !authorities.some((a) => a.value === rol));
  const rolesBloqueados = lockRolesAndSucursal || (isEdit && rolesNoAsignables.length > 0);
  const rolesData = rolesBloqueados
    ? [
        ...authorities,
        ...rolesNoAsignables.map((rol) => ({ value: rol, label: rolLabel(rol) })),
      ]
    : authorities;

  const sections = [
    {
      value: "personal",
      title: "Información personal",
      icon: <IconUser size={20} />,
      fields: ["username", "nombre", "apellido", "fechaNacimiento", "tipoDocumentoID", "dni", "sexoID"],
      cardProps: { pos: "relative" },
      children: (
        <>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={isMobile ? "md" : "lg"}>
              <TextInput
                size={size}
                label="Usuario"
                placeholder="Ej: jperez"
                required
                disabled={isEdit && !usernameEditable}
                {...form.getInputProps("username")}
              />
              <TextInput
                size={size}
                label="Nombre"
                placeholder="Ej: Juan"
                required
                {...form.getInputProps("nombre")}
              />
              <TextInput
                size={size}
                label="Apellido"
                placeholder="Ej: Pérez"
                required
                {...form.getInputProps("apellido")}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              <DateInput
                size={size}
                label="Fecha de nacimiento"
                placeholder="Seleccioná la fecha"
                required
                valueFormat="DD/MM/YYYY"
                dropdownType={isMobile ? "modal" : "popover"}
                maxDate={dayjs().format("YYYY-MM-DD")}
                {...form.getInputProps("fechaNacimiento")}
              />
              <Select
                size={size}
                label="Tipo de documento"
                placeholder="Seleccioná una opción"
                required
                data={tiposDocumento}
                searchable
                filter={filterIgnoreAccents}
                {...form.getInputProps("tipoDocumentoID")}
              />
              <TextInput
                size={size}
                label="DNI"
                placeholder="Ej: 12345678"
                required
                {...form.getInputProps("dni")}
              />
              <Select
                size={size}
                label="Sexo"
                placeholder="Seleccioná una opción"
                required
                data={sexos}
                {...form.getInputProps("sexoID")}
              />
            </SimpleGrid>
        </>
      ),
    },
    {
      value: "contacto",
      title: "Información de contacto",
      icon: <IconMail size={20} />,
      fields: ["email", "prefijo", "telefono"],
      children: (
        <>
            <TextInput
                size={size}
              label="Email"
              placeholder="Ej: juan@example.com"
              required
              type="email"
              {...form.getInputProps("email")}
            />
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <TextInput
                size={size}
                label="Prefijo"
                placeholder="Ej: 351"
                required
                {...form.getInputProps("prefijo")}
              />
              <TextInput
                size={size}
                label="Teléfono"
                placeholder="Ej: 1234567890"
                required
                {...form.getInputProps("telefono")}
              />
            </SimpleGrid>
        </>
      ),
    },
    {
      value: "direccion",
      title: "Dirección",
      icon: <IconMapPin size={20} />,
      fields: ["nombreCalle", "numeroCalle", "provinciaID", "localidadID"],
      children: (
        <>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <TextInput
                size={size}
                label="Nombre de la calle"
                placeholder="Ej: Av. Corrientes"
                required
                {...form.getInputProps("nombreCalle")}
              />
              <TextInput
                size={size}
                label="Número de la calle"
                placeholder="Ej: 1234"
                required
                {...form.getInputProps("numeroCalle")}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <Select
                size={size}
                label="Provincia"
                placeholder="Seleccioná una opción"
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
                size={size}
                label="Localidad"
                placeholder="Seleccioná primero una provincia"
                required
                data={localidades}
                searchable
                filter={filterIgnoreAccents}
                disabled={!form.values.provinciaID}
                {...form.getInputProps("localidadID")}
              />
            </SimpleGrid>
        </>
      ),
    },
    {
      value: "laboral",
      title: "Información laboral",
      icon: <IconBriefcase size={20} />,
      fields: ["authorities", "sucursalID"],
      children: (
        <>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              <MultiSelect
                size={size}
                label="Roles"
                placeholder="Seleccioná los roles"
                required
                data={rolesData}
                disabled={rolesBloqueados}
                description={
                  lockRolesAndSucursal
                    ? "No podés cambiar tus propios roles"
                    : rolesBloqueados
                    ? "Solo un superusuario puede cambiar este rol"
                    : undefined
                }
                searchable
                filter={filterIgnoreAccents}
                hidePickedOptions
                {...form.getInputProps("authorities")}
              />
              {isSuper ? (
                <Select
                size={size}
                  label="Sucursal"
                  placeholder="Seleccioná una sucursal"
                  data={sucursales}
                  searchable
                  filter={filterIgnoreAccents}
                  // SHG-FE-116: el SUPERUSER debe elegir sucursal al crear y al
                  // editar (`POST`/`PUT /api/user` exigen `sucursalID`).
                  required
                  disabled={lockRolesAndSucursal}
                  {...form.getInputProps("sucursalID")}
                />
              ) : (
                <TextInput
                size={size}
                  label="Sucursal"
                  description="Los usuarios que crees quedan asignados a tu sucursal"
                  value={user?.sucursal?.nombre || ""}
                  disabled
                />
              )}
            </SimpleGrid>
        </>
      ),
    },
  ];
  const { opened, setOpened, revealErrors } = useFormSections(sections);

  return (
    <form onSubmit={form.onSubmit(onSubmit, revealErrors)} noValidate>
      <Box pos="relative">
        <LoadingOverlay
          visible={catalogsLoading}
          overlayProps={{ radius: "md", blur: 2 }}
        />
        <FormSections sections={sections} opened={opened} onChange={setOpened} />
      </Box>

      {/* Footer canónico (SHG-FE-036): el slot vive en `AppShell.footer`; el
          botón sigue dentro del `<form>` para conservar el submit nativo. */}
      <PageFooter>
        {!hideCancel && (
          <Button
            type="button"
            variant="light"
            color="red"
            disabled={loading}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel ?? (isEdit ? "Guardar cambios" : "Crear usuario")}
        </Button>
      </PageFooter>
    </form>
  );
};

export default UsuarioForm;

