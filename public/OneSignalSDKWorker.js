// Service worker de OneSignal (push web) — SHG-FE-027.
// El SDK web v16 registra este archivo en la raíz del sitio; sólo reexporta el
// worker del CDN de OneSignal. Sin `VITE_ONESIGNAL_APP_ID` configurado, el init
// no corre y este worker nunca se registra.
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
