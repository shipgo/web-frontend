// Export centralizado de la capa `api/`.
// Cada método corresponde 1:1 a una fila de `planning/ENDPOINTS.md` (CONTRACTS.md §6).

// Helpers base
export { createCrudApi, createReadOnlyApi, notImplemented } from './base.api';

// Envíos
export { envioApi, detalleEnvioApi, puntoEntregaApi } from './envio.api';

// Viajes
export { viajeApi, detalleRecorridoApi } from './viaje.api';

// Tracking en tiempo real
export { trackingApi } from './tracking.api';

// Vehículos + catálogo de flota
export {
  vehiculoApi,
  marcaApi,
  modeloApi,
  tipoVehiculoApi,
  combustibleApi,
  tipoRuedaApi,
} from './vehiculo.api';

// Mantenimientos
export { mantenimientoApi, tipoMantenimientoApi } from './mantenimiento.api';

// Sucursales
export { sucursalApi } from './sucursal.api';

// Usuarios + authorities (el recurso "rol" no existe en la API → usar `authorityApi`)
export { usuarioApi, authorityApi } from './usuario.api';

// Catálogos + calificaciones + huella + notificaciones + empresa
export {
  categoriaApi,
  sexoApi,
  tipoDocumentoApi,
  calificacionChoferApi,
  calificacionRutaApi,
  huellaCarbonoApi,
  notificacionesApi,
  empresaApi,
  catalogsApi,
} from './catalogs.api';

// Ubicaciones
export { provinciaApi, localidadApi, locationApi } from './location.api';
