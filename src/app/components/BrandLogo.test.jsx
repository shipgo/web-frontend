import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '../../test/renderWithProviders';
import BrandLogo from './BrandLogo';

describe('BrandLogo', () => {
  it('expone el nombre accesible y toma el color del token de marca por tema', () => {
    renderWithProviders(<BrandLogo h={37} alt="ShipGo — inicio" />);
    const logo = screen.getByRole('img', { name: 'ShipGo — inicio' });
    expect(logo.style.backgroundColor).toBe('var(--shg-brand-logo)');
  });

  it('usa "ShipGo" como alt por defecto', () => {
    renderWithProviders(<BrandLogo />);
    expect(screen.getByRole('img', { name: 'ShipGo' })).toBeInTheDocument();
  });
});
