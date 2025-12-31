import { restclient } from "@config/restclient";
import { useQueryClient, useQuery } from "@tanstack/react-query";

const getLocalidades = (provinciaId) =>
  restclient
    .get(`/localidades/provincia/${provinciaId}`)
    .then((response) => response.data);

export const useGetLocalidades = (provinciaId) => {
  const queryClient = useQueryClient();

  const localidadesQuery = useQuery({
    enabled: provinciaId !== "",
    queryKey: ["localidades", provinciaId],
    queryFn: () => getLocalidades(provinciaId),
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ["localidades"] });
    localidadesQuery.refetch();
  };

  return {
    localidadesQuery,
    refetch,
  };
};
