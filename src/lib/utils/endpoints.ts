import { warning, error } from '../logger';

import { getSSMParameter } from '../aws-sdk';

export default async function updatePagerDutyEndpoints(
  newEndpoints: string[],
  stage: string,
  endpoints: string[],
): Promise<void> {
  if (newEndpoints.length < 1) {
    warning('No endpoints given!!');
  }

  for (const [index, endpoint] of newEndpoints.entries()) {
    if (endpoint.toLocaleLowerCase().startsWith('ssm:')) {
      // Removes the ssm: at the beginning of string and retrieve SSM param value
      const ssmParam = `${endpoint.slice(4)}-${stage}`;
      try {
        const paramValue = await getSSMParameter(ssmParam, true);
        if (!paramValue) {
          error('No SSM parameter', ssmParam, 'available!');
        } else if (endpoints[index] !== paramValue) {
          endpoints[index] = paramValue;
        }
      } catch (err) {
        error('No SSM parameter', ssmParam, 'available!', err);
      }
    } else if (endpoints[index] !== endpoint) {
      // Update existing endpoints
      endpoints[index] = endpoint;
    } else if (index >= endpoints.length) {
      // Add new endpoints
      endpoints.push(endpoint);
    }
  }
}
