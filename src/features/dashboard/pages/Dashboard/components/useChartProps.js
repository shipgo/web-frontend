import { useIsMobile } from '@hooks/useIsMobile';

/**
 * Props de recharts/Mantine Charts para dashboard según el ancho: en mobile los
 * gráficos de barras bajan a ~220 px de alto y el eje X muestra menos ticks
 * (separación mínima entre etiquetas, rotación suave) para que no se pisen.
 * En escritorio devuelve los valores de siempre.
 */
export const useBarChartProps = (desktopHeight) => {
  const isMobile = useIsMobile();

  if (!isMobile) return { h: desktopHeight };

  return {
    h: 220,
    xAxisProps: { minTickGap: 28, interval: 'preserveStartEnd', tickMargin: 8 },
    yAxisProps: { width: 36 },
  };
};
