import { Box, Container, Image, SimpleGrid, Stack, Text, Title } from '@mantine/core';

import { LANDING_HOW_IT_WORKS } from '../constants/content';

/**
 * "Cómo funciona": resumen en 3 pasos, de la carga del envío al tracking del
 * cliente final. Cada paso tiene una foto de Unsplash con sentido temático
 * (depósito, ruta, tracking en el teléfono — ver créditos en
 * `LANDING_HOW_IT_WORKS[].image.credit`).
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
            <Stack key={item.step} gap="sm" ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
              <Box pos="relative" w="100%">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  radius="md"
                  h={160}
                  fit="cover"
                  loading="lazy"
                />
                <Box
                  pos="absolute"
                  top={10}
                  left={10}
                  bg="colorPalette.7"
                  c="white"
                  fw={700}
                  fz="sm"
                  w={30}
                  h={30}
                  style={{
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  {item.step}
                </Box>
              </Box>
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
