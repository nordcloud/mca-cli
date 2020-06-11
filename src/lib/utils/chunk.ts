export default function chunk<T>(arr: T[], perChunk: number): T[][] {
  return arr.reduce((resultArray: T[][], item: T, index: number) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
}
