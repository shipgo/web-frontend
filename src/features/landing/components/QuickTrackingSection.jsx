import { useLocation } from 'wouter';
import { Box, Card, Container, Image, SimpleGrid, Stack, Text, Title } from '@mantine/core';

import { TrackingSearchForm } from '@features/tracking';

import { LANDING_QUICK_TRACKING } from '../constants/content';

/**
 * Bloque de tracking rápido embebido en la landing (criterio de aceptación de
 * `SHG-FE-044`): reusa `TrackingSearchForm` (`SHG-FE-025`) y, al enviar un
 * código válido, navega a `/tracking/:codigo` — mismo flujo que la vista de
 * tracking guest. La foto (Unsplash, ver `LANDING_QUICK_TRACKING.image.credit`)
 * sólo se muestra desde `sm` para no competir con el formulario en mobile.
 */
const QuickTrackingSection = () => {
  const [, setLocation] = useLocation();

  const handleSubmit = (codigo) => {
    setLocation(`/tracking/${codigo}`);
  };

  return (
    <Box component="section" id="seguimiento" py={{ base: 'xl', sm: 64 }}>
      <Container size="lg">
        <Stack gap="lg">
          <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
            <Title order={2}>{LANDING_QUICK_TRACKING.title}</Title>
            <Text c="dimmed">{LANDING_QUICK_TRACKING.description}</Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" verticalSpacing="lg">
            <Image
              src={LANDING_QUICK_TRACKING.image.src}
              alt={LANDING_QUICK_TRACKING.image.alt}
              radius="md"
              h="100%"
              mih={220}
              fit="cover"
              loading="lazy"
              visibleFrom="md"
            />
            <Card
              withBorder
              padding="lg"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <TrackingSearchForm onSubmit={handleSubmit} autoFocus={false} />
            </Card>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
};

export default QuickTrackingSection;
