import {
  IconLogin2,
  IconMapPin,
  IconPackage,
  IconRoute,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react';

/**
 * Copy + imágenes + iconografía de la landing pública de ShipGo
 * (`SHG-FE-044`, pulido de contenido y diseño en `SHG-FE-055`).
 *
 * Copy: primer draft cuidado y específico de ShipGo — el owner lo revisa y
 * ajusta más adelante. Imágenes: fotos reales de Unsplash elegidas con
 * sentido temático para cada sección (licencia Unsplash: uso libre,
 * comercial, sin atribución obligatoria; se deja el crédito de cada foto de
 * todos modos, como buena práctica y para ubicarlas rápido si hay que
 * reemplazarlas). Todo centralizado acá — ni el copy ni las imágenes están
 * hardcodeadas en los componentes — para que swapear texto o fotos por
 * material de marca propio no toque un solo componente. `.jsx` porque, igual
 * que `app/layout/constants/items.jsx`, embebe los íconos de cada item.
 */

const ICON_SIZE = 22;

/** Arma una URL de Unsplash con los parámetros de recorte/calidad estándar. */
const unsplashUrl = (photoId, width = 1200) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&q=80&w=${width}`;

export const LANDING_HERO = {
  eyebrow: 'Gestión logística todo en uno',
  title: 'Enviá, viajá y hacé seguimiento, todo en un solo lugar',
  subtitle:
    'ShipGo conecta a tu equipo operativo con tus clientes: cargá envíos, planificá viajes con tu flota y dejá que cualquiera rastree su paquete en tiempo real con un solo código, sin llamar a nadie.',
  primaryCta: { label: 'Rastrear un envío', href: '#seguimiento' },
  secondaryCta: { label: 'Crear una cuenta', href: '/registro' },
  image: {
    src: unsplashUrl('photo-1566576721346-d4a3b4eaeb55', 1000),
    alt: 'Una persona entrega un paquete en la puerta a otra persona.',
    credit: { name: 'RoseBox رز باکس', url: 'https://unsplash.com/@rosebox' },
  },
};

/**
 * Los 4 accesos diferenciados (decisión del owner, 2026-09-08): login interno
 * (operadores), login del customer (ruta propia, `/portal/ingresar`), registro
 * de customer y tracking guest. Cada uno es un camino separado, no variantes
 * del mismo botón.
 */
export const LANDING_ACCESSES = [
  {
    id: 'operador',
    icon: <IconLogin2 size={ICON_SIZE} />,
    title: 'Sos parte del equipo',
    description: 'Acceso interno para operación, administración y gestión de flota.',
    ctaLabel: 'Iniciar sesión',
    href: '/login',
  },
  {
    id: 'customer-login',
    icon: <IconUser size={ICON_SIZE} />,
    title: 'Ya tenés cuenta de cliente',
    description: 'Entrá a tu portal para ver el estado de todos tus envíos.',
    ctaLabel: 'Ingresar al portal',
    href: '/portal/ingresar',
  },
  {
    id: 'customer-registro',
    icon: <IconUserPlus size={ICON_SIZE} />,
    title: 'Querés crear una cuenta',
    description: 'Registrate como cliente y seguí todos tus envíos desde un solo lugar.',
    ctaLabel: 'Crear cuenta',
    href: '/registro',
  },
  {
    id: 'tracking',
    icon: <IconMapPin size={ICON_SIZE} />,
    title: 'Sólo querés rastrear un envío',
    description: 'Ingresá tu código de seguimiento, sin necesidad de crear una cuenta.',
    ctaLabel: 'Ver seguimiento',
    href: '/tracking',
  },
];

export const LANDING_VALUE_PROPS = [
  {
    id: 'envios',
    icon: <IconPackage size={ICON_SIZE} />,
    title: 'Envíos',
    description: 'Cargá, organizá y seguí el estado de cada envío de punta a punta.',
  },
  {
    id: 'viajes',
    icon: <IconRoute size={ICON_SIZE} />,
    title: 'Viajes',
    description: 'Planificá viajes, asigná vehículos y choferes, y controlá la flota.',
  },
  {
    id: 'tracking-vivo',
    icon: <IconMapPin size={ICON_SIZE} />,
    title: 'Tracking en vivo',
    description: 'Tus clientes ven la ubicación y el estado de su envío en tiempo real.',
  },
];

export const LANDING_HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Se carga el envío',
    description: 'Tu equipo registra el envío y lo asigna a un viaje de la flota.',
    image: {
      src: unsplashUrl('photo-1672552226380-486fe900b322', 800),
      alt: 'Pallets y cajas apiladas en un depósito, listos para despachar.',
      credit: { name: 'Arum Visuals', url: 'https://unsplash.com/@arumvisuals' },
    },
  },
  {
    step: 2,
    title: 'Viaja en la flota',
    description: 'El vehículo recorre la ruta y va actualizando el estado del envío solo.',
    image: {
      src: unsplashUrl('photo-1592838064575-70ed626d3a0e', 800),
      alt: 'Un camión de carga circulando por una ruta.',
      credit: { name: 'Sander Yigin', url: 'https://unsplash.com/@sanderyigin' },
    },
  },
  {
    step: 3,
    title: 'Tu cliente lo sigue',
    description: 'Con el código de seguimiento, cualquiera consulta el estado sin crear una cuenta.',
    image: {
      src: unsplashUrl('photo-1604357209793-fca5dca89f97', 800),
      alt: 'Una mano sostiene un teléfono con un mapa de navegación en pantalla.',
      credit: { name: 'Tamas Tuzes-Katai', url: 'https://unsplash.com/@tamas_tuzeskatai' },
    },
  },
];

export const LANDING_QUICK_TRACKING = {
  title: 'Seguí un envío ahora',
  description: 'Ingresá el código de seguimiento para ver el estado del envío al instante.',
  image: {
    src: unsplashUrl('photo-1619468129361-605ebea04b44', 900),
    alt: 'Alguien coloca un pin en un mapa de calles, marcando un destino.',
    credit: { name: 'GeoJango Maps', url: 'https://unsplash.com/@geojango_maps' },
  },
};

export const LANDING_FOOTER = {
  // Datos de contacto de staging — el owner los reemplaza por los reales.
  contactEmail: 'hola@shipgo.com',
  contactPhone: '+54 11 4700-2381',
  // Las páginas legales todavía no existen, así que se listan como texto y no
  // como `Anchor` para no dejar links rotos (el owner las crea después).
  legalLinks: [
    { label: 'Términos y condiciones' },
    { label: 'Política de privacidad' },
  ],
  copyrightHolder: 'ShipGo',
};

/**
 * Créditos de las fotos de Unsplash usadas en la landing, para el aviso
 * discreto en el footer. La licencia Unsplash no exige atribución, pero se
 * deja de todos modos como buena práctica hacia los fotógrafos.
 */
export const LANDING_PHOTO_CREDITS = [
  LANDING_HERO.image.credit,
  ...LANDING_HOW_IT_WORKS.map((item) => item.image.credit),
  LANDING_QUICK_TRACKING.image.credit,
];
