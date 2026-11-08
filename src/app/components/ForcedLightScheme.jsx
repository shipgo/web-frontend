import { useEffect, useRef } from 'react';
import { MantineProvider, useMantineColorScheme } from '@mantine/core';

/**
 * Fuerza el modo claro en una pantalla pública (landing, login, recuperar
 * cuenta) y, al salir de ella, restaura el esquema real del usuario.
 *
 * Un `MantineProvider forceColorScheme="light"` anidado escribe
 * `data-mantine-color-scheme="light"` en `<html>` y no lo deshace al
 * desmontarse. Con un modo oscuro elegido a mano, tras iniciar sesión el
 * interruptor decía "Modo oscuro" (estado `dark`) pero la UI quedaba en claro.
 * `useMantineColorScheme` se lee ACÁ, fuera del provider anidado, así que es el
 * esquema del provider de la app; `setColorScheme` vuelve a aplicar el atributo
 * (resolviendo `auto` contra el sistema).
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 */
const ForcedLightScheme = ({ children }) => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  // Refs: el cleanup corre al desmontar y necesita el valor más reciente.
  const colorSchemeRef = useRef(colorScheme);
  const setColorSchemeRef = useRef(setColorScheme);
  colorSchemeRef.current = colorScheme;
  setColorSchemeRef.current = setColorScheme;

  useEffect(
    () => () => {
      setColorSchemeRef.current(colorSchemeRef.current);
    },
    [],
  );

  return <MantineProvider forceColorScheme="light">{children}</MantineProvider>;
};

export default ForcedLightScheme;
