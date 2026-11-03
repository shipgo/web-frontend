# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Deploy en Vercel

### Rewrite de `/api`

El front llama al backend con `baseURL: "/api"` (same-origin). En `vercel.json` hay un rewrite
`/api/:path*` que reenvía esas llamadas al backend, antes del catch-all `/:path*` → `/index.html`.

- **Destino actual (demo):** `https://macbook-pro-de-gianni.tailc278a3.ts.net/api/:path*`, que es un
  Tailscale Funnel del Mac de desarrollo. Es **temporal** y no es un entorno productivo.
- **Cambiar de backend:** `vercel.json` no admite variables de entorno en el destino de un rewrite,
  así que se cambia editando el `destination` de esa regla y volviendo a desplegar.
- Si el backend responde `403` en los POST, falta agregar el dominio de Vercel en `SHG-BE-165`.

### Variables del build de Vercel

Se cargan en Vercel (Project → Settings → Environment Variables). Vite las inyecta en el build, así
que cualquier cambio requiere un nuevo deploy.

| Variable | Obligatoria | Qué hace |
|---|---|---|
| `VITE_MAPBOX_API_KEY` | Sí | Token público de Mapbox para los mapas y el autocompletado de direcciones. |
| `VITE_TURNSTILE_ENABLED` | Recomendada | Poner `false` si el backend no exige captcha (perfil dev/demo). Si no se define, el captcha queda activo fuera de los tests. |
| `VITE_TURNSTILE_SITE_KEY` | Sólo si el captcha está activo | Site key pública de Cloudflare Turnstile. Sin ella el captcha queda en estado de error. |
| `VITE_ONESIGNAL_APP_ID` | Opcional | App ID de OneSignal (notificaciones push). Sin ella las push quedan desactivadas y el resto de la app sigue funcionando. |

- **`VITE_TURNSTILE_SECRET` NO se carga** en Vercel ni en el front: la secret del captcha vive sólo en el
  backend. Cualquier variable `VITE_*` queda pública en el bundle.
- Las variables `VITE_TURNSTILE_*` y `VITE_ONESIGNAL_APP_ID` están en el código de la rama
  `feature/backend-connection`, todavía no en `main`; en `main` sólo aplica `VITE_MAPBOX_API_KEY`.
