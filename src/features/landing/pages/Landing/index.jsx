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
 * Fuerza tema `light` (igual que `LoginPage`/`AuthCardShell`) porque tiene una
 * foto/hero de marca fija que no fue diseñada para dark mode. Es una vista
 * pública sin autenticación; contrasta con las rutas autenticadas que sí
 * respetan la preferencia del usuario (SHG-FE-061). Rediseñar para dark mode
 * sería una tarea de diseño aparte, fuera del alcance de SHG-FE-062.
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
