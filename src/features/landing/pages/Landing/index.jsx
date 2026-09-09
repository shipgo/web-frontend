import { Box, MantineProvider } from '@mantine/core';

import { LANDING_SEO } from '../../constants/seo';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';

import LandingHeader from '../../components/LandingHeader';
import HeroSection from '../../components/HeroSection';
import AccessesSection from '../../components/AccessesSection';
import ValuePropsSection from '../../components/ValuePropsSection';
import HowItWorksSection from '../../components/HowItWorksSection';
import QuickTrackingSection from '../../components/QuickTrackingSection';
import LandingFooter from '../../components/LandingFooter';

/**
 * Landing pública de ShipGo (`SHG-FE-044`). Sirve en `/` para visitantes sin
 * sesión — con sesión viva, `routes/index.jsx` (`RootRoute`) redirige al home
 * que corresponde al rol antes de montar esta página.
 *
 * Fuerza tema `light` igual que `LoginPage`/`AuthCardShell` (mismo criterio
 * para pantallas públicas). A diferencia del shell interno (≥1440px, decisión
 * 2026-09-07), esta página SÍ se soporta en mobile: es superficie pública.
 */
const LandingPage = () => {
  useDocumentMeta(LANDING_SEO);

  return (
    <MantineProvider forceColorScheme="light">
      <Box style={{ overflowX: 'hidden' }}>
        <LandingHeader />
        <Box component="main">
          <HeroSection />
          <AccessesSection />
          <ValuePropsSection />
          <HowItWorksSection />
          <QuickTrackingSection />
        </Box>
        <LandingFooter />
      </Box>
    </MantineProvider>
  );
};

export default LandingPage;
