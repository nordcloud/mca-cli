import test from 'ava';
import setPagerDutyEndpoint from './endpoints';

test('Add endpoint to empty array', async t => {
  const endpoints: string[] = [];
  const args = {
    stage: 'dev',
    endpoints: ['https://events.pagerduty.com/integration/abcb/enqueue'],
  };
  await setPagerDutyEndpoint(args.endpoints, args.stage, endpoints);
  t.is(endpoints.length, 1);
});

test('Add endpoints without duplicates', async t => {
  const endpoints: string[] = [
    'https://events.pagerduty.com/integration/abcb/enqueue',
    'https://events.pagerduty.com/integration/fghj/enqueue',
  ];
  const args = {
    stage: 'dev',
    endpoints: [
      'https://events.pagerduty.com/integration/bcdc/enqueue',
      'https://events.pagerduty.com/integration/efgh/enqueue',
      'https://events.pagerduty.com/integration/abcb/enqueue',
    ],
  };
  t.log(endpoints);
  await setPagerDutyEndpoint(args.endpoints, args.stage, endpoints);
  t.log(endpoints);
  t.is(endpoints.length, 4);
});
