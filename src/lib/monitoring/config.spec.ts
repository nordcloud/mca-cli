import test from 'ava';

import * as config from './config';

test('generate config', t => {
  const args = {
    config: 'test',
    profile: 'test',
    service: ['lambda'],
    region: 'my-home-region',
    stage: 'dev',
    include: [],
    exclude: [],
    dry: true,
  };
  const conf = new config.ConfigGenerator(args);
  t.is(conf.getConfig().cli.version, 1);
  t.is(conf.getConfig().cli.profile, 'test');
});

test('generate config without profile or region', t => {
  const args = {
    config: 'test',
    service: ['lambda'],
    stage: 'dev',
    include: [],
    exclude: [],
    dry: true,
  };
  const conf = new config.ConfigGenerator(args);
  t.is(conf.getConfig().cli.version, 1);
  t.is(conf.getConfig().cli.profile, undefined);
});
