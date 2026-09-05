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
