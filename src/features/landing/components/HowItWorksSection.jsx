import { Box, Container, Group, Image, SimpleGrid, Stack, Text, Title } from '@mantine/core';

import { useIsMobile } from '@hooks/useIsMobile';

import { LANDING_HOW_IT_WORKS } from '../constants/content';

/**
 * "Cómo funciona": resumen en 3 pasos, de la carga del envío al tracking del
 * cliente final. Cada paso tiene una foto de Unsplash con sentido temático
 * (depósito, ruta, tracking en el teléfono — ver créditos en
 * `LANDING_HOW_IT_WORKS[].image.credit`).
 */
const HowItWorksSection = () => {
  const isMobile = useIsMobile();

  return (
  <Box component="section" py={{ base: 'lg', sm: 64 }} bg="var(--mantine-color-colorPalette-light)">
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
          <Title order={2}>Cómo funciona</Title>
        </Stack>

        {isMobile ? (
          // Mobile: 3 pasos numerados sin fotos (la numeración es una secuencia real).
          <Stack gap="md" component="ol" p={0} m={0} style={{ listStyle: 'none' }}>
            {LANDING_HOW_IT_WORKS.map((item) => (
              <Group key={item.step} component="li" wrap="nowrap" align="flex-start" gap="sm">
                <Box
                  bg="colorPalette.7"
                  c="white"
                  fw={700}
                  fz="sm"
                  w={30}
                  h={30}
                  style={{
                    flexShrink: 0,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  {item.step}
                </Box>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Title order={3} fz="md">
                    {item.title}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {item.description}
                  </Text>
                </Stack>
              </Group>
            ))}
          </Stack>
        ) : (
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
                  visibleFrom="sm"
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
        )}
      </Stack>
    </Container>
  </Box>
  );
};

export default HowItWorksSection;
