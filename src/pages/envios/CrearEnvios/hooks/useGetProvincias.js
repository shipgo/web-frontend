import { restclient } from "@config/restclient";
import { useQueryClient, useQuery } from "@tanstack/react-query";

const getProvincias = () =>
  restclient.get("/provincias/all").then((response) => response.data);

export const useGetProvincias = () => {
  const queryClient = useQueryClient();

  const provinciasQuery = useQuery({
    queryFn: getProvincias,
    queryKey: ["provincias"],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ["provincias"] });
    provinciasQuery.refetch();
  };

  return {
    provinciasQuery,
    refetch,
  };
};
