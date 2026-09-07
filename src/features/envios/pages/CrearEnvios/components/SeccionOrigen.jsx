import {
  ActionIcon,
  Autocomplete,
  Box,
  Card,
  Grid,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { notifications } from "@mantine/notifications";
import { IconCurrentLocation, IconMapPin } from "@tabler/icons-react";
import { Marker } from "react-map-gl/mapbox";

import MapCard from "@features/mapa/components/MapCard";
import ScreenContainer from "@components/ScreenContainer";
import { provinciaApi, localidadApi } from "@api";
import { useEnvioFormContext } from "../contexts/CrearEnvioContext";
import { useAddressAutofill } from "../hooks/useAddressAutofill";

const DEFAULT_CENTER = { lat: -32.40949761013196, lng: -63.24437044777056 };

const normalizeText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
};

const matchByName = (options, name) => {
  const normalized = normalizeText(name);
  if (!normalized) return null;
  return (
    options.find((option) => normalizeText(option.label) === normalized) ??
    options.find(
      (option) =>
        normalizeText(option.label).includes(normalized) ||
        normalized.includes(normalizeText(option.label)),
    ) ??
    null
  );
};

// Los sugerencias de Mapbox traen la calle y el número juntos en `address_line1`
// (ej: "Av. Corrientes 1234"). El backend los necesita separados.
const parseStreetAddress = (line) => {
  const value = (line ?? "").trim();
  const match = value.match(/^(.*?)\s+(\d+\s?[A-Za-z]?)$/);
  if (match) {
    return { nombreCalle: match[1].trim(), numeroCalle: match[2].trim() };
  }
  return { nombreCalle: value, numeroCalle: "" };
};

const SeccionOrigen = () => {
  const form = useEnvioFormContext();
  const coordenadas = form.values.coordenadas ?? DEFAULT_CENTER;
  const [geocodedCoords, setGeocodedCoords] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const pendingLocalidadMatch = useRef(null);

  // Provincias: se cargan una sola vez.
  useEffect(() => {
    provinciaApi
      .getAll()
      .then((data) =>
        setProvincias(
          (data ?? []).map((p) => ({ value: String(p.id), label: p.nombre })),
        ),
      )
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las provincias",
          color: "red",
        });
      });
  }, []);

  // Localidades: dependen de la provincia seleccionada (manual o autocompletada).
  useEffect(() => {
    const provinciaID = form.values.provinciaID;
    if (!provinciaID) {
      setLocalidades([]);
      return;
    }

    localidadApi
      .getByProvincia(provinciaID)
      .then((data) => {
        const options = (data ?? []).map((l) => ({
          value: String(l.id),
          label: l.nombre,
        }));
        setLocalidades(options);

        if (pendingLocalidadMatch.current) {
          const matched = matchByName(options, pendingLocalidadMatch.current);
          if (matched) form.setFieldValue("localidadID", matched.value);
          pendingLocalidadMatch.current = null;
        }
      })
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las localidades",
          color: "red",
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.provinciaID]);

  const {
    autocompleteData,
    handleChange,
    handleSelect,
    loadingInput,
    loadingMap,
    selectedId,
  } = useAddressAutofill({
    onSelect: ({
      addressLine1,
      provincia: provinciaName,
      localidad: localidadName,
      coordenadas: coords,
    }) => {
      const { nombreCalle, numeroCalle } = parseStreetAddress(addressLine1);
      form.setFieldValue("nombreCalle", nombreCalle);
      form.setFieldValue("numeroCalle", numeroCalle);
      form.setFieldValue("coordenadas", coords);
      setGeocodedCoords(coords);

      const matchedProvincia = matchByName(provincias, provinciaName);
      if (!matchedProvincia) {
        // No pudimos ubicar la provincia en el catálogo: se elige manualmente.
        form.setFieldValue("provinciaID", "");
        form.setFieldValue("localidadID", "");
        setLocalidades([]);
        return;
      }

      if (matchedProvincia.value === form.values.provinciaID) {
        const matchedLocalidad = matchByName(localidades, localidadName);
        form.setFieldValue("localidadID", matchedLocalidad?.value ?? "");
      } else {
        pendingLocalidadMatch.current = localidadName;
        form.setFieldValue("provinciaID", matchedProvincia.value);
        form.setFieldValue("localidadID", "");
      }
    },
  });

  const handleResetMarker = () => {
    if (geocodedCoords) form.setFieldValue("coordenadas", geocodedCoords);
  };

  const hasInput = searchValue.length >= 3;
  const autocompleteDataWithDisabled =
    hasInput && !loadingInput && autocompleteData.length === 0
      ? [{ value: "__no_results__", label: "Sin resultados", disabled: true }]
      : autocompleteData.map((item) => ({
          ...item,
          disabled: item.value === selectedId,
        }));

  const handleSearchChange = (value) => {
    setSearchValue(value);
    handleChange(value);
  };

  const handleMarkerDragEnd = (event) => {
    form.setFieldValue("coordenadas", {
      lat: event.lngLat.lat,
      lng: event.lngLat.lng,
    });
  };

  return (
    <Group align="stretch" gap="md">
      <Card flex={7}>
        <Stack>
          <Group gap="0.75rem">
            <ThemeIcon size="xl" variant="light">
              <IconMapPin />
            </ThemeIcon>
            <Box>
              <Title order={4}>Origen y destino</Title>
              <Text c="dimmed" size="sm">
                Indicá los datos de contacto y la dirección de entrega
              </Text>
            </Box>
          </Group>

          <Grid>
            <Grid.Col span={6}>
              <TextInput
                autoFocus
                key={form.key("nombre")}
                {...form.getInputProps("nombre")}
                required
                label="Nombre"
                placeholder="Ej: Juan"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                key={form.key("apellido")}
                {...form.getInputProps("apellido")}
                required
                label="Apellido"
                placeholder="Ej: García"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                key={form.key("prefijo")}
                {...form.getInputProps("prefijo")}
                required
                label="Prefijo"
                placeholder="Ej: 351"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                key={form.key("telefono")}
                {...form.getInputProps("telefono")}
                required
                label="Teléfono"
                placeholder="Ej: 1234567"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                key={form.key("emailRemitente")}
                {...form.getInputProps("emailRemitente")}
                required
                type="email"
                label="Email del remitente"
                placeholder="remitente@ejemplo.com"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                key={form.key("emailReceptor")}
                {...form.getInputProps("emailReceptor")}
                required
                type="email"
                label="Email del receptor"
                placeholder="receptor@ejemplo.com"
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Autocomplete
                label="Buscar dirección"
                description="Completa automáticamente la calle, localidad y ubicación en el mapa"
                error={form.errors.coordenadas}
                value={searchValue}
                onChange={handleSearchChange}
                onOptionSubmit={handleSelect}
                data={autocompleteDataWithDisabled}
                placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                filter={({ options }) => options}
                rightSection={loadingInput ? <Loader size="xs" /> : undefined}
                clearable={!loadingInput}
              />
            </Grid.Col>
            <Grid.Col span={8}>
              <TextInput
                key={form.key("nombreCalle")}
                {...form.getInputProps("nombreCalle")}
                required
                label="Calle"
                placeholder="Ej: Av. Colón"
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                key={form.key("numeroCalle")}
                {...form.getInputProps("numeroCalle")}
                label="Número"
                placeholder="Ej: 1234"
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Provincia"
                placeholder="Seleccioná una provincia"
                data={provincias}
                searchable
                required
                error={form.errors.provinciaID}
                value={form.values.provinciaID || null}
                onChange={(value) => {
                  form.setFieldValue("provinciaID", value ?? "");
                  form.setFieldValue("localidadID", "");
                }}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                key={form.key("localidadID")}
                {...form.getInputProps("localidadID")}
                required
                label="Localidad"
                placeholder={
                  form.values.provinciaID
                    ? "Seleccioná una localidad"
                    : "Elegí primero una provincia"
                }
                data={localidades}
                searchable
                disabled={!form.values.provinciaID}
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      <Card padding={0} flex={5}>
        <Box pos="relative" h="100%">
          <ScreenContainer
            onLoading={{
              show: loadingMap,
              description: "Obteniendo ubicación...",
            }}
            onEmptyData={{
              show: form.values.coordenadas === null,
              icon: <IconMapPin size={50} />,
              title: "Sin ubicación",
              description:
                "Elegí una sugerencia del buscador de direcciones para visualizar el mapa",
            }}
            styleProps={{
              h: "100%",
              mih: 0,
              radius: "md",
              bg: "var(--mantine-color-default)",
            }}
          >
            <MapCard
              key={`mapa-${form.values.coordenadas?.lat}-${form.values.coordenadas?.lng}`}
              initialCenter={form.values.coordenadas ?? DEFAULT_CENTER}
              initialZoom={15}
              h="100%"
            >
              <Marker
                longitude={coordenadas.lng}
                latitude={coordenadas.lat}
                draggable
                onDragEnd={handleMarkerDragEnd}
                color="red"
              />
            </MapCard>
          </ScreenContainer>
          {geocodedCoords && (
            <Tooltip label="Reiniciar posición del marcador" position="left">
              <ActionIcon
                pos="absolute"
                top={10}
                right={10}
                size="lg"
                variant="white"
                onClick={handleResetMarker}
                style={{ zIndex: 1 }}
                aria-label="Reiniciar posición del marcador"
              >
                <IconCurrentLocation size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Box>
      </Card>
    </Group>
  );
};

export default SeccionOrigen;
