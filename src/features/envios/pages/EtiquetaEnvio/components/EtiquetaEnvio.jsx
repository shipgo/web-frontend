import { useEffect, useLayoutEffect, useRef } from 'react';
import QRCode from 'react-qr-code';

import { formatDireccion, formatFechaHora, formatPeso, formatTelefono } from '@domain/format';

import { TIPO_ENTREGA } from '../../../constants';
import './EtiquetaEnvio.css';

const QR_SIZE_PX = 220;
const MAX_ITEMS = 3;

// Tamaños de partida y mínimos (mm) del autoajuste del bloque HASTA.
const NOMBRE_MM = { inicial: 5.2, minimo: 3.4, paso: 0.3 };
const CALLE_MM = { inicial: 4, minimo: 3, paso: 0.25 };
const MAX_PASOS = 16;

const limpiar = (valor) => (valor == null ? '' : String(valor).trim());

/** Calle y número + piso y departamento: `Av. Colón 1250, 4° B`. */
const textoCalle = (punto) => {
  if (!punto) return '';
  const base = formatDireccion(punto);
  const piso = limpiar(punto.piso);
  const pisoDepto = [piso && (piso.includes('°') ? piso : `${piso}°`), limpiar(punto.departamento)]
    .filter(Boolean)
    .join(' ');
  return [base === '-' ? '' : base, pisoDepto].filter(Boolean).join(', ');
};

const nombreSucursalRetiro = (sucursal) => {
  const nombre = limpiar(sucursal?.nombre);
  if (!nombre) return '';
  return /^sucursal/i.test(nombre) ? nombre : `Sucursal ${nombre}`;
};

/** Datos del bloque HASTA según el tipo de entrega. */
const datosDestino = (envio) => {
  const destinatario = `${limpiar(envio.nombre)} ${limpiar(envio.apellido)}`.trim();
  const telefono = formatTelefono(envio.prefijo, envio.telefono);
  const tel = telefono === '-' ? '' : telefono;

  if (envio.tipoEntrega === TIPO_ENTREGA.SUCURSAL) {
    const punto = envio.sucursalEntrega?.puntoEntrega;
    return {
      rotulo: 'Hasta · retiro en sucursal',
      principal: nombreSucursalRetiro(envio.sucursalEntrega),
      calle: textoCalle(punto),
      secundario: destinatario ? `Retira: ${destinatario}` : '',
      localidad: punto?.localidad?.nombre ?? '',
      provincia: punto?.localidad?.provincia?.nombre ?? '',
      tel,
    };
  }
  return {
    rotulo: 'Hasta',
    principal: destinatario,
    calle: textoCalle(envio.destino),
    secundario: '',
    localidad: envio.destino?.localidad?.nombre ?? '',
    provincia: envio.destino?.localidad?.provincia?.nombre ?? '',
    tel,
  };
};

const textoItem = (item) => {
  const texto = limpiar(item.nombre) || limpiar(item.descripcion) || limpiar(item.categoria?.nombre);
  if (!texto) return null;
  return item.cantidad != null ? `${item.cantidad} × ${texto}` : texto;
};

const lineasContenido = (detalleEnvios) => {
  const lineas = (detalleEnvios ?? []).map(textoItem).filter(Boolean);
  const visibles = lineas.slice(0, MAX_ITEMS);
  if (lineas.length > MAX_ITEMS) visibles.push(`+${lineas.length - MAX_ITEMS} más`);
  return visibles;
};

/**
 * Achica nombre y calle del bloque HASTA, en pasos, hasta que nada quede
 * cortado (scrollHeight <= clientHeight). Si el bloque no tiene layout (por
 * ejemplo `display: none`), no hace nada.
 */
const ajustarHasta = (bloque, nombre, calle) => {
  if (!bloque || !nombre) return;
  nombre.style.fontSize = '';
  if (calle) calle.style.fontSize = '';
  if (bloque.clientHeight === 0) return;

  let n = NOMBRE_MM.inicial;
  let c = CALLE_MM.inicial;
  for (let i = 0; i < MAX_PASOS && bloque.scrollHeight > bloque.clientHeight + 1; i += 1) {
    n = Math.max(NOMBRE_MM.minimo, n - NOMBRE_MM.paso);
    c = Math.max(CALLE_MM.minimo, c - CALLE_MM.paso);
    nombre.style.fontSize = `${n}mm`;
    if (calle) calle.style.fontSize = `${c}mm`;
  }
};

const Logo = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className="etiqueta-envio__logo-icono">
    <rect width="32" height="32" rx="4" fill="#000" />
    <g transform="translate(6.52,6.62) scale(0.7815)">
      <path
        d="M3,13.5L2.25,12H7.5L6.9,10.5H2L1.25,9H9.05L8.45,7.5H1.11L0.25,6H4A2,2 0 0,1 6,4H18V8H21L24,12V17H22A3,3 0 0,1 19,20A3,3 0 0,1 16,17H12A3,3 0 0,1 9,20A3,3 0 0,1 6,17H4V13.5H3M19,18.5A1.5,1.5 0 0,0 20.5,17A1.5,1.5 0 0,0 19,15.5A1.5,1.5 0 0,0 17.5,17A1.5,1.5 0 0,0 19,18.5M20.5,9.5H18V12H22.46L20.5,9.5M9,18.5A1.5,1.5 0 0,0 10.5,17A1.5,1.5 0 0,0 9,15.5A1.5,1.5 0 0,0 7.5,17A1.5,1.5 0 0,0 9,18.5Z"
        fill="#fff"
      />
    </g>
  </svg>
);

/**
 * Etiqueta imprimible de 100x150 mm (siempre blanco y negro): logo y tipo de
 * entrega, DESDE, HASTA (se autoajusta para que nada quede cortado), QR del
 * `codigoSeguimiento` (el payload es sólo el código, lo que lee la app mobile)
 * con peso y contenido, y pie. Reusable para impresión masiva (una etiqueta por
 * página). Asume `envio.codigoSeguimiento` presente. `fechaImpresion` es
 * opcional (por defecto, ahora) para poder testearla de forma determinista.
 */
const EtiquetaEnvio = ({ envio, testId = 'etiqueta-envio', fechaImpresion }) => {
  const hastaRef = useRef(null);
  const nombreRef = useRef(null);
  const calleRef = useRef(null);
  const fechaRef = useRef(fechaImpresion ?? new Date());

  const esSucursal = envio.tipoEntrega === TIPO_ENTREGA.SUCURSAL;
  const origen = envio.sucursalOrigen;
  const origenDireccion = origen?.puntoEntrega ? formatDireccion(origen.puntoEntrega) : '';
  const destino = datosDestino(envio);
  const peso = envio.peso != null && envio.peso !== '' ? formatPeso(envio.peso) : null;
  const contenido = lineasContenido(envio.detalleEnvios);
  const impresa = formatFechaHora(fechaImpresion ?? fechaRef.current);

  const huella = [destino.principal, destino.calle, destino.secundario, destino.localidad, destino.provincia, destino.tel].join('|');

  useLayoutEffect(() => {
    ajustarHasta(hastaRef.current, nombreRef.current, calleRef.current);
  }, [huella]);

  // Si la etiqueta estaba oculta (o las fuentes llegan tarde), recalcula al
  // imprimir y cuando terminan de cargar las fuentes.
  useEffect(() => {
    const reajustar = () => ajustarHasta(hastaRef.current, nombreRef.current, calleRef.current);
    window.addEventListener('beforeprint', reajustar);
    document.fonts?.ready?.then(reajustar);
    return () => window.removeEventListener('beforeprint', reajustar);
  }, []);

  return (
    <div className="etiqueta-envio" data-testid={testId}>
      <div className="etiqueta-envio__top">
        <div className="etiqueta-envio__logo">
          <Logo />
          <span>shipgo</span>
        </div>
        <div className="etiqueta-envio__tipo">{esSucursal ? 'RETIRO EN SUCURSAL' : 'A DOMICILIO'}</div>
      </div>

      {origen?.nombre && (
        <div className="etiqueta-envio__desde">
          <span className="etiqueta-envio__k">Desde</span>
          <b>{origen.nombre}</b>
          {origenDireccion && origenDireccion !== '-' && <em>{origenDireccion}</em>}
        </div>
      )}

      <div className="etiqueta-envio__hasta" ref={hastaRef}>
        <span className="etiqueta-envio__k">{destino.rotulo}</span>
        {destino.principal && (
          <div className="etiqueta-envio__nom" ref={nombreRef}>
            {destino.principal}
          </div>
        )}
        {destino.calle && (
          <div className="etiqueta-envio__dir" ref={calleRef}>
            {destino.calle}
          </div>
        )}
        {destino.secundario && <div className="etiqueta-envio__nom etiqueta-envio__nom--sec">{destino.secundario}</div>}
        {(destino.localidad || destino.provincia) && (
          <div className="etiqueta-envio__ciu">
            {destino.localidad}
            {destino.provincia && <small>{destino.provincia}</small>}
          </div>
        )}
        {destino.tel && <div className="etiqueta-envio__tel">Tel. {destino.tel}</div>}
      </div>

      <div className="etiqueta-envio__cod">
        <div className="etiqueta-envio__qr">
          <QRCode
            value={envio.codigoSeguimiento}
            size={QR_SIZE_PX}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
            title={`Código QR ${envio.codigoSeguimiento}`}
          />
        </div>
        {(peso || contenido.length > 0) && (
          <div className="etiqueta-envio__datos">
            {peso && (
              <div>
                <span className="etiqueta-envio__k">Peso</span>
                <b>{peso}</b>
              </div>
            )}
            {contenido.length > 0 && (
              <div>
                <span className="etiqueta-envio__k">Contenido</span>
                <ul className="etiqueta-envio__items">
                  {contenido.map((linea, i) => (
                    <li key={i}>{linea}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="etiqueta-envio__pie">
        <span>Seguí tu envío en ShipGO!</span>
        <span>Impresa {impresa}</span>
      </div>
    </div>
  );
};

export default EtiquetaEnvio;
