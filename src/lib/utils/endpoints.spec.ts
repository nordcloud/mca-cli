import test from 'ava';
import updatePagerDutyEndpoints from './endpoints';

test('Add endpoint to empty array', async t => {
  const endpoints: string[] = [];
  const args = {
    stage: 'dev',
    endpoints: ['https://events.pagerduty.com/integration/abcb/enqueue'],
  };
  await updatePagerDutyEndpoints(args.endpoints, args.stage, endpoints);
  t.is(endpoints.length, 1);
});

test('Override existing endpoints', async t => {
  const endpoints: string[] = ['https://events.pagerduty.com/integration/abcb/enqueue'];
  const args = {
    stage: 'dev',
    endpoints: [
      'https://events.pagerduty.com/integration/abcb/enqueue',
      'https://events.pagerduty.com/integration/bcdc/enqueue',
      'https://events.pagerduty.com/integration/efgh/enqueue',
    ],
  };
  await updatePagerDutyEndpoints(args.endpoints, args.stage, endpoints);
  t.is(endpoints.length, 3);
});
