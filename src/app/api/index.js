// Export centralizado de todas las APIs

// Base API
export { createCrudApi } from './base.api';

// Envíos
export { envioApi, detalleEnvioApi, puntoEntregaApi } from './envio.api';

// Viajes
export { viajeApi, detalleRecorridoApi } from './viaje.api';

// Vehículos
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

// Usuarios
export { usuarioApi, rolApi, authorityApi } from './usuario.api';

// Catálogos
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

