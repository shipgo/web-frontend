import {
  Button,
  CardSection,
  Group,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";

import { IconSearch } from "@tabler/icons-react";

const SearchVehiculos = ({ handleOnSearch, handleRefetch, isFetching }) => {
  const handleOnChange = useDebouncedCallback((event) => {
    handleOnSearch(event.target.value);
  }, 500);

  return (
    <CardSection withBorder p="md">
      <Group justify="space-between">
        <Title order={5}>Vehículos disponibles</Title>
        <Button variant="subtle" onClick={handleRefetch} disabled={isFetching}>
          Actualizar listado
        </Button>
      </Group>

      <Stack mt="xs" gap="sm">
        <TextInput
          flex={1}
          onChange={handleOnChange}
          rightSection={<IconSearch size={16} />}
          placeholder="Buscá por patente o modelo..."
        />

        {/* <Switch
          w="fit-content"
          label="Ocultar vehículos sin capacidad suficiente"
          checked={hideUnavailableVehicles}
          onChange={switchHideUnavailableVehicles}
        /> */}

        {/* {selectedVehicle?.capacidad < 5000 && (
          <Alert variant="light" color="orange" icon={<IconAlertCircle />}>
            Seleccionaste un vehículo con capacidad insuficiente.
          </Alert>
        )} */}
      </Stack>
    </CardSection>
  );
};

export default SearchVehiculos;
