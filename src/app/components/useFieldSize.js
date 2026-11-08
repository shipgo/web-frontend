import { useIsMobile } from '@hooks/useIsMobile';

/**
 * Tamaño de campo recomendado para formularios: `'md'` en mobile (texto de 16 px
 * y alto táctil >= 44 px; evita el zoom automático de iOS) y `'sm'` en escritorio
 * (el default de Mantine, lo que se usa hoy). No modifica el tema global: cada
 * formulario lo aplica donde lo necesita.
 *
 * @example
 * const size = useFieldSize();
 * <TextInput size={size} label="Nombre" />
 *
 * @returns {'md' | 'sm'}
 */
export const useFieldSize = () => (useIsMobile() ? 'md' : 'sm');

export default useFieldSize;
