import { useMemo, memo } from 'react'

import { Text, Skeleton, Group, Button } from '@mantine/core';

import { isNumber } from 'es-toolkit/compat';
import { IconRefresh } from '@tabler/icons-react';

const TEXT_PROPS = {
  c: "gray",
  size: "sm",
  miw: 'max-content',
}

const ResultsCounter = memo(({
  amount,
  onRefresh,
  limit = 10,
  currentPage = 1,
  isLoading = false,
}) => {
  const isEmptyResult = useMemo(() => (
    [amount === 0, !isNumber(amount)].some(value => value)
  ), [amount]);

  const { amountLimit, offset } = useMemo(() => ({
    amountLimit: currentPage * limit,
    offset: (currentPage - 1) * limit,
  }), [limit, currentPage]);

  const showLessResults = useMemo(() => amount > amountLimit, [amount, amountLimit]);

  if (isLoading) {
    return <Skeleton height={36} width={150} />
  }

  if (isEmptyResult) {
    return (
      <Text {...TEXT_PROPS}>
        Sin resultados
      </Text>
    )
  }

  return (
    <Group wrap="nowrap">
      <Text {...TEXT_PROPS}>
        Mostrando {offset + 1} - {showLessResults ? amountLimit : amount} de {amount.toLocaleString('es-AR')} resultados
      </Text>

      {onRefresh && (
        <Button
          size="xs"
          variant="subtle"
          onClick={onRefresh}
          leftSection={<IconRefresh height="20" />}
        >
          Actualizar
        </Button>
      )}
    </Group>
  )
})

export default ResultsCounter;
