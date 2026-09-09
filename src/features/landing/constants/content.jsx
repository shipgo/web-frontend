import {
  IconLogin2,
  IconMapPin,
  IconPackage,
  IconRoute,
  IconUser,
  IconUserPlus,
} from '@tabler/icons-react';

/**
 * Copy + iconografía de la landing pública de ShipGo (`SHG-FE-044`).
 *
 * DRAFT — primer corte con placeholders (marcados `TODO(owner)`); el owner
 * reemplaza el texto de marketing y los datos de contacto/legales después.
 * Centralizado acá (no hardcodeado en las secciones) para facilitar el
 * reemplazo y una futura i18n. `.jsx` porque, igual que
 * `app/layout/constants/items.jsx`, embebe los íconos de cada item.
 */

const ICON_SIZE = 22;

export const LANDING_HERO = {
  // TODO(owner): copy de marketing definitivo.
  eyebrow: 'Gestión logística todo en uno',
  title: 'Enviá, viajá y hacé seguimiento, todo en un solo lugar',
  subtitle:
    'ShipGo conecta a tu equipo operativo con tus clientes: cargá envíos, planificá viajes y dejá que cualquiera rastree su paquete en tiempo real, sin llamar a nadie.',
  primaryCta: { label: 'Rastrear un envío', href: '#seguimiento' },
  secondaryCta: { label: 'Crear una cuenta', href: '/registro' },
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
    description: 'Tu equipo registra el envío y lo asigna a un viaje.',
  },
  {
    step: 2,
    title: 'Viaja en la flota',
    description: 'El vehículo recorre la ruta y va actualizando el estado del envío.',
  },
  {
    step: 3,
    title: 'Tu cliente lo sigue',
    description: 'Con el código de seguimiento, cualquiera consulta el estado sin crear una cuenta.',
  },
];

export const LANDING_QUICK_TRACKING = {
  title: 'Seguí un envío ahora',
  description: 'Ingresá el código de seguimiento para ver el estado del envío al instante.',
};

export const LANDING_FOOTER = {
  // TODO(owner): datos de contacto reales.
  contactEmail: 'hola@shipgo.com',
  contactPhone: '+54 9 11 0000-0000',
  // TODO(owner): páginas legales — hoy no existen, así que no linkean a nada.
  legalLinks: [
    { label: 'Términos y condiciones' },
    { label: 'Política de privacidad' },
  ],
  copyrightHolder: 'ShipGo',
};
