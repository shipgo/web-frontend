import { Link } from 'wouter';
import { Box, Button, Container, Group, Image, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconMapPin, IconUserPlus } from '@tabler/icons-react';

import { LANDING_HERO } from '../constants/content';

/**
 * Hero de la landing: propuesta de valor + 2 CTA principales + foto (Unsplash,
 * interina — ver crédito en `LANDING_HERO.image.credit`). El resto de los
 * accesos (login interno, login customer, tracking directo) viven en
 * `AccessesSection`, diferenciados y con igual jerarquía visual.
 */
const HeroSection = () => (
  <Box component="section" py={{ base: 'xl', sm: 64 }} bg="colorPalette.0">
    <Container size="lg">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xl', md: 48 }} verticalSpacing="xl">
        <Stack gap="md" justify="center">
          <Text
            size="sm"
            fw={600}
            c="colorPalette.8"
            tt="uppercase"
            style={{ letterSpacing: '0.08em' }}
          >
            {LANDING_HERO.eyebrow}
          </Text>
          <Title order={1}>{LANDING_HERO.title}</Title>
          <Text size="lg" c="dimmed">
            {LANDING_HERO.subtitle}
          </Text>
          <Group gap="sm" mt="sm">
            <Button
              component="a"
              href={LANDING_HERO.primaryCta.href}
              size="md"
              leftSection={<IconMapPin size={18} />}
            >
              {LANDING_HERO.primaryCta.label}
            </Button>
            <Button
              component={Link}
              href={LANDING_HERO.secondaryCta.href}
              variant="light"
              size="md"
              leftSection={<IconUserPlus size={18} />}
            >
              {LANDING_HERO.secondaryCta.label}
            </Button>
          </Group>
        </Stack>

        <Image
          src={LANDING_HERO.image.src}
          alt={LANDING_HERO.image.alt}
          radius="lg"
          h={{ base: 260, sm: 340, md: 400 }}
          fit="cover"
          fetchPriority="high"
        />
      </SimpleGrid>
    </Container>
  </Box>
);

export default HeroSection;
