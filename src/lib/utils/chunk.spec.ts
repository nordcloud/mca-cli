import test from 'ava';
import chunk from './chunk';

test('Correctly chunk list', t => {
  const arr = [0, 1, 2, 3, 4];
  const res = chunk(arr, 2);
  t.deepEqual(res, [[0, 1], [2, 3], [4]]);
});
