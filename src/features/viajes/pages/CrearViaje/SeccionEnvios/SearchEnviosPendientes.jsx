import { useDebouncedCallback } from "@mantine/hooks";
import { CardSection, Stack, Switch, TextInput, Title } from "@mantine/core";

import { IconSearch } from "@tabler/icons-react";

const SearchEnviosPendientes = ({ onSearchChange, onToggleShowIncluded }) => {
  const debouncedOnSearchChange = useDebouncedCallback(onSearchChange, 500);

  return (
    <CardSection component="search" withBorder p="md">
      <Title order={5}>Envíos pendientes</Title>

      <Stack mt="xs" gap="sm">
        <TextInput
          flex={1}
          placeholder="Buscá por ID o por destino..."
          rightSection={<IconSearch size={16} />}
          onChange={(event) => debouncedOnSearchChange(event.target.value)}
        />

        <Switch
          defaultChecked
          w="fit-content"
          label="Ocultar envíos ya agregados al viaje"
          onChange={(event) => onToggleShowIncluded(event.target.checked)}
        />
      </Stack>
    </CardSection>
  );
};

export default SearchEnviosPendientes;
