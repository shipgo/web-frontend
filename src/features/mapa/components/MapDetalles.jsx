import { useEffect } from 'react';
import { Link } from 'wouter';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Progress,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconBrandWhatsapp,
  IconClock,
  IconMapPin,
  IconPackage,
  IconPhone,
  IconTruck,
  IconUser,
  IconX,
} from '@tabler/icons-react';

import { esEstadoTerminal, estadoBadge } from '@domain/estados';
import { formatFechaHora, formatTelefono } from '@domain/format';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { useGetRoute } from '../hooks/useGetRoute';
import { useViajesConUbicacion } from '../hooks/useViajesConUbicacion';
import { direccionDeRecorrido } from '../utils/recorridos';

const InfoRow = ({ icon, label, children, action }) => (
  <Group gap={8} wrap="nowrap" align="flex-start">
    <ThemeIcon variant="light" color="gray" size="sm" radius="xl" mt={1}>
      {icon}
    </ThemeIcon>
    <Box style={{ minWidth: 0, flex: 1 }}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Group gap={6} wrap="nowrap">
        <Text size="sm" fw={500} truncate style={{ flex: 1 }}>
          {children ?? '—'}
        </Text>
        {action}
      </Group>
    </Box>
  </Group>
);

/**
 * Panel de detalle del viaje seleccionado en el mapa en vivo (`SHG-FE-014`):
 * chofer, teléfono, vehículo, ETA, próxima parada y envíos pendientes, con
 * link a `DetalleViaje`. Reemplaza el overlay mínimo (sólo progreso) dejado
 * por `SHG-FE-013`.
 *
 * - ETA y próxima parada salen de `useGetRoute` (recorridos de
 *   `viajeApi.getById` + progreso de `SHG-BE-015` + Mapbox Directions —
 *   el backend no calcula ETA, ver `ViajeEstadoDTO`).
 * - Si el viaje seleccionado deja de estar `en_camino` (evento SSE
 *   `viaje-finalizado`, ya reflejado en `viajesActivos` por
 *   `TrackingProvider`) se limpia la selección y el panel se cierra solo.
 */
const MapDetalles = () => {
  const { selectedViajeId, setSelectedViajeId } = useSelectedViaje();
  const { viajes, isLoading: isLoadingActivos } = useViajesConUbicacion();

  const seleccionado = viajes.find((v) => v.id === selectedViajeId);
  const { viaje, paradas, progreso, route } = useGetRoute(
    selectedViajeId,
    seleccionado?.currentLocation,
  );

  useEffect(() => {
    if (!selectedViajeId || isLoadingActivos) return;
    const sigueActivo = viajes.some((v) => v.id === selectedViajeId);
    if (!sigueActivo) setSelectedViajeId(null);
  }, [selectedViajeId, viajes, isLoadingActivos, setSelectedViajeId]);

  if (!selectedViajeId || !seleccionado || !viaje) return null;

  const paradasEntregadas = progreso?.paradasEntregadas ?? 0;
  const paradasTotales = progreso?.paradasTotales ?? paradas.length;
  const enviosPendientes = progreso?.enviosPendientes ?? 0;
  const porcentaje = paradasTotales > 0 ? (paradasEntregadas / paradasTotales) * 100 : 0;

  const proximaParada = paradas.find((p) => !esEstadoTerminal('recorrido', p.estado));

  // ETA: si no hay próxima parada (todas entregadas), no hay ETA.
  // Nota: `legDurations` aproxima parada[n-1]→parada[n] en lugar de posición_actual→parada[n].
  // Esta aproximación puede desalinearse si una parada sin coords se filtra en useGetRoute.
  // Por simplicidad, se mantiene esta lógica; una mejora futura sería calcular desde posición
  // actual solo las duraciones de los waypoints pendientes + posición actual.
  const restanteSegundos = proximaParada && route?.legDurations
    ? route.legDurations.slice(paradasEntregadas).reduce((sum, d) => sum + d, 0)
    : null;
  const eta = restanteSegundos != null ? new Date(Date.now() + restanteSegundos * 1000) : null;

  const chofer = viaje.chofer;
  const choferNombre =
    [chofer?.nombre, chofer?.apellido].filter(Boolean).join(' ') || 'Sin chofer asignado';
  const telefono = chofer?.telefono ? formatTelefono(chofer) : null;

  // WhatsApp: normalizar prefijo que puede ser '+54', '54', o '11' (area code)
  // para evitar duplicar el código de país. Remover '+' y '54' líderes del prefijo,
  // concatenar con teléfono, remover no-dígitos, prepender '54' una sola vez.
  const normalizarPrefijo = (prefijo) => {
    if (!prefijo) return '';
    let normalizado = String(prefijo).replace(/^\+/, '').trim();
    if (normalizado.startsWith('54')) {
      normalizado = normalizado.slice(2);
    }
    return normalizado;
  };
  const digitosWhatsapp = `${normalizarPrefijo(chofer?.prefijo)}${chofer?.telefono ?? ''}`.replace(/\D/g, '');

  const estadoInfo = estadoBadge('viaje', viaje.estado);

  return (
    <Card
      shadow="sm"
      p="sm"
      radius="md"
      withBorder
      pos="absolute"
      top={12}
      right={12}
      style={{ zIndex: 1, width: 300, maxHeight: 'calc(100% - 24px)', overflowY: 'auto' }}
    >
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Box>
            <Text size="sm" fw={700}>
              {viaje.vehiculo?.patente ?? `Viaje #${selectedViajeId}`}
            </Text>
            <Badge variant="light" color={estadoInfo.color} size="sm" mt={4}>
              {estadoInfo.label}
            </Badge>
          </Box>
          <Tooltip label="Cerrar panel">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Cerrar panel"
              onClick={() => setSelectedViajeId(null)}
            >
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        <InfoRow
          icon={<IconUser size={14} />}
          label="Chofer"
          action={
            digitosWhatsapp && (
              <Tooltip label="Contactar por WhatsApp">
                <ActionIcon
                  variant="subtle"
                  color="green"
                  size="sm"
                  component="a"
                  href={`https://wa.me/54${digitosWhatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Contactar por WhatsApp"
                >
                  <IconBrandWhatsapp size={14} />
                </ActionIcon>
              </Tooltip>
            )
          }
        >
          {choferNombre}
        </InfoRow>

        <InfoRow icon={<IconPhone size={14} />} label="Teléfono">
          {telefono}
        </InfoRow>

        <InfoRow icon={<IconTruck size={14} />} label="Vehículo">
          {[viaje.vehiculo?.patente, viaje.vehiculo?.modelo?.nombre].filter(Boolean).join(' · ') ||
            '—'}
        </InfoRow>

        <InfoRow icon={<IconClock size={14} />} label="ETA">
          {eta ? formatFechaHora(eta) : 'Sin datos de ruta'}
        </InfoRow>

        <InfoRow icon={<IconMapPin size={14} />} label="Próxima parada">
          {proximaParada ? direccionDeRecorrido(proximaParada) : 'Sin paradas pendientes'}
        </InfoRow>

        <Divider />

        <Group justify="space-between">
          <Text size="sm" fw={600}>
            Progreso
          </Text>
          <Badge variant="light" size="sm">
            {paradasEntregadas}/{paradasTotales} paradas
          </Badge>
        </Group>
        <Progress value={porcentaje} size="sm" />
        <Group gap={6}>
          <IconPackage size={14} />
          <Text size="xs" c="dimmed">
            {enviosPendientes} envío(s) pendiente(s)
          </Text>
        </Group>

        <Button component={Link} to={`~/viajes/${selectedViajeId}`} variant="light" size="xs" fullWidth>
          Ver detalle completo
        </Button>
      </Stack>
    </Card>
  );
};

export default MapDetalles;
