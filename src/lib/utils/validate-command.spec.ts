import test from 'ava';
import IsValid, { ArgV } from './validate-command';

const args1: ArgV = {
  _: ['monitoring'],
  command: 'init',
};

const args2: ArgV = {
  _: ['monitoring', 'init'],
};

const args3: ArgV = {
  _: ['monitorin'],
  command: 'init',
};

const args4: ArgV = {
  _: ['monitoring', 'initi'],
};

test('Allow valid commands', t => {
  t.is(IsValid(args1), true);
  t.is(IsValid(args2), true);
});

test('Deny invalid commands', t => {
  t.is(IsValid(args3), false);
  t.is(IsValid(args4), false);
});
