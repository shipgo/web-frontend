/**
 * Arma el `EnvioReqDTO` (`CONTRACTS.md §2`) a partir de los `values` del form,
 * compartido entre `CrearEnvios` y `EditarEnvio` (`SHG-FE-004`) para que el
 * shape del payload no diverja entre las dos pantallas: `detalleEnvios[].categoria`
 * y `destino.localidad` van anidados como `{ id }` (no `categoriaID`/`localidadID`
 * planos) — verificado contra el backend real (`DetalleEnvioReqDTO`/`PuntoEntregaDTO`)
 * en `SHG-FE-003`.
 *
 * `destinoExtra` cubre la metadata que no forma parte de los inputs del form:
 * `id` del destino ya persistido (edición) y `latitud`/`longitud` cuando la
 * pantalla no tiene mapa/autocompletado propio para recalcularlas (a
 * diferencia de `CrearEnvios`, que junta `coordenadas: { lat, lng }` en los
 * mismos `values`). El `id` de cada paquete se toma directo de
 * `values.detalleEnvios[i].id` si está presente (edición); en creación los
 * paquetes nuevos no lo tienen, así que la key se omite del payload.
 *
 * @param {Object} values
 * @param {{ id?: number, latitud?: number, longitud?: number }} [destinoExtra]
 */
/**
 * Inversa de `buildEnvioReqDTO`: arma los `values` iniciales del form de envío
 * (mismo shape que `INITIAL_VALUES` de `CrearEnvios/constants/schema.js`) a
 * partir de un `EnvioDTO` ya persistido, para precargar `EditarEnvio` con el
 * mismo `EnvioFormProvider` + schema Zod que usa `CrearEnvios` (`SHG-FE-031`).
 *
 * `provinciaID`/`localidadID` se derivan de `destino.localidad.provincia` y se
 * pasan como string (los `Select` de Mantine trabajan con strings).
 * `coordenadas` se reconstruye de `destino.latitud`/`longitud` para que el
 * mapa de `SeccionOrigen` muestre la posición actual y el schema (que exige
 * coordenadas no nulas) valide sin re-geocodificar.
 *
 * @param {Object} envio - `EnvioDTO` del backend.
 */
export const buildEnvioFormValues = (envio) => {
  const destino = envio?.destino ?? {};
  const localidad = destino.localidad ?? {};
  const provincia = localidad.provincia ?? {};

  return {
    nombre: envio?.nombre ?? "",
    apellido: envio?.apellido ?? "",
    emailRemitente: envio?.emailRemitente ?? "",
    emailReceptor: envio?.emailReceptor ?? "",
    prefijo: envio?.prefijo ?? "",
    telefono: envio?.telefono ?? "",
    nombreCalle: destino.nombreCalle ?? "",
    numeroCalle: destino.numeroCalle ?? "",
    provinciaID: provincia.id != null ? String(provincia.id) : "",
    localidadID: localidad.id != null ? String(localidad.id) : "",
    coordenadas:
      destino.latitud != null && destino.longitud != null
        ? { lat: destino.latitud, lng: destino.longitud }
        : null,
    detalleEnvios: (envio?.detalleEnvios ?? []).map((detalle) => ({
      id: detalle.id,
      categoriaID: detalle.categoria?.id != null ? String(detalle.categoria.id) : "",
      descripcion: detalle.descripcion ?? "",
      peso: detalle.peso,
    })),
  };
};

export const buildEnvioReqDTO = (values, destinoExtra = {}) => {
  const coordenadas = values.coordenadas ?? {};

  return {
    nombre: values.nombre,
    apellido: values.apellido,
    emailRemitente: values.emailRemitente,
    emailReceptor: values.emailReceptor,
    prefijo: values.prefijo,
    telefono: values.telefono,
    destino: {
      ...(destinoExtra.id != null ? { id: destinoExtra.id } : {}),
      nombreCalle: values.nombreCalle,
      numeroCalle: values.numeroCalle,
      localidad: { id: Number(values.localidadID) },
      latitud: destinoExtra.latitud ?? coordenadas.lat,
      longitud: destinoExtra.longitud ?? coordenadas.lng,
    },
    detalleEnvios: values.detalleEnvios.map((paquete) => ({
      ...(paquete.id != null ? { id: paquete.id } : {}),
      categoria: { id: Number(paquete.categoriaID) },
      descripcion: paquete.descripcion || null,
      peso: Number(paquete.peso),
    })),
  };
};
