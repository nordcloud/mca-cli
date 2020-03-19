import test from 'ava';

import { Args } from '@monitoring/types';
import { ConfigGenerator } from '@monitoring/config';

const args: Args = {
  config: 'test',
  profile: 'test',
  service: ['lambda'],
  include: [],
  exclude: [],
  dry: true,
};

test('generate config', t => {
  console.log(ConfigGenerator);
  const config = new ConfigGenerator(args);
  t.is(config.getConfig().cli.version, 1);
});
