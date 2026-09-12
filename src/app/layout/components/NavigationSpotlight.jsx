import { useMemo, useState } from "react";
import { useLocation } from "wouter";

import { Group, Loader, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { isActionsGroup, Spotlight } from "@mantine/spotlight";
import { useQuery } from "@tanstack/react-query";

import {
  IconAlertTriangle,
  IconHome,
  IconMap,
  IconMoodEmpty,
} from "@tabler/icons-react";

import { useAuth } from "@contexts/auth";
import { hasAnyRole, isAdminOrSuper } from "@domain/roles";
import { buscarApi } from "@api/buscar.api";

import { ADMIN, PAGES } from "../constants/items";

// Query mínima para disparar la búsqueda dinámica (ENDPOINTS.md §24): el
// backend igual guardea `q` corto devolviendo los 5 buckets vacíos, pero el
// front evita el request innecesario.
const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;
const NAV_GROUP_LABEL = "Navegar";

// Rutas de detalle por tipo de resultado (mismas que consumen los listados,
// ver `envios.routes.jsx` / `viajes.routes.jsx` / `usuarios.routes.jsx` /
// `vehiculos/index.jsx` / `sucursales.routes.jsx` — todas `/:id` numérico).
const RESULT_GROUPS = [
  { key: "envios", label: "Envíos", buildPath: (id) => `/envios/${id}` },
  { key: "viajes", label: "Viajes", buildPath: (id) => `/viajes/${id}` },
  { key: "usuarios", label: "Usuarios", buildPath: (id) => `/usuarios/${id}` },
  { key: "vehiculos", label: "Vehículos", buildPath: (id) => `/vehiculos/${id}` },
  { key: "sucursales", label: "Sucursales", buildPath: (id) => `/sucursales/${id}` },
];

/**
 * Match de texto simple (case-insensitive, contains) contra `label`/
 * `description` — misma semántica que el filtro default de `@mantine/
 * spotlight` (no queda expuesto como export público del paquete en esta
 * versión, así que se replica acá).
 */
const matchesQuery = (action, normalizedQuery) =>
  action.label?.toLowerCase().includes(normalizedQuery) ||
  action.description?.toLowerCase().includes(normalizedQuery);

/**
 * Filtro custom del spotlight (SHG-FE-053): las acciones estáticas de
 * navegación se filtran por texto sobre `label` (grupo "Navegar"), pero los
 * resultados dinámicos de `/api/buscar` NO se vuelven a filtrar acá — ya
 * vienen acotados por el backend (match contra patente/código/nombre, no
 * sólo el `label` mostrado), así que reaplicar el filtro de texto sobre el
 * `label` podría descartar resultados válidos (ej: un viaje matcheado por
 * patente del vehículo, cuyo label es "Viaje #1").
 */
const spotlightFilter = (query, actions) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return actions;
  return actions.flatMap((entry) => {
    if (isActionsGroup(entry)) {
      if (entry.group !== NAV_GROUP_LABEL) return [entry];
      const filtered = entry.actions.filter((action) =>
        matchesQuery(action, normalizedQuery),
      );
      return filtered.length > 0 ? [{ ...entry, actions: filtered }] : [];
    }
    return matchesQuery(entry, normalizedQuery) ? [entry] : [];
  });
};

/**
 * Spotlight de navegación del header (`Ctrl+K`/`Cmd+K`, reemplaza el
 * `TextInput` de búsqueda de ancho fijo — SHG-FE-053).
 *
 * - Acciones estáticas: secciones navegables según el rol, no dependen de
 *   la red.
 * - Acciones dinámicas: a partir de `MIN_QUERY_LENGTH` caracteres, consulta
 *   `GET /api/buscar` (SHG-BE-045, sólo SU/AD) y agrupa resultados por tipo.
 *   Si el endpoint falla o el rol no puede consultarlo, el spotlight
 *   degrada a sólo navegación estática (no se rompe).
 *
 * @param {{ forceOpened?: boolean }} [props]  `forceOpened` sólo se usa en tests
 * (documentado así por `@mantine/spotlight` — evita depender del hotkey/click real).
 */
const NavigationSpotlight = ({ forceOpened } = {}) => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const trimmedQuery = debouncedQuery.trim();
  const puedeBuscarRegistros = isAdminOrSuper(user);
  const searchEnabled = puedeBuscarRegistros && trimmedQuery.length >= MIN_QUERY_LENGTH;

  const {
    data: resultados,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ["buscar", trimmedQuery],
    queryFn: () => buscarApi.buscar({ q: trimmedQuery }),
    enabled: searchEnabled,
  });

  const secciones = useMemo(() => {
    const gestionar = [...PAGES, ...ADMIN].filter(({ roles }) =>
      hasAnyRole(user, roles),
    );
    return [
      { label: "Inicio", to: "/", icon: <IconHome size={18} /> },
      { label: "Mapa", to: "/mapa", icon: <IconMap size={18} /> },
      ...gestionar,
    ];
  }, [user]);

  const staticActions = useMemo(
    () => ({
      group: NAV_GROUP_LABEL,
      actions: secciones.map((seccion) => ({
        id: `nav-${seccion.to}`,
        label: seccion.label,
        leftSection: seccion.icon,
        onClick: () => navigate(seccion.to),
      })),
    }),
    [secciones, navigate],
  );

  const dynamicGroups = useMemo(() => {
    if (!resultados) return [];
    return RESULT_GROUPS.map(({ key, label, buildPath }) => {
      const items = resultados[key] ?? [];
      if (items.length === 0) return null;
      return {
        group: label,
        actions: items.map((item) => ({
          id: `resultado-${item.tipo}-${item.id}`,
          label: item.label,
          description: item.subtitle ?? undefined,
          onClick: () => navigate(buildPath(item.id)),
        })),
      };
    }).filter(Boolean);
  }, [resultados, navigate]);

  const actions = useMemo(() => {
    if (!searchEnabled || isFetching || isError) return [staticActions];
    return [staticActions, ...dynamicGroups];
  }, [staticActions, dynamicGroups, searchEnabled, isFetching, isError]);

  const nothingFound = useMemo(() => {
    if (!searchEnabled) {
      return "No se encontraron secciones.";
    }
    if (isFetching) {
      return (
        <Group gap="xs" justify="center">
          <Loader size="xs" />
          <Text size="sm" c="dimmed">
            Buscando…
          </Text>
        </Group>
      );
    }
    if (isError) {
      return (
        <Group gap="xs" justify="center">
          <IconAlertTriangle size={16} />
          <Text size="sm" c="dimmed">
            No se pudo conectar con el buscador. Podés seguir navegando por sección.
          </Text>
        </Group>
      );
    }
    return (
      <Group gap="xs" justify="center">
        <IconMoodEmpty size={16} />
        <Text size="sm" c="dimmed">
          Sin resultados para &quot;{trimmedQuery}&quot;.
        </Text>
      </Group>
    );
  }, [searchEnabled, isFetching, isError, trimmedQuery]);

  return (
    <Spotlight
      actions={actions}
      filter={spotlightFilter}
      query={query}
      onQueryChange={setQuery}
      nothingFound={nothingFound}
      forceOpened={forceOpened}
      searchProps={{
        placeholder: "Buscá una sección, envío, viaje, patente...",
      }}
    />
  );
};

export default NavigationSpotlight;
