export const SUCURSALES = [
  { value: 'todas', label: 'Todas las sucursales' },
  { value: 'CABA', label: 'CABA' },
  { value: 'Rosario', label: 'Rosario' },
  { value: 'Córdoba', label: 'Córdoba' },
  { value: 'Mendoza', label: 'Mendoza' },
];

export const ESTADO_CONFIG = {
  incidente: { label: 'Incidente', color: 'red', urgency: 0, zIndex: 40 },
  sin_senal: { label: 'Sin Señal', color: 'gray', urgency: 1, zIndex: 30 },
  demorado: { label: 'Demorado', color: 'orange', urgency: 2, zIndex: 20 },
  a_tiempo: { label: 'A tiempo', color: 'green', urgency: 3, zIndex: 10 },
};

export const VIAJES_MOCK = [
  {
    id: '1', patente: 'AB123CD', chofer: 'Carlos Méndez', telefono: '1134567890',
    sucursal: 'CABA', estado: 'incidente', eta: '14:30', paquetesRestantes: 3,
    originLocation: [-58.393, -34.617],
    currentLocation: [-58.388, -34.609],
    deliveredStops: 1,
    stops: [
      { coords: [-58.385, -34.612], clientName: 'Rodrigo Sánchez', phone: '1134567891', address: 'Av. Corrientes 1234, CABA', timeSlot: '13:00 - 14:00' },
      { coords: [-58.395, -34.603], clientName: 'Lucía Fernández', phone: '1145678902', address: 'Florida 567, CABA', timeSlot: '14:00 - 15:00' },
    ],
  },
  {
    id: '2', patente: 'EF456GH', chofer: 'Laura Gómez', telefono: '1145678901',
    sucursal: 'Rosario', estado: 'demorado', eta: '15:00', paquetesRestantes: 7,
    originLocation: [-60.655, -32.940],
    currentLocation: [-60.655, -32.940],
    deliveredStops: 0,
    stops: [
      { coords: [-60.648, -32.935], clientName: 'Martina López', phone: '3414567890', address: 'Pte. Roca 890, Rosario', timeSlot: '14:00 - 15:00' },
      { coords: [-60.661, -32.948], clientName: 'Felipe Torres', phone: '3415678901', address: 'San Martín 432, Rosario', timeSlot: '15:00 - 16:00' },
    ],
  },
  {
    id: '3', patente: 'IJ789KL', chofer: 'Martín Ruiz', telefono: '1156789012',
    sucursal: 'CABA', estado: 'a_tiempo', eta: '13:45', paquetesRestantes: 5,
    originLocation: [-58.375, -34.598],
    currentLocation: [-58.375, -34.598],
    deliveredStops: 0,
    stops: [
      { coords: [-58.370, -34.594], clientName: 'Valentina Ríos', phone: '1156789013', address: 'Lavalle 789, CABA', timeSlot: '13:30 - 14:30' },
      { coords: [-58.380, -34.602], clientName: 'Ignacio Blanco', phone: '1167890124', address: 'Suipacha 345, CABA', timeSlot: '14:30 - 15:30' },
    ],
  },
  {
    id: '4', patente: 'MN012OP', chofer: 'Ana Torres', telefono: '1167890123',
    sucursal: 'Córdoba', estado: 'sin_senal', eta: '16:15', paquetesRestantes: 2,
    originLocation: [-64.183, -31.410],
    currentLocation: [-64.207, -31.430],
    deliveredStops: 2,
    stops: [
      { coords: [-64.188, -31.415], clientName: 'Diego Romero', phone: '3514567890', address: 'Colón 1120, Córdoba', timeSlot: '14:00 - 15:00' },
      { coords: [-64.202, -31.425], clientName: 'Sofía Castro', phone: '3515678901', address: '9 de Julio 678, Córdoba', timeSlot: '15:00 - 16:00' },
    ],
  },
  {
    id: '5', patente: 'QR345ST', chofer: 'Diego Fernández', telefono: '1178901234',
    sucursal: 'CABA', estado: 'a_tiempo', eta: '14:00', paquetesRestantes: 9,
    originLocation: [-58.358, -34.603],
    currentLocation: [-58.368, -34.612],
    deliveredStops: 1,
    stops: [
      { coords: [-58.362, -34.607], clientName: 'Paula Herrera', phone: '1178901235', address: 'Rivadavia 2345, CABA', timeSlot: '13:00 - 14:00' },
      { coords: [-58.374, -34.618], clientName: 'Tomás Aguirre', phone: '1189012346', address: 'Callao 890, CABA', timeSlot: '14:00 - 15:00' },
    ],
  },
  {
    id: '6', patente: 'UV678WX', chofer: 'Sofía Castro', telefono: '1189012345',
    sucursal: 'Rosario', estado: 'incidente', eta: '13:20', paquetesRestantes: 1,
    originLocation: [-60.642, -32.955],
    currentLocation: [-60.642, -32.955],
    deliveredStops: 0,
    stops: [
      { coords: [-60.636, -32.950], clientName: 'Nicolás Paz', phone: '3416789012', address: 'Córdoba 1560, Rosario', timeSlot: '12:30 - 13:30' },
      { coords: [-60.648, -32.961], clientName: 'Andrea Giménez', phone: '3417890123', address: 'Entre Ríos 234, Rosario', timeSlot: '13:30 - 14:30' },
    ],
  },
  {
    id: '7', patente: 'YZ901AB', chofer: 'Pablo Sosa', telefono: '1190123456',
    sucursal: 'Mendoza', estado: 'demorado', eta: '17:30', paquetesRestantes: 6,
    originLocation: [-68.840, -32.874],
    currentLocation: [-68.852, -32.884],
    deliveredStops: 1,
    stops: [
      { coords: [-68.845, -32.878], clientName: 'Florencia Ortiz', phone: '2614567890', address: 'San Martín 780, Mendoza', timeSlot: '16:30 - 17:30' },
      { coords: [-68.859, -32.890], clientName: 'Ramiro Acosta', phone: '2615678901', address: 'Las Heras 432, Mendoza', timeSlot: '17:30 - 18:30' },
    ],
  },
  {
    id: '8', patente: 'CD234EF', chofer: 'Valentina López', telefono: '1101234567',
    sucursal: 'CABA', estado: 'a_tiempo', eta: '14:45', paquetesRestantes: 4,
    originLocation: [-58.372, -34.586],
    currentLocation: [-58.392, -34.604],
    deliveredStops: 2,
    stops: [
      { coords: [-58.376, -34.590], clientName: 'Sebastián Mora', phone: '1101234568', address: 'Maipú 1234, CABA', timeSlot: '13:45 - 14:45' },
      { coords: [-58.388, -34.600], clientName: 'Camila Reyes', phone: '1112345679', address: 'Esmeralda 567, CABA', timeSlot: '14:45 - 15:45' },
    ],
  },
  {
    id: '9', patente: 'GH567IJ', chofer: 'Roberto Díaz', telefono: '1112345678',
    sucursal: 'Córdoba', estado: 'sin_senal', eta: '15:45', paquetesRestantes: 8,
    originLocation: [-64.170, -31.399],
    currentLocation: [-64.180, -31.408],
    deliveredStops: 1,
    stops: [
      { coords: [-64.174, -31.403], clientName: 'Luciana Ávila', phone: '3518901234', address: 'Belgrano 910, Córdoba', timeSlot: '14:45 - 15:45' },
      { coords: [-64.186, -31.413], clientName: 'Marcos Suárez', phone: '3519012345', address: 'Vélez Sarsfield 345, Córdoba', timeSlot: '15:45 - 16:45' },
    ],
  },
  {
    id: '10', patente: 'KL890MN', chofer: 'Camila Vega', telefono: '1123456789',
    sucursal: 'Mendoza', estado: 'a_tiempo', eta: '16:00', paquetesRestantes: 3,
    originLocation: [-68.838, -32.897],
    currentLocation: [-68.838, -32.897],
    deliveredStops: 0,
    stops: [
      { coords: [-68.831, -32.891], clientName: 'Hernán Rivas', phone: '2619012345', address: 'Sarmiento 678, Mendoza', timeSlot: '15:00 - 16:00' },
      { coords: [-68.844, -32.903], clientName: 'Daniela Cruz', phone: '2610123456', address: 'España 890, Mendoza', timeSlot: '16:00 - 17:00' },
    ],
  },
];
