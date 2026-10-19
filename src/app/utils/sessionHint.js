// Pista (NO autoritativa) del tipo de la última sesión: `'customer'` o
// `'staff'`. Sólo sirve para elegir con cuál endpoint probar primero al
// resolver el usuario (`customer/me` vs `whoami`) y así evitar un 403 seguro.
// Nunca otorga permisos: los roles salen siempre de la respuesta del backend, y
// si la pista está mal el store prueba con el otro endpoint.
const KEY = 'shipgo.sessionHint';

export const HINT_CUSTOMER = 'customer';
export const HINT_STAFF = 'staff';

export const readSessionHint = () => {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === HINT_CUSTOMER || value === HINT_STAFF ? value : null;
  } catch {
    return null;
  }
};

export const writeSessionHint = (hint) => {
  try {
    window.localStorage.setItem(KEY, hint);
  } catch {
    /* storage bloqueado: la pista es sólo una optimización */
  }
};
