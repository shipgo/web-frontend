import { useComputedColorScheme, useMantineColorScheme } from '@mantine/core';

/**
 * Hook que encapsula la lógica para alternar el esquema de colores.
 *
 * Usa `useComputedColorScheme()` para obtener el valor resuelto (en vez del crudo "auto"),
 * evitando el bug donde toggleColorScheme() crudo alterna sobre "auto" en lugar del resuelto.
 *
 * Retorna:
 * - `computedColorScheme`: "light" | "dark"
 * - `handleToggleColorScheme`: función que alterna el tema
 */
export const useToggleColorScheme = () => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  const handleToggleColorScheme = () =>
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');

  return { computedColorScheme, handleToggleColorScheme };
};
