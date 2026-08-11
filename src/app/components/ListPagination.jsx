import { Flex, Pagination, Skeleton } from '@mantine/core';

import ResultsCounter from '@components/ResultsCounter';

const ListPagination = ({
  page,
  onChange,
  total,
  pageLimit,
  isLoading = false,
  onRefresh,
}) => {
  const showPagination = total > pageLimit;

  return (
    <Flex align="center">
      {isLoading ? (
        <Skeleton height={36} width={96} />
      ) : (
        <Pagination
          value={page}
          onChange={onChange}
          total={Math.ceil(total / pageLimit) || 1}
          disabled={!showPagination}
        />
      )}

      <Flex ml="auto">
        <ResultsCounter
          amount={total}
          limit={pageLimit}
          currentPage={page}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </Flex>
    </Flex>
  );
};

export default ListPagination;
