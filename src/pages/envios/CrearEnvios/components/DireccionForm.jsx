import { Group, Stack, Textarea, TextInput, Flex, Box } from "@mantine/core";

import "mapbox-gl/dist/mapbox-gl.css";
import {
  AddressAutofill,
  useConfirmAddress,
  AddressMinimap,
} from "@mapbox/search-js-react";

import { useEnvioFormContext } from "../contexts/CrearEnvioContext";
import { useState } from "react";

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;
const MAP_STYLES = {
  dark: "mapbox://styles/joado97/cmbelt6tx003y01qqgshb3a28",
  light: "mapbox://styles/joado97/cmbhc0hiv001u01s9bay1fbap",
};

const COMMENT_ROWS = 4;
const COMMENT_MAX_LENGTH = 256;
const RESULT_OPTIONS = {
  language: "es",
  country: "AR",
};

const DireccionForm = () => {
  const form = useEnvioFormContext();

  const [result, setResult] = useState(null);

  const { formRef, showConfirm } = useConfirmAddress({
    accessToken: VITE_MAPBOX_API_KEY,
    options: RESULT_OPTIONS,
    footer: "Confirmar dirección",
    minimap: true,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await showConfirm();
    console.log(result);
  };

  return (
    <Flex padding="lg" gap="lg">
      <Box flex="1" component="form" ref={formRef} onSubmit={handleSubmit}>
        <AddressAutofill
          accessToken={VITE_MAPBOX_API_KEY}
          options={RESULT_OPTIONS}
          onRetrieve={(result) => setResult(result)}
        >
          <Stack flex="1">
            <TextInput
              flex="1"
              label="Dirección"
              placeholder="Ej: Nombre de calle"
              key={form.key("calle")}
              name="address-1"
              autoComplete="address-line1"
              {...form.getInputProps("calle")}
            />

            <Group>
              <TextInput
                flex="1"
                label="Localidad"
                placeholder="Ej: Buenos Aires"
                key={form.key("localidad")}
                name="city"
                autoComplete="address-level2"
                {...form.getInputProps("localidad")}
              />

              <TextInput
                flex="1"
                label="Provincia"
                placeholder="Ej: Buenos Aires"
                key={form.key("provincia")}
                name="state"
                autoComplete="address-level1"
                {...form.getInputProps("provincia")}
              />

              <TextInput
                flex="1"
                label="Código Postal"
                placeholder="Ej: 12345"
                key={form.key("codigo_postal")}
                name="zip"
                autoComplete="postal-code"
                {...form.getInputProps("codigo_postal")}
              />
              {/* <Select
                flex="1"
                searchable
                label="Provincia"
                allowDeselect={false}
                data={provinciasQuery.data?.map((provincia) => ({
                  value: String(provincia.id),
                  label: provincia.nombre,
                }))}
                placeholder="Seleccioná una opción"
                key={form.key("provincia")}
                name="state"
                autoComplete="address-level1"
                {...form.getInputProps("provincia")}
              />

              {localidadesQuery.isFetching ? (
                <Skeleton flex={1} height={38} />
              ) : (
                <Tooltip
                  withArrow
                  disabled={selectedProvince !== ""}
                  label="Primero seleccioná una provincia"
                  position="bottom-end"
                >
                  <Select
                    flex="1"
                    limit={5}
                    searchable
                    allowDeselect={false}
                    label="Localidad"
                    name="city"
                    autoComplete="address-level2"
                    placeholder="Buscá y seleccioná una opción de la lista"
                    data={localidadesQuery.data?.map((localidad) => ({
                      value: String(localidad.id),
                      label: localidad.nombre,
                    }))}
                    disabled={selectedProvince === ""}
                    key={form.key("localidad")}
                    {...form.getInputProps("localidad")}
                  />
                </Tooltip>
              )} */}
            </Group>

            <Box h="300px" w="100%">
              <AddressMinimap
                footer
                show={result}
                canAdjustMarker
                keepMarkerCentered
                mapStyle={MAP_STYLES.light}
                onSaveMarkerLocation={() => {}}
                accessToken={VITE_MAPBOX_API_KEY}
                feature={result?.features?.[0]}
              />
            </Box>

            <Textarea
              autosize
              spellCheck="false"
              minRows={COMMENT_ROWS}
              maxLength={COMMENT_MAX_LENGTH}
              label="Comentarios (Opcional)"
              placeholder="Ej: Timbre roto, número de departamento, etc."
              key={form.key("comentario")}
              {...form.getInputProps("comentario")}
            />
          </Stack>
        </AddressAutofill>
      </Box>
    </Flex>
  );
};

export default DireccionForm;
