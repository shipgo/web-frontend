import { omit } from "es-toolkit";
import { useState, useCallback } from "react";

const DEFAULT_PARAMS = {
  page: 1,
  filters: {},
};

export const useParams = (initialParams = DEFAULT_PARAMS) => {
  const [params, setParams] = useState(initialParams);

  const setPage = useCallback((newPage) => {
    setParams((prevParams) => ({
      ...prevParams,
      page: newPage,
    }));
  }, []);

  const setFilters = useCallback((newFilters) => {
    setParams((prevParams) => ({
      ...prevParams,
      page: 1,
      filters: newFilters,
    }));
  }, []);

  const removeFilter = useCallback((filterToRemove) => {
    setParams((prevParams) => ({
      page: 1,
      filters: omit(prevParams.filters, filterToRemove),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setParams(DEFAULT_PARAMS);
  }, []);

  return { params, setPage, setFilters, clearFilters, removeFilter };
};
