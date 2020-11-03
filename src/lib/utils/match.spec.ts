import test from 'ava';

import match from './match';

test('Validate match', t => {
  const str = 'lambda-dev';
  const inc: string[] = [];
  const excl = ['*dev*'];
  t.deepEqual(match(str, inc, excl), false);
});

test('Validate match log', t => {
  const str = '/aws/lambda/lambda-dev';
  const inc: string[] = [];
  const excl = ['*dev*'];
  t.deepEqual(match(str, inc, excl), false);
});

test('Validate log group match with /', t => {
  const str = '/aws/lambda/lambda-dev';
  const inc: string[] = [];
  const excl = ['/aws/*/lambda-dev'];
  t.deepEqual(match(str, inc, excl), false);
});
