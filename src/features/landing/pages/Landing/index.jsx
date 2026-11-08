import { Box } from '@mantine/core';

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
 * Respeta el tema elegido (Automático / Claro / Oscuro): el selector está en el
 * header. Antes forzaba `light` (SHG-FE-062, "rediseñar para dark mode sería una
 * tarea de diseño aparte"); los fondos de marca ahora salen de variables que
 * se adaptan al esquema (`--mantine-color-colorPalette-light`).
 */
const LandingPage = () => {
  useDocumentMeta(LANDING_SEO);

  return (
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
  );
};

export default LandingPage;
