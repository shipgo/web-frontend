import { useQuery } from "@tanstack/react-query";

import { envioApi } from "@api";

/**
 * `GET /api/envio/paraViaje` (SHG-BE-020) — envíos `creado`/`en_sucursal` agrupados
 * por punto de entrega destino. Cada `EnvioDTO` ya trae su propio `destino`
 * (`PuntoEntregaDTO`), así que acá los aplanamos: el agrupamiento real para
 * armar los recorridos se hace en `ListadoEnviosPendientes` según la acción
 * elegida (entrega local vs. transferencia a sucursal), no según este grupo.
 */
export const useEnviosPendientes = () =>
  useQuery({
    queryKey: ["envios-para-viaje"],
    queryFn: async () => {
      const grupos = await envioApi.getParaViaje();
      return (grupos ?? []).flatMap((grupo) => grupo.envios ?? []);
    },
  });
