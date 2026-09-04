// Re-exporta la API de usuarios desde la capa centralizada.
// El recurso "rol" no existe en la API: para roles se usa `authorityApi` (`GET /api/authority/all`).
export { usuarioApi, authorityApi } from '@api/usuario.api';
