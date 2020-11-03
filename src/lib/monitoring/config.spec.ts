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
    verbose: false,
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
    verbose: false,
  };
  const conf = new config.ConfigGenerator(args);
  t.is(conf.getConfig().cli.version, 1);
  t.is(conf.getConfig().cli.profile, '');
});

test('add endpoint', async t => {
  const args = {
    config: 'test',
    service: ['lambda'],
    stage: 'dev',
    endpoints: ['https://events.pagerduty.com/integration/abcb/enqueue'],
    include: [],
    exclude: [],
    dry: true,
    verbose: false,
  };
  const conf = new config.ConfigGenerator(args);
  await conf.setPagerDutyEndpoint(args);
  t.is(conf.getConfig().custom.snsTopic?.critical?.endpoints?.length, 1);
});

test('Combine earlier endpoints', async t => {
  const args = {
    config: 'test',
    service: ['lambda'],
    stage: 'dev',
    endpoints: ['https://events.pagerduty.com/integration/abcb/enqueue'],
    include: [],
    exclude: [],
    dry: true,
    verbose: false,
  };
  const conf = new config.ConfigGenerator(args);
  await conf.setPagerDutyEndpoint(args);

  // Add second endpoint
  args.endpoints = ['https://events.pagerduty.com/integration/abcb/enqueue2'];
  await conf.setPagerDutyEndpoint(args);

  t.is(conf.getConfig().custom.snsTopic?.critical?.endpoints?.length, 2);
});

test('Combine earlier endpoints should filter out same endpoints', async t => {
  const args = {
    config: 'test',
    service: ['lambda'],
    stage: 'dev',
    endpoints: ['https://events.pagerduty.com/integration/abcb/enqueue'],
    include: [],
    exclude: [],
    dry: true,
    verbose: false,
  };
  const conf = new config.ConfigGenerator(args);
  await conf.setPagerDutyEndpoint(args);

  // Add same endpoints again
  await conf.setPagerDutyEndpoint(args);

  t.is(conf.getConfig().custom.snsTopic?.critical?.endpoints?.length, 1);
});
