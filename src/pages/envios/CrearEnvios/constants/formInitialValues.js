const DESTINATARIO_INITIAL_VALUES = {
  nombre: "",
  apellido: "",
  email: "",
  prefijo_telefono: "",
  telefono: "",
  tipo_documento: "",
  numero_documento: "",
};

const DIRECCION_INITIAL_VALUES = {
  calle: "",
  numero: "",
  provincia: "",
  localidad: "",
  comentario: "",
};

export const CREAR_ENVIO_INITIAL_VALUES = {
  ...DESTINATARIO_INITIAL_VALUES,
  ...DIRECCION_INITIAL_VALUES,
  paquetes: [],
};
