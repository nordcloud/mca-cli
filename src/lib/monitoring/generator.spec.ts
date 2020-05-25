import test from 'ava';
import * as generator from './generator';

test('generatePath returns path as string', t => {
  t.true(typeof generator.generatePath('test', 'dev') === 'string');
});

test('generatePath returns path as string without profile', t => {
  t.true(typeof generator.generatePath('test') === 'string');
});
