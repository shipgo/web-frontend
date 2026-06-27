import {
  ActionIcon,
  Autocomplete,
  Box,
  Card,
  Flex,
  Grid,
  Group,
  Loader,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { useState } from "react";
import { IconCurrentLocation, IconMapPin } from "@tabler/icons-react";
import { Marker } from "react-map-gl/mapbox";

import MapCard from "@features/mapa/components/MapCard";
import ScreenContainer from "@components/ScreenContainer";
import { useEnvioFormContext } from "../contexts/CrearEnvioContext";
import { useAddressAutofill } from "../hooks/useAddressAutofill";

const DEFAULT_CENTER = { lat: -32.40949761013196, lng: -63.24437044777056 };

const SeccionOrigen = () => {
  const form = useEnvioFormContext();
  const coordenadas = form.values.coordenadas ?? DEFAULT_CENTER;
  const [geocodedCoords, setGeocodedCoords] = useState(null);

  const {
    autocompleteData,
    handleChange,
    handleSelect,
    loadingInput,
    loadingMap,
    selectedId,
  } = useAddressAutofill({
    onSelect: ({ address, coordenadas: coords }) => {
      form.setFieldValue("direccionDestino", address);
      form.setFieldValue("coordenadas", coords);
      setGeocodedCoords(coords);
    },
  });

  const handleResetMarker = () => {
    if (geocodedCoords) form.setFieldValue("coordenadas", geocodedCoords);
  };

  const hasInput = form.values.direccionDestino.length >= 3;
  const autocompleteDataWithDisabled =
    hasInput && !loadingInput && autocompleteData.length === 0
      ? [{ value: "__no_results__", label: "Sin resultados", disabled: true }]
      : autocompleteData.map((item) => ({
          ...item,
          disabled: item.value === selectedId,
        }));

  const handleDireccionChange = (value) => {
    form.setFieldValue("direccionDestino", value);
    form.setFieldValue("coordenadas", null);
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
                Indicá los datos del destinatario y la dirección de entrega
              </Text>
            </Box>
          </Group>

          <Flex direction="column" h="100%" gap="md">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  autoFocus
                  key={form.key("nombreDestinatario")}
                  {...form.getInputProps("nombreDestinatario")}
                  required
                  label="Nombre del destinatario"
                  placeholder="Ej: Juan García"
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  key={form.key("telefonoDestinatario")}
                  {...form.getInputProps("telefonoDestinatario")}
                  required
                  label="Teléfono del destinatario"
                  placeholder="Ej: 11 1234-5678"
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Autocomplete
                  label="Dirección de destino"
                  required
                  error={form.errors.direccionDestino}
                  value={form.values.direccionDestino}
                  onChange={handleDireccionChange}
                  onOptionSubmit={handleSelect}
                  data={autocompleteDataWithDisabled}
                  placeholder="Ej: Av. Corrientes 1234, Buenos Aires"
                  filter={({ options }) => options}
                  rightSection={loadingInput ? <Loader size="xs" /> : undefined}
                  clearable={!loadingInput}
                />
              </Grid.Col>
            </Grid>
            <Textarea
              key={form.key("observacionesDireccion")}
              {...form.getInputProps("observacionesDireccion")}
              label="Observaciones de entrega"
              placeholder="Ej: Portón azul, timbre roto, entregar en horario de mañana..."
              maxLength={260}
              description={`${form.values.observacionesDireccion?.length ?? 0} / 260`}
              autosize
              minRows={3}
              flex={1}
            />
          </Flex>
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
              description: "Ingresá una dirección válida para visualizar el mapa",
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
