import { useState, useEffect, useCallback } from "react";

/**
 * Hook personalizado para manejar datos paginados de cualquier API
 * 
 * @param {Function} apiMethod - Método de la API que retorna datos paginados
 * @param {Object} initialParams - Parámetros iniciales de la consulta
 * @param {number} initialParams.page - Página inicial (default: 0)
 * @param {number} initialParams.size - Tamaño de página inicial (default: 10)
 * @param {Object} initialParams.filters - Filtros adicionales
 * 
 * @returns {Object} Estado y métodos para manejar la paginación
 */
export const usePaginatedData = (apiMethod, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: initialParams.page || 0,
    size: initialParams.size || 10,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: false,
  });

  const loadData = useCallback(
    async (additionalParams = {}) => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: pagination.page,
          size: pagination.size,
          ...initialParams.filters,
          ...additionalParams,
        };

        const result = await apiMethod(params);

        // Manejar respuesta paginada del backend
        if (result && typeof result === "object") {
          const {
            content = [],
            totalPages = 0,
            totalElements = 0,
            number = 0,
            size: responseSize = pagination.size,
            first = true,
            last = false,
          } = result;

          setData(content);
          setPagination((prev) => ({
            ...prev,
            page: number,
            size: responseSize,
            totalPages,
            totalElements,
            first,
            last,
          }));
        } else {
          // Si no es respuesta paginada, usar el resultado directamente
          setData(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        console.error("Error loading paginated data:", err);
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [apiMethod, pagination.page, pagination.size, initialParams.filters]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Cambiar a una página específica
   * @param {number} newPage - Número de página (0-indexed)
   */
  const changePage = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  /**
   * Cambiar el tamaño de página
   * @param {number} newSize - Nuevo tamaño de página
   */
  const changeSize = useCallback((newSize) => {
    setPagination((prev) => ({ ...prev, size: newSize, page: 0 }));
  }, []);

  /**
   * Ir a la primera página
   */
  const goToFirst = useCallback(() => {
    changePage(0);
  }, [changePage]);

  /**
   * Ir a la última página
   */
  const goToLast = useCallback(() => {
    changePage(pagination.totalPages - 1);
  }, [changePage, pagination.totalPages]);

  /**
   * Ir a la página siguiente
   */
  const goToNext = useCallback(() => {
    if (!pagination.last) {
      changePage(pagination.page + 1);
    }
  }, [changePage, pagination.last, pagination.page]);

  /**
   * Ir a la página anterior
   */
  const goToPrevious = useCallback(() => {
    if (!pagination.first) {
      changePage(pagination.page - 1);
    }
  }, [changePage, pagination.first, pagination.page]);

  /**
   * Recargar los datos actuales
   */
  const reload = useCallback(
    (filters = {}) => {
      loadData(filters);
    },
    [loadData]
  );

  return {
    // Datos
    data,
    loading,
    error,

    // Información de paginación
    pagination,

    // Métodos de navegación
    changePage,
    changeSize,
    goToFirst,
    goToLast,
    goToNext,
    goToPrevious,

    // Utilidades
    reload,
  };
};

