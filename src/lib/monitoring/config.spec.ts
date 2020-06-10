import test from 'ava';

import * as config from './config';

test('generate config', t => {
  const args = {
    config: 'test',
    profile: 'test',
    service: ['lambda'],
    region: 'my-home-region',
    stage: 'dev',
    endpoints: ['my-test-param-dev', 'ssm:abc-test-param'],
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
    endpoints: ['my-test-param-dev', 'ssm:abc-test-param'],
    include: [],
    exclude: [],
    dry: true,
  };
  const conf = new config.ConfigGenerator(args);
  t.is(conf.getConfig().cli.version, 1);
  t.is(conf.getConfig().cli.profile, undefined);
});

test('add endpoint', t => {
  const args = {
    config: 'test',
    service: ['lambda'],
    stage: 'dev',
    endpoints: ['https://events.pagerduty.com/integration/abcb/enqueue'],
    include: [],
    exclude: [],
    dry: true,
  };
  const conf = new config.ConfigGenerator(args);
  conf.setPagerDutyEndpoint(args);
  t.is(conf.getConfig().custom.snsTopic.endpoints.length, 1);
});
