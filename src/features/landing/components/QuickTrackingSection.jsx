import { useLocation } from 'wouter';
import { Box, Card, Container, Stack, Text, Title } from '@mantine/core';

import { TrackingSearchForm } from '@features/tracking';

import { LANDING_QUICK_TRACKING } from '../constants/content';

/**
 * Bloque de tracking rápido embebido en la landing (criterio de aceptación de
 * `SHG-FE-044`): reusa `TrackingSearchForm` (`SHG-FE-025`) y, al enviar un
 * código válido, navega a `/tracking/:codigo` — mismo flujo que la vista de
 * tracking guest.
 */
const QuickTrackingSection = () => {
  const [, setLocation] = useLocation();

  const handleSubmit = (codigo) => {
    setLocation(`/tracking/${codigo}`);
  };

  return (
    <Box component="section" id="seguimiento" py={{ base: 'xl', sm: 64 }}>
      <Container size="sm">
        <Stack gap="lg">
          <Stack gap={4} ta={{ base: 'left', sm: 'center' }} align={{ sm: 'center' }}>
            <Title order={2}>{LANDING_QUICK_TRACKING.title}</Title>
            <Text c="dimmed">{LANDING_QUICK_TRACKING.description}</Text>
          </Stack>

          <Card withBorder padding="lg">
            <TrackingSearchForm onSubmit={handleSubmit} autoFocus={false} />
          </Card>
        </Stack>
      </Container>
    </Box>
  );
};

export default QuickTrackingSection;
