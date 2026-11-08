import { useDebouncedCallback } from "@mantine/hooks";
import { CardSection, Stack, Switch, TextInput, Title } from "@mantine/core";

import { IconSearch } from "@tabler/icons-react";

import { useFieldSize } from "@components/useFieldSize";

const SearchEnviosPendientes = ({ onSearchChange, onToggleShowIncluded }) => {
  const fieldSize = useFieldSize();
  const debouncedOnSearchChange = useDebouncedCallback(onSearchChange, 500);

  return (
    <CardSection component="search" withBorder p="md">
      <Title order={5}>Envíos pendientes</Title>

      <Stack mt="xs" gap="sm">
        <TextInput
          size={fieldSize}
          flex={1}
          placeholder="Buscá por código o por destino..."
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
