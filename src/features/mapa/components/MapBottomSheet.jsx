import { useRef, useState } from 'react';
import { Box, Text } from '@mantine/core';

const SHEET_SNAPS = ['peek', 'half', 'full'];

const PEEK_PX = 96;
const SAFE_BOTTOM = 'env(safe-area-inset-bottom)';
const SNAP_CSS = {
  peek: `calc(${PEEK_PX}px + ${SAFE_BOTTOM})`,
  half: '50%',
  full: '85%',
};
const TAP_THRESHOLD_PX = 6;

/**
 * Hoja inferior del mapa en mobile con tres alturas (asomada ~96 px, media 50 %,
 * completa 85 % del contenedor). Se mueve SÓLO desde el asa (tocar cicla las
 * alturas; arrastrar la lleva a la más cercana), así no pelea con los gestos del
 * mapa ni con el scroll de la lista.
 *
 * @param {Object} props
 * @param {'peek'|'half'|'full'} props.snap
 * @param {(snap: string) => void} props.onSnapChange
 * @param {string} props.title Texto de la cabecera (visible asomada).
 */
const MapBottomSheet = ({ snap, onSnapChange, title, children }) => {
  const sheetRef = useRef(null);
  const dragRef = useRef(null);
  const [dragHeight, setDragHeight] = useState(null);

  const alturasPx = (contenedorH) => ({
    peek: PEEK_PX,
    half: contenedorH * 0.5,
    full: contenedorH * 0.85,
  });

  const onPointerDown = (e) => {
    const sheet = sheetRef.current;
    const contenedor = sheet?.parentElement;
    if (!sheet || !contenedor) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startY: e.clientY,
      startH: sheet.getBoundingClientRect().height,
      maxH: contenedor.clientHeight,
      moved: false,
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = d.startY - e.clientY;
    if (Math.abs(dy) > TAP_THRESHOLD_PX) d.moved = true;
    if (!d.moved) return;
    setDragHeight(Math.min(d.maxH * 0.85, Math.max(PEEK_PX, d.startH + dy)));
  };

  const onPointerUp = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!d.moved) {
      onSnapChange(SHEET_SNAPS[(SHEET_SNAPS.indexOf(snap) + 1) % SHEET_SNAPS.length]);
      return;
    }
    const altura = Math.min(d.maxH * 0.85, Math.max(PEEK_PX, d.startH + (d.startY - e.clientY)));
    const px = alturasPx(d.maxH);
    const masCercana = SHEET_SNAPS.reduce((best, s) =>
      Math.abs(px[s] - altura) < Math.abs(px[best] - altura) ? s : best,
    );
    setDragHeight(null);
    onSnapChange(masCercana);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp') onSnapChange(SHEET_SNAPS[Math.min(SHEET_SNAPS.indexOf(snap) + 1, 2)]);
    if (e.key === 'ArrowDown') onSnapChange(SHEET_SNAPS[Math.max(SHEET_SNAPS.indexOf(snap) - 1, 0)]);
  };

  return (
    <Box
      ref={sheetRef}
      data-testid="map-bottom-sheet"
      data-snap={snap}
      bg="var(--mantine-color-body)"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        height: dragHeight != null ? `${dragHeight}px` : SNAP_CSS[snap],
        transition: dragHeight != null ? 'none' : 'height 200ms ease',
        display: 'flex',
        flexDirection: 'column',
        borderTopLeftRadius: 'var(--mantine-radius-lg)',
        borderTopRightRadius: 'var(--mantine-radius-lg)',
        boxShadow: 'var(--mantine-shadow-lg)',
        overflow: 'hidden',
        paddingBottom: SAFE_BOTTOM,
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-label="Cambiar altura de la lista de viajes"
        data-testid="map-bottom-sheet-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
          setDragHeight(null);
        }}
        onKeyDown={onKeyDown}
        style={{
          height: 44,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          cursor: 'grab',
        }}
      >
        <Box w={40} h={5} style={{ borderRadius: 3, background: 'var(--mantine-color-gray-5)' }} />
      </Box>
      <Text fw={600} px="md" pb="xs" style={{ flexShrink: 0 }} data-testid="map-bottom-sheet-title">
        {title}
      </Text>
      <Box style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</Box>
    </Box>
  );
};

export default MapBottomSheet;
