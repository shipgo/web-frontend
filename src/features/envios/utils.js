import { formatDireccion } from "@domain/format";

import { TIPO_ENTREGA, TIPO_ENTREGA_DEFAULT } from "./constants";

/**
 * Texto de destino de un `EnvioDTO` para listados (`SHG-FE-085`): un envío de
 * retiro en sucursal (`tipoEntrega = 'sucursal'`) no trae `destino` — trae
 * `sucursalEntrega` (`SHG-CONTRACT-012`) — así que `formatDireccion(envio.destino)`
 * da siempre "—" para ese caso (mismo hueco que cerró `SHG-FE-084` en
 * `DetalleEnvio`, acá para los listados de `CrearViaje`/`EditarViaje`).
 *
 * Devuelve "Retiro en sucursal · <nombre>" cuando hay sucursal de retiro, o
 * "Retiro en sucursal" a secas si por algún motivo viene sin `nombre`; para
 * `domicilio` delega en `formatDireccion` como siempre (`opts.completa` sólo
 * aplica a ese caso).
 */
export const formatDestinoEnvio = (envio, opts = {}) => {
  if (envio?.tipoEntrega === TIPO_ENTREGA.SUCURSAL) {
    const nombreSucursal = envio.sucursalEntrega?.nombre;
    return nombreSucursal ? `Retiro en sucursal · ${nombreSucursal}` : "Retiro en sucursal";
  }

  return formatDireccion(envio?.destino, opts);
};

/**
 * Arma el `EnvioReqDTO` (`CONTRACTS.md §2`, `tipoEntrega`/`sucursalEntregaId`
 * agregados por `SHG-CONTRACT-012`/`SHG-BE-061`) a partir de los `values` del
 * form, compartido entre `CrearEnvios` y `EditarEnvio` (`SHG-FE-004`) para que
 * el shape del payload no diverja entre las dos pantallas: `detalleEnvios[].categoria`
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
 * `piso`/`departamento` (`SHG-BE-041`, opcionales): se mandan sólo si tienen
 * contenido (trim), igual que `descripcion` de paquete — se omiten del
 * payload en vez de mandar `""`, así el backend los persiste como
 * `null`/ausentes en vez de string vacío.
 *
 * `tipoEntrega`: si es `sucursal` (`SHG-FE-079`), el payload manda
 * `sucursalEntregaId` y **omite** `destino` por completo (obligatorio sólo
 * si `tipoEntrega = domicilio` del lado del backend); si es `domicilio` (o
 * ausente), se manda `destino` como siempre y no se incluye
 * `sucursalEntregaId`.
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
    tipoEntrega: envio?.tipoEntrega ?? TIPO_ENTREGA_DEFAULT,
    sucursalEntregaID:
      envio?.sucursalEntrega?.id != null ? String(envio.sucursalEntrega.id) : "",
    nombreCalle: destino.nombreCalle ?? "",
    numeroCalle: destino.numeroCalle ?? "",
    piso: destino.piso ?? "",
    departamento: destino.departamento ?? "",
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
  const tipoEntrega = values.tipoEntrega ?? TIPO_ENTREGA_DEFAULT;

  const base = {
    nombre: values.nombre,
    apellido: values.apellido,
    emailRemitente: values.emailRemitente,
    emailReceptor: values.emailReceptor,
    prefijo: values.prefijo,
    telefono: values.telefono,
    tipoEntrega,
    detalleEnvios: values.detalleEnvios.map((paquete) => ({
      ...(paquete.id != null ? { id: paquete.id } : {}),
      categoria: { id: Number(paquete.categoriaID) },
      descripcion: paquete.descripcion || null,
      peso: Number(paquete.peso),
    })),
  };

  if (tipoEntrega === TIPO_ENTREGA.SUCURSAL) {
    return {
      ...base,
      sucursalEntregaId: Number(values.sucursalEntregaID),
    };
  }

  const coordenadas = values.coordenadas ?? {};
  const piso = values.piso?.trim() || null;
  const departamento = values.departamento?.trim() || null;

  return {
    ...base,
    destino: {
      ...(destinoExtra.id != null ? { id: destinoExtra.id } : {}),
      nombreCalle: values.nombreCalle,
      numeroCalle: values.numeroCalle,
      ...(piso != null ? { piso } : {}),
      ...(departamento != null ? { departamento } : {}),
      localidad: { id: Number(values.localidadID) },
      latitud: destinoExtra.latitud ?? coordenadas.lat,
      longitud: destinoExtra.longitud ?? coordenadas.lng,
    },
  };
};
