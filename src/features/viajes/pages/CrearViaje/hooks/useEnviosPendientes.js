import { useInfiniteQuery } from "@tanstack/react-query";

import PACKAGES from "./PACKAGES.json";

const getPackages = ({ pageParam, pageSize = 25 }) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const offset = pageParam + pageSize;
      const data = PACKAGES.slice(pageParam, offset);
      const nextPage = PACKAGES.length > offset ? offset : null;
      if (true) {
        resolve({ data, nextPage });
      } else {
        reject({ data, nextPage });
      }
    }, 2000);
  });

export const useEnviosPendientes = ({ searchValue }) =>
  useInfiniteQuery({
    initialPageParam: 1,
    queryFn: getPackages,
    queryKey: ["pending-packages", searchValue],
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
