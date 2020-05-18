import test from 'ava';

import * as config from './config';

test('generate config', t => {
  const args = {
    config: 'test',
    profile: 'test',
    service: ['lambda'],
    stage: 'dev',
    include: [],
    exclude: [],
    dry: true,
  };
  const conf = new config.ConfigGenerator(args);
  t.is(conf.getConfig().cli.version, 1);
});
