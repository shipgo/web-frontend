import { Box, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useHover } from '@mantine/hooks';

import { useIsMobile } from '@hooks/useIsMobile';

import { LANDING_VALUE_PROPS } from '../constants/content';

/**
 * Un ítem de `ValuePropsSection`, con una micro-interacción sobria: el ícono
 * escala levemente al pasar el mouse (mismo criterio de "hover discreto" que
 * el resto de la landing, sin agregar sombras/colores nuevos).
 */
const ValueProp = ({ item }) => {
  const { hovered, ref } = useHover();

  return (
    <Stack ref={ref} gap="xs" ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
      <ThemeIcon
        size={48}
        radius="xl"
        variant="light"
        aria-hidden="true"
        style={{
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 150ms ease',
        }}
      >
        {item.icon}
      </ThemeIcon>
      <Title order={3} fz="md">
        {item.title}
      </Title>
      <Text size="sm" c="dimmed">
        {item.description}
      </Text>
    </Stack>
  );
};

/**
 * "Qué resuelve ShipGo": envíos + viajes + tracking en vivo.
 */
const ValuePropsSection = () => {
  const isMobile = useIsMobile();

  return (
  <Box component="section" py={{ base: 'lg', sm: 64 }}>
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
          <Title order={2}>Qué resuelve ShipGo</Title>
        </Stack>

        {isMobile ? (
          <Stack gap="md" component="ul" p={0} m={0} style={{ listStyle: 'none' }}>
            {LANDING_VALUE_PROPS.map((item) => (
              <Group key={item.id} component="li" wrap="nowrap" align="flex-start" gap="sm">
                <ThemeIcon size={36} radius="xl" variant="light" aria-hidden="true">
                  {item.icon}
                </ThemeIcon>
                <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                  <Text span fw={600} c="var(--mantine-color-text)">
                    {item.title}.
                  </Text>{' '}
                  {item.description}
                </Text>
              </Group>
            ))}
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
            {LANDING_VALUE_PROPS.map((item) => (
              <ValueProp key={item.id} item={item} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  </Box>
  );
};

export default ValuePropsSection;
