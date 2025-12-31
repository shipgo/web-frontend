import { mapValues } from "es-toolkit";

import { useQueryClient, useQuery } from "@tanstack/react-query";

import { restclient } from "@config/restclient";
import { useParams } from "@hooks/useParams";

const getEnvios = (params, pageLimit) =>
  restclient
    .get("/envio", {
      params: {
        page: params.page,
        size: pageLimit,
        ...mapValues(params.filters, (filter) => filter.values),
      },
    })
    .then((res) => res.data);

export const useGetEnvios = (pageLimit) => {
  const queryClient = useQueryClient();

  const paramsOptions = useParams();

  const enviosQuery = useQuery({
    queryFn: () => getEnvios(paramsOptions.params, pageLimit),
    queryKey: ["envios", JSON.stringify(paramsOptions.params)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ["envios"] });
    enviosQuery.refetch();
  };

  return {
    enviosQuery,
    refetch,
    ...paramsOptions,
  };
};
