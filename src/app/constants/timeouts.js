// Timeouts (SHG-FE-110). Sin timeout, con la API colgada el loader del bootstrap
// y cualquier request quedaban esperando indefinidamente.
// - DEFAULT: ninguna llamada normal del panel debería tardar más de 15 s.
// - BOOTSTRAP: `/api/refresh` al abrir la app; más corto porque bloquea toda la
//   UI (la pantalla "No pudimos conectar" aparece a los ~10 s).
// - EXPORT: el CSV pide hasta `CSV_MAX_ROWS` filas en una sola página (`size`),
//   que legítimamente tarda más (se detecta por `params.size` en el interceptor).
// - UPLOAD: subida multipart (foto de perfil), depende del ancho de banda.
// El stream SSE de tracking usa `EventSource` (no pasa por acá) y no tiene timeout.
export const DEFAULT_TIMEOUT_MS = 15_000;
export const BOOTSTRAP_TIMEOUT_MS = 10_000;
export const EXPORT_TIMEOUT_MS = 60_000;
export const UPLOAD_TIMEOUT_MS = 60_000;
