import { Title, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import { Card } from "@mantine/core";

const HeaderEnviosEnViaje = () => {
  return (
    <Card.Section withBorder pt="md" pb="sm" px="md">
      <Title order={5}>Envíos seleccionados</Title>

      <TextInput
        mt="xs"
        flex={1}
        placeholder="Buscá entre los envíos agregados..."
        rightSection={<IconSearch size={16} />}
      />
    </Card.Section>
  );
};

export default HeaderEnviosEnViaje;
