import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  CopyButton,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Timeline,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  IconBan,
  IconBuilding,
  IconBuildingStore,
  IconCheck,
  IconCircleDot,
  IconCopy,
  IconEdit,
  IconMail,
  IconMapPin,
  IconPackage,
  IconPhone,
  IconRoute,
  IconTruckDelivery,
  IconUser,
  IconX,
} from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import ScreenContainer from "@components/ScreenContainer";
import { envioApi } from "@api";
import { BUTTON_ACTION_TEXT_COLOR, esEstadoTerminal, estadoBadge, estadoLabel } from "@domain/estados";
import { formatDireccion, formatFecha, formatFechaHora } from "@domain/format";
import { useAuthStore } from "@stores/auth.store";

import { TIPO_ENTREGA } from "../../constants";
import { puedeAccionarEntrega, puedeConfirmarRetiro } from "./acciones";
import { useEnvioAcciones } from "./hooks/useEnvioAcciones";

const InfoItem = ({ icon, label, value }) => (
  <Box>
    <Group gap="xs" mb={4}>
      {icon}
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
    </Group>
    <Text size="sm" fw={500}>
      {value || "-"}
    </Text>
  </Box>
);

const fechaHistorial = (item) => item.fechaHoraInicio ?? item.fecha;

/** `puntoEntrega` y `sucursalDestino` son XOR (ver CONTRACTS.md §8). */
const destinoRecorrido = (recorrido) => {
  if (!recorrido) return "-";
  if (recorrido.puntoEntrega) return formatDireccion(recorrido.puntoEntrega, { completa: true });
  if (recorrido.sucursalDestino) {
    const direccion = recorrido.sucursalDestino.puntoEntrega
      ? formatDireccion(recorrido.sucursalDestino.puntoEntrega, { completa: true })
      : null;
    return [`Sucursal: ${recorrido.sucursalDestino.nombre ?? "—"}`, direccion].filter(Boolean).join(" · ");
  }
  return "-";
};

const DetalleEnvio = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const user = useAuthStore((state) => state.user);

  const [envio, setEnvio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadEnvio = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(false);
      const data = await envioApi.getById(id);
      setEnvio(data);
    } catch (err) {
      console.error("Error cargando envío:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEnvio();
  }, [loadEnvio]);

  const { confirmEntregar, confirmFalloEntrega, confirmRetiroSucursal } = useEnvioAcciones(id, {
    onSuccess: loadEnvio,
  });

  // Precompute derived values only if envio exists to avoid errors
  const estadoInfo = envio ? estadoBadge("envio", envio.estado) : null;
  const canEdit = envio ? !esEstadoTerminal("envio", envio.estado) : false;
  const canAccionarEstado = envio ? puedeAccionarEntrega(user, envio.estado) : false;
  const canConfirmarRetiro = envio ? puedeConfirmarRetiro(user, envio) : false;
  const esRetiroSucursal = envio?.tipoEntrega === TIPO_ENTREGA.SUCURSAL;
  const destino = envio?.destino ?? {};
  const localidad = destino.localidad ?? {};
  const provincia = localidad.provincia ?? {};
  const direccion = [destino.nombreCalle, destino.numeroCalle].filter(Boolean).join(" ");
  // `sucursalEntrega` (SHG-CONTRACT-012): sucursal de retiro elegida por el
  // remitente cuando `tipoEntrega = 'sucursal'`. Distinta de `envio.sucursal`
  // (ubicación actual del envío). Su dirección vive en `sucursalEntrega.puntoEntrega`
  // (forma verificada en vivo contra el backend, SHG-FE-084).
  const sucursalRetiro = envio?.sucursalEntrega ?? null;
  const puntoRetiro = sucursalRetiro?.puntoEntrega ?? {};
  const localidadRetiro = puntoRetiro.localidad ?? {};
  const provinciaRetiro = localidadRetiro.provincia ?? {};
  const direccionRetiro = [puntoRetiro.nombreCalle, puntoRetiro.numeroCalle].filter(Boolean).join(" ");
  const detalleEnvios = envio?.detalleEnvios ?? [];
  const pesoTotal = detalleEnvios.reduce((sum, d) => sum + (d.peso ?? 0), 0);

  const historial = [...(envio?.historialEstado ?? [])].sort(
    (a, b) => new Date(fechaHistorial(a)) - new Date(fechaHistorial(b)),
  );

  const detalleRecorridos = envio?.detalleRecorridos ?? [];
  const recorridoActual = detalleRecorridos[detalleRecorridos.length - 1]?.recorrido ?? null;
  const viajeAsociado = recorridoActual?.viaje ?? null;
  const recorridoEstadoInfo = recorridoActual ? estadoBadge("recorrido", recorridoActual.estado) : null;

  return (
    <PageContainer>
      <ScreenContainer
        onLoading={{ show: loading, description: 'Cargando envío...' }}
        onError={{
          show: error && !loading,
          title: 'No se pudo cargar el envío',
          description: 'Ocurrió un error al obtener la información del envío.',
          onClick: loadEnvio,
        }}
        onEmptyData={{
          show: !loading && !error && !envio,
          title: 'Envío no encontrado',
          description: 'No encontramos información para este envío.',
        }}
      >
        {envio && (
          <>
            <PageBreadcrumbsHeader
        entidad="Envíos"
        accion="Detalle de envío"
        descripcion={
          <Group gap={4}>
            {envio.estado && (
              // `c={estadoInfo.textColor}`: ver `BADGE_TEXT_CONTRAST_OVERRIDE`
              // en `@domain/estados` — sin esto, "En camino"/"Entregado" no
              // llegan a 4.5:1 (axe-core `color-contrast`, SHG-FE-041).
              // `undefined` para el resto de los estados, sin efecto.
              <Badge color={estadoInfo.color} variant="light" mr="xs" c={estadoInfo.textColor}>
                {estadoInfo.label}
              </Badge>
            )}
            <Text size="sm" c="dimmed">
              {envio.codigoSeguimiento
                ? `Código de seguimiento: ${envio.codigoSeguimiento}`
                : `Envío #${id}`}
            </Text>
            {envio.codigoSeguimiento && (
              <CopyButton value={envio.codigoSeguimiento} timeout={1500}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Copiado" : "Copiar código"} withArrow>
                    <ActionIcon
                      color={copied ? "teal" : "gray"}
                      variant="subtle"
                      size="sm"
                      onClick={copy}
                      aria-label="Copiar código de seguimiento"
                    >
                      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            )}
          </Group>
        }
      >
        {canEdit && (
          <Button
            leftSection={<IconEdit size={18} />}
            onClick={() => navigate(`~/envios/editar/${id}`)}
          >
            Editar
          </Button>
        )}
        {/* `c={BUTTON_ACTION_TEXT_COLOR.*}`: ver ese comentario en
            `@domain/estados` — sin esto, "Entregar"/"Marcar fallo" no
            llegan a 4.5:1 (axe-core `color-contrast`, SHG-FE-045). */}
        {canAccionarEstado && (
          <Button
            variant="light"
            color="green"
            c={BUTTON_ACTION_TEXT_COLOR.green}
            leftSection={<IconTruckDelivery size={18} />}
            onClick={confirmEntregar}
          >
            Entregar
          </Button>
        )}
        {canAccionarEstado && (
          <Button
            variant="light"
            color="red"
            c={BUTTON_ACTION_TEXT_COLOR.red}
            leftSection={<IconBan size={18} />}
            onClick={confirmFalloEntrega}
          >
            Marcar fallo
          </Button>
        )}
        {/* "Confirmar retiro" (SHG-FE-080 / SHG-CONTRACT-012): sólo para envíos
            `tipoEntrega = 'sucursal'` que llegaron a `en_sucursal` — rango de
            estado disjunto de `canAccionarEstado` (en_camino/en_vehiculo), así
            que nunca se muestra junto con Entregar/Marcar fallo. */}
        {canConfirmarRetiro && (
          <Button
            variant="light"
            color="green"
            c={BUTTON_ACTION_TEXT_COLOR.green}
            leftSection={<IconBuildingStore size={18} />}
            onClick={confirmRetiroSucursal}
          >
            Confirmar retiro
          </Button>
        )}
      </PageBreadcrumbsHeader>

      <Card withBorder shadow="sm">
        <Stack gap="md">
          <Group gap="xs">
            <IconBuilding size={24} />
            <Box>
              <Text size="lg" fw={600}>
                Ubicación actual y seguimiento
              </Text>
              <Text size="sm" c="dimmed">
                Sucursal actual y fecha de entrega
              </Text>
            </Box>
          </Group>
          <Divider />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <InfoItem
              icon={<IconBuilding size={16} />}
              label="Sucursal actual"
              value={envio.sucursal?.nombre}
            />
            <InfoItem
              icon={<IconMapPin size={16} />}
              label="Fecha de entrega"
              value={envio.fechaEntrega ? formatFecha(envio.fechaEntrega) : null}
            />
          </SimpleGrid>
        </Stack>
      </Card>

      <Card withBorder shadow="sm">
        <Stack gap="md">
          <Group gap="xs">
            <IconUser size={24} />
            <Box>
              <Text size="lg" fw={600}>
                Remitente y receptor
              </Text>
              <Text size="sm" c="dimmed">
                Datos de contacto del envío
              </Text>
            </Box>
          </Group>
          <Divider />
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
            <InfoItem
              icon={<IconUser size={16} />}
              label="Nombre completo"
              value={`${envio.nombre ?? ""} ${envio.apellido ?? ""}`.trim()}
            />
            <InfoItem
              icon={<IconMail size={16} />}
              label="Email remitente"
              value={envio.emailRemitente}
            />
            <InfoItem
              icon={<IconMail size={16} />}
              label="Email receptor"
              value={envio.emailReceptor}
            />
            <InfoItem
              icon={<IconPhone size={16} />}
              label="Teléfono"
              value={
                envio.prefijo || envio.telefono
                  ? `${envio.prefijo ?? ""} ${envio.telefono ?? ""}`.trim()
                  : null
              }
            />
            {/* `dniReceptor` (SHG-BE-042): sólo presente una vez entregado el envío
                (`@JsonInclude(NON_EMPTY)`). A diferencia de `palabraEntrega`, este
                campo SÍ es visible para el operador — es el dato de auditoría de
                quién recibió el envío. NUNCA mostrar `palabraEntrega` acá. */}
            {envio.dniReceptor && (
              <InfoItem
                icon={<IconUser size={16} />}
                label="DNI de quien recibió"
                value={envio.dniReceptor}
              />
            )}
          </SimpleGrid>
        </Stack>
      </Card>

      <Card withBorder shadow="sm">
        <Stack gap="md">
          <Group gap="xs">
            {esRetiroSucursal ? <IconBuildingStore size={24} /> : <IconMapPin size={24} />}
            <Box>
              <Text size="lg" fw={600}>
                Destino
              </Text>
              <Text size="sm" c="dimmed">
                {esRetiroSucursal ? "Retiro en sucursal" : "Dirección de entrega"}
              </Text>
            </Box>
          </Group>
          <Divider />
          {esRetiroSucursal ? (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              <InfoItem
                icon={<IconBuildingStore size={16} />}
                label="Sucursal de retiro"
                value={sucursalRetiro?.nombre}
              />
              <InfoItem icon={<IconMapPin size={16} />} label="Dirección" value={direccionRetiro} />
              <InfoItem icon={<IconMapPin size={16} />} label="Localidad" value={localidadRetiro.nombre} />
              <InfoItem icon={<IconMapPin size={16} />} label="Provincia" value={provinciaRetiro.nombre} />
            </SimpleGrid>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
              <InfoItem icon={<IconMapPin size={16} />} label="Dirección" value={direccion} />
              {/* `piso`/`departamento` (SHG-BE-041): opcionales, sólo se muestran si vienen cargados. */}
              {destino.piso && (
                <InfoItem icon={<IconMapPin size={16} />} label="Piso" value={destino.piso} />
              )}
              {destino.departamento && (
                <InfoItem icon={<IconMapPin size={16} />} label="Departamento" value={destino.departamento} />
              )}
              <InfoItem icon={<IconMapPin size={16} />} label="Localidad" value={localidad.nombre} />
              <InfoItem icon={<IconMapPin size={16} />} label="Provincia" value={provincia.nombre} />
            </SimpleGrid>
          )}
        </Stack>
      </Card>

      <Card withBorder shadow="sm">
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconPackage size={24} />
              <Box>
                <Text size="lg" fw={600}>
                  Paquetes
                </Text>
                <Text size="sm" c="dimmed">
                  {detalleEnvios.length} {detalleEnvios.length === 1 ? "paquete" : "paquetes"} · {pesoTotal} kg en total
                </Text>
              </Box>
            </Group>
          </Group>
          <Divider />
          {detalleEnvios.length === 0 ? (
            <Text c="dimmed" size="sm">
              Este envío no tiene paquetes cargados
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Categoría</Table.Th>
                  <Table.Th>Peso</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {detalleEnvios.map((d, index) => (
                  <Table.Tr key={d.id ?? index}>
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>{d.categoria?.nombre ?? "-"}</Table.Td>
                    <Table.Td>{d.peso != null ? `${d.peso} kg` : "-"}</Table.Td>
                    <Table.Td>{d.descripcion || "-"}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>

      <Card withBorder shadow="sm">
        <Stack gap="md">
          <Group gap="xs">
            <IconRoute size={24} />
            <Box>
              <Text size="lg" fw={600}>
                Viaje / recorrido
              </Text>
              <Text size="sm" c="dimmed">
                Estado del recorrido asignado a este envío
              </Text>
            </Box>
          </Group>
          <Divider />
          {!recorridoActual || !viajeAsociado ? (
            <Text c="dimmed" size="sm">
              Este envío todavía no fue asignado a un viaje.
            </Text>
          ) : (
            <Group justify="space-between" wrap="wrap">
              <Box>
                <Group gap="xs" mb={4}>
                  <Anchor fw={600} onClick={() => navigate(`~/viajes/${viajeAsociado.id}`)}>
                    Viaje #{viajeAsociado.id}
                  </Anchor>
                  {/* `c={recorridoEstadoInfo.textColor}`: ver
                      `BADGE_TEXT_CONTRAST_OVERRIDE` en `@domain/estados` —
                      sin esto, "En camino"/"Finalizado" no llegan a 4.5:1
                      (axe-core `color-contrast`, SHG-FE-041). `undefined`
                      para el resto de los estados, sin efecto. */}
                  <Badge color={recorridoEstadoInfo.color} variant="light" c={recorridoEstadoInfo.textColor}>
                    {recorridoEstadoInfo.label}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {destinoRecorrido(recorridoActual)}
                </Text>
              </Box>
              {/* `c="var(--shg-button-text-primary)"`: ver ese token en
                  `cssVariablesResolver.js` (SHG-FE-069) — sin esto, el texto
                  del color primario en `variant="light"` no llega a 4.5:1 en
                  dark mode (axe-core `color-contrast`, detectado en
                  SHG-FE-060/SHG-FE-067 y pospuesto dos veces). */}
              <Button
                variant="light"
                leftSection={<IconRoute size={16} />}
                onClick={() => navigate(`~/viajes/${viajeAsociado.id}`)}
                c="var(--shg-button-text-primary)"
              >
                Ver viaje
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      <Card withBorder shadow="sm">
        <Stack gap="md">
          <Title order={4}>Historial de estados</Title>
          {historial.length === 0 ? (
            <Text c="dimmed" size="sm">
              Este envío todavía no tiene historial de estados.
            </Text>
          ) : (
            <Timeline active={historial.length - 1} bulletSize={22} lineWidth={2}>
              {historial.map((item, index) => {
                const { color } = estadoBadge("envio", item.estado);
                return (
                  <Timeline.Item
                    key={item.id ?? index}
                    bullet={<IconCircleDot size={14} />}
                    color={color}
                    title={estadoLabel("envio", item.estado)}
                    data-testid="historial-estado-item"
                  >
                    <Text size="xs" c="dimmed">
                      {formatFechaHora(fechaHistorial(item))}
                    </Text>
                    {item.motivo && (
                      <Text size="sm" mt={2}>
                        {item.motivo}
                      </Text>
                    )}
                  </Timeline.Item>
                );
              })}
            </Timeline>
          )}
        </Stack>
      </Card>
            </>
          )}
      </ScreenContainer>
    </PageContainer>
  );
};

export default DetalleEnvio;
