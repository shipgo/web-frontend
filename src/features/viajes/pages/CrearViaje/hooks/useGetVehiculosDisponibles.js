import { useInfiniteQuery } from "@tanstack/react-query";

const VEHICLES = [
  {
    id: 1,
    modelo: "Scania R500",
    patente: "KE6224",
    capacidad: 9443,
    disponible: true,
  },
  {
    id: 2,
    modelo: "Volvo FH16",
    patente: "SA8898",
    capacidad: 1748,
    disponible: true,
  },
  {
    id: 3,
    modelo: "Mercedes-Benz Actros",
    patente: "AF5408",
    capacidad: 3888,
    disponible: false,
  },
  {
    id: 4,
    modelo: "MAN TGX",
    patente: "AF4803",
    capacidad: 9685,
    disponible: true,
  },
  {
    id: 5,
    modelo: "Iveco Stralis",
    patente: "LH2472",
    capacidad: 7555,
    disponible: true,
  },
  {
    id: 6,
    modelo: "DAF XF",
    patente: "AV1393",
    capacidad: 2860,
    disponible: false,
  },
  {
    id: 7,
    modelo: "Renault T High",
    patente: "TG5404",
    capacidad: 7577,
    disponible: true,
  },
  {
    id: 8,
    modelo: "Scania R450",
    patente: "WN8004",
    capacidad: 7903,
    disponible: true,
  },
  {
    id: 9,
    modelo: "Volvo FMX",
    patente: "SA2814",
    capacidad: 3351,
    disponible: false,
  },
  {
    id: 10,
    modelo: "Mercedes-Benz Arocs",
    patente: "AI6015",
    capacidad: 7617,
    disponible: true,
  },
];

const getVehiculosDisponibles = ({ pageParam, pageSize = 25 }) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const offset = pageParam + pageSize;
      const data = VEHICLES.slice(pageParam, offset);
      const nextPage = VEHICLES.length > offset ? offset : null;
      if (true) {
        resolve({ data, nextPage });
      } else {
        reject({ data, nextPage });
      }
    }, 2000);
  });

export const useGetVehiculosDisponibles = ({ searchValue }) =>
  useInfiniteQuery({
    initialPageParam: 1,
    queryFn: getVehiculosDisponibles,
    queryKey: ["vehiculos-disponibles", searchValue],
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
