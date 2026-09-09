import { Box, Container, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';

import { LANDING_VALUE_PROPS } from '../constants/content';

/**
 * "Qué resuelve ShipGo": envíos + viajes + tracking en vivo.
 */
const ValuePropsSection = () => (
  <Box component="section" py={{ base: 'xl', sm: 64 }}>
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
          <Title order={2}>Qué resuelve ShipGo</Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          {LANDING_VALUE_PROPS.map((item) => (
            <Stack key={item.id} gap="xs" ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
              <ThemeIcon size={48} radius="xl" variant="light" aria-hidden="true">
                {item.icon}
              </ThemeIcon>
              <Title order={3} fz="md">
                {item.title}
              </Title>
              <Text size="sm" c="dimmed">
                {item.description}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  </Box>
);

export default ValuePropsSection;
