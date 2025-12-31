import { mapValues } from "es-toolkit";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";

const VIAJES = [];

const getViajes = (params, pageLimit) =>
  new Promise((resolve) => {
    const offset = (params.page - 1) * pageLimit;

    setTimeout(() => {
      resolve({
        total: VIAJES.length,
        results: VIAJES.slice(offset, offset + pageLimit),
        totalPages: Math.ceil(VIAJES.length / pageLimit),
      });
    }, 1500);
  });

export const useGetViajes = (pageLimit) => {
  const paramsOptions = useParams();

  const normalizedParams = {
    page: paramsOptions.params.page,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
  };

  const {
    isError,
    data = {},
    isFetching: isLoading,
    refetch: refetchViajes,
  } = useQuery({
    queryFn: () => getViajes(normalizedParams, pageLimit),
    queryKey: ["viajes", JSON.stringify(normalizedParams)],
  });

  return {
    data,
    isError,
    isLoading,
    refetchViajes,
    ...paramsOptions,
  };
};
