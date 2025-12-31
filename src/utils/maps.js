export const mapDifference = (mapA, mapB) => {
  const result = new Map();

  for (const [key, value] of mapA) {
    if (!mapB.has(key)) {
      result.set(key, value);
    }
  }

  return result;
};
