import test from 'ava';

import * as generator from '@monitoring/generator';

test('generatePath returns path as string', t => {
  t.true(typeof generator.generatePath('test') === 'string');
});
