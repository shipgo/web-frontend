// Clasificación de errores de conexión con la API (SHG-FE-110).
//
// - `'network'`: la request no obtuvo respuesta (timeout de axios `ECONNABORTED`/
//   `ETIMEDOUT`, caída de red `ERR_NETWORK`, backend apagado).
// - `'server'`: respondió un 5xx (backend vivo pero fallando; típico de un
//   502/503/504 del proxy mientras el backend arranca).
// - `null`: cualquier otra cosa (401/403/4xx, cancelaciones): NO es un problema
//   de conexión y se maneja con el flujo de sesión de siempre.
export const classifyConnectionError = (error) => {
  if (!error || error.code === 'ERR_CANCELED') return null;
  const status = error.response?.status;
  if (status === undefined) {
    // Sin `response`: sólo es "conexión" si es un error de axios; un error de
    // programación no debe mostrar la pantalla de "sin conexión".
    return error.isAxiosError || error.config || error.code ? 'network' : null;
  }
  return status >= 500 ? 'server' : null;
};

export const isConnectionError = (error) => classifyConnectionError(error) !== null;
