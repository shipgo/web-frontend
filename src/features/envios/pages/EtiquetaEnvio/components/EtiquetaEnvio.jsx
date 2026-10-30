import QRCode from 'react-qr-code';

import { formatDireccion } from '@domain/format';

import { TIPO_ENTREGA } from '../../../constants';
import './EtiquetaEnvio.css';

const QR_SIZE_PX = 220;

const textoSucursalRetiro = (sucursal) => {
  if (!sucursal) return null;
  const direccion = sucursal.puntoEntrega ? formatDireccion(sucursal.puntoEntrega, { completa: true }) : null;
  return [sucursal.nombre, direccion && direccion !== '-' ? direccion : null].filter(Boolean).join(' - ') || null;
};

const textoDestino = (envio) => {
  if (envio.tipoEntrega === TIPO_ENTREGA.SUCURSAL) {
    const texto = textoSucursalRetiro(envio.sucursalEntrega);
    return texto ? { label: 'Retiro en sucursal', valor: texto } : null;
  }
  const texto = envio.destino ? formatDireccion(envio.destino, { completa: true }) : null;
  return texto && texto !== '-' ? { label: 'Destino', valor: texto } : null;
};

/**
 * Etiqueta imprimible de 100x150 mm: QR del `codigoSeguimiento` (el payload es
 * sólo el código, lo que lee la app mobile) + código en texto + datos de apoyo.
 * Reusable para impresión masiva (una etiqueta por página). Asume
 * `envio.codigoSeguimiento` presente.
 */
const EtiquetaEnvio = ({ envio, testId = 'etiqueta-envio' }) => {
  const destinatario = `${envio.nombre ?? ''} ${envio.apellido ?? ''}`.trim();
  const origen = envio.sucursalOrigen?.nombre;

  const datos = [
    destinatario && { label: 'Destinatario', valor: destinatario },
    textoDestino(envio),
    origen && { label: 'Sucursal de origen', valor: origen },
  ].filter(Boolean);

  return (
    <div className="etiqueta-envio" data-testid={testId}>
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
      <div className="etiqueta-envio__codigo">{envio.codigoSeguimiento}</div>
      {datos.length > 0 && (
        <div className="etiqueta-envio__datos">
          {datos.map(({ label, valor }) => (
            <div key={label}>
              <div className="etiqueta-envio__label">{label}</div>
              <div className="etiqueta-envio__valor">{valor}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EtiquetaEnvio;
