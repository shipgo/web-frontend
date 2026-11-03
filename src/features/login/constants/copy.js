/**
 * Copy de `LoginPage` por variante (`SHG-FE-044`): la landing agrega una
 * entrada dedicada para el customer (`/portal/ingresar`) que reusa el mismo
 * formulario que `/login` (operadores) — mismo componente, copy y destino
 * post-login distintos según el rol real que devuelva el backend
 * (`landingPathFor`, sin cambios acá).
 */
export const LOGIN_VARIANTS = {
  operator: {
    title: 'Iniciar sesión',
    subtitle: 'Completá con tus datos',
  },
  customer: {
    title: 'Ingresá a tu portal',
    subtitle: 'Accedé para ver el estado de tus envíos',
  },
};
