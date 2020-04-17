import test from 'ava';

import { ValidatePrefix } from './update';

test('Validate log groups by prefix', t => {
  const args = {
    prefix: '/aws/lambda/',
    logGroupName: '/aws/lambda/',
  };

  const args2 = {
    prefix: '/aws/lambda/a',
    logGroupName: '/aws/lambda/b',
  };

  t.is(ValidatePrefix(args.logGroupName, args.prefix), true);
  t.is(ValidatePrefix(args2.logGroupName, args2.prefix), false);
});
