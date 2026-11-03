# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Variables de entorno

Copiá `.env.example` a `.env` y completá las claves. Todas llevan prefijo `VITE_`
(las únicas que Vite expone al bundle del navegador).

| Variable | Requerida | Descripción |
|---|---|---|
| `VITE_MAPBOX_API_KEY` | sí | Token de Mapbox para mapas y autocompletado de direcciones. |
| `VITE_ONESIGNAL_APP_ID` | no | App ID de OneSignal para push web (SHG-FE-027). Sin esta clave, la campana de notificaciones funciona sólo in-app (polling), sin push del navegador ni pedido de permiso. |

### Push web (OneSignal)

- El init de OneSignal corre tras el login, sólo para roles web (SUPERUSER /
  ADMIN), en `src/features/notificaciones/hooks/usePushNotifications.js`.
- Tras suscribir el navegador, el player id se registra con
  `PUT /api/user/updateToken` (el backend lo usa como `include_player_ids`).
- `public/OneSignalSDKWorker.js` es el service worker que exige el SDK web v16.
- Si el usuario **bloquea** las notificaciones, no se rompe nada: la campana
  degrada a sólo in-app.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
