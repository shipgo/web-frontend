import { Box } from '@mantine/core';

import logo from '/src/assets/logoipsum-custom-logo.svg';
import classes from './BrandLogo.module.css';

// Relación de aspecto del viewBox del SVG (102.43 x 42.55).
const LOGO_ASPECT_RATIO = 102.43 / 42.5537;

/**
 * Logo "shipgo" que respeta el tema (SHG-FE-109).
 *
 * El SVG fuente trae `fill="#004d40"` fijo (nivel 9 de la escala de marca),
 * que sobre fondo oscuro da ~1.6:1. En vez de duplicar el SVG, se usa como
 * máscara (`mask-image`) y el color lo pone `--shg-brand-logo`
 * (`cssVariablesResolver.js`: primary-9 en claro, primary-2 en oscuro).
 *
 * Sólo para superficies que respetan el tema (Navbar, PublicLayout, portal).
 * Landing/login/recuperar fuerzan claro (SHG-FE-062) y siguen con `<Image>`.
 *
 * @param {Object} props
 * @param {number} props.h Alto en px.
 * @param {string} [props.alt] Nombre accesible.
 */
const BrandLogo = ({ h = 32, alt = 'ShipGo', style, ...props }) => (
  <Box
    role="img"
    aria-label={alt}
    className={classes.logo}
    h={h}
    {...props}
    style={{
      aspectRatio: LOGO_ASPECT_RATIO,
      backgroundColor: 'var(--shg-brand-logo)',
      maskImage: `url("${logo}")`,
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskImage: `url("${logo}")`,
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
      WebkitMaskSize: 'contain',
      ...style,
    }}
  />
);

export default BrandLogo;
