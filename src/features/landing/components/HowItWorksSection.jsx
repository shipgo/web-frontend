import { Box, Container, SimpleGrid, Stack, Text, Title } from '@mantine/core';

import { LANDING_HOW_IT_WORKS } from '../constants/content';

/**
 * "Cómo funciona": resumen en 3 pasos, de la carga del envío al tracking del
 * cliente final.
 */
const HowItWorksSection = () => (
  <Box component="section" py={{ base: 'xl', sm: 64 }} bg="colorPalette.0">
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
          <Title order={2}>Cómo funciona</Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          {LANDING_HOW_IT_WORKS.map((item) => (
            <Stack key={item.step} gap="xs" ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
              <Text
                fw={700}
                fz={28}
                c="colorPalette.7"
                aria-hidden="true"
              >
                {item.step}
              </Text>
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

export default HowItWorksSection;
