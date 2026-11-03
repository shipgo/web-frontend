import { Box, Container, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useHover } from '@mantine/hooks';

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
const ValuePropsSection = () => (
  <Box component="section" py={{ base: 'xl', sm: 64 }}>
    <Container size="lg">
      <Stack gap="lg">
        <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
          <Title order={2}>Qué resuelve ShipGo</Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
          {LANDING_VALUE_PROPS.map((item) => (
            <ValueProp key={item.id} item={item} />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  </Box>
);

export default ValuePropsSection;
