import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import { prompt } from 'inquirer';

import { debug } from '../logger';

/**
 * Ask user for MFA token for given serial
 *
 * Result is send to callback function for SDK to authorize the request
 */
async function tokenCodeFn(serialArn: string, cb: (err?: Error, token?: string) => void): Promise<void> {
  debug('Require MFA token for serial ARN', serialArn);
  try {
    const { token } = await prompt({
      type: 'input',
      name: 'token',
      message: `MFA token for ${serialArn}: `,
      default: '',
    });
    debug('Successfully got MFA token from user');
    cb(undefined, token);
  } catch (err) {
    debug('Failed to get MFA token', err);
    cb(err);
  }
}

/**
 * Get home directory
 */
function homeDir(): string {
  return (
    process.env.HOME ||
    process.env.USERPROFILE ||
    (process.env.HOMEPATH ? (process.env.HOMEDRIVE || 'C:/') + process.env.HOMEPATH : null) ||
    os.homedir()
  );
}

/**
 * Get path to aws credentials file
 */
function credentialsFileName(): string {
  return process.env.AWS_SHARED_CREDENTIALS_FILE || path.join(homeDir(), '.aws', 'credentials');
}

/**
 * Get path to aws config file
 */
function configFileName(): string {
  return process.env.AWS_CONFIG_FILE || path.join(homeDir(), '.aws', 'config');
}

/**
 * Set AWS region
 */
export async function setAWSRegion(profile?: string, regionCustom?: string): Promise<void> {
  if (regionCustom) {
    debug('Setting region to custom:', regionCustom);
    AWS.config.update({ region: regionCustom });
    return;
  }

  profile = profile || process.env.AWS_PROFILE || process.env.AWS_DEFAULT_PROFILE || 'default';
  debug('Find region for profile:', profile);

  let region =
    process.env.AWS_REGION ||
    process.env.AMAZON_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    process.env.AMAZON_DEFAULT_REGION;

  // Try different region configs to find correct region
  // 1. From credentials file with given profile
  // 2. From config file with given profile
  // 3. From config file with default profile
  const toCheck = [
    { filename: credentialsFileName(), profile },
    { isConfig: true, filename: configFileName(), profile },
    { isConfig: true, filename: configFileName(), profile: 'default' },
  ];
  while (!region && toCheck.length > 0) {
    const options = toCheck.shift();
    if (options && fs.existsSync(options.filename)) {
      const contents: string = fs.readFileSync(options.filename).toString();
      /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
      const config = (AWS as any).util.ini.parse(contents);

      const profileIndex =
        /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
        profile !== (AWS as any).util.defaultProfile && options.isConfig ? 'profile ' + profile : profile;

      region = config[profileIndex || '']?.region;
    }
  }

  if (!region) {
    const usedProfile = !profile ? '' : ` (profile: "${profile}")`;
    region = 'us-east-1'; // This is what the AWS CLI does
    debug(
      `Unable to determine AWS region from environment or AWS configuration${usedProfile}, defaulting to '${region}'`,
    );
  }
  debug('Set region to:', region);

  AWS.config.update({ region });
}

/**
 * Wrapper function to get better types for environment credenatials
 */
function environmentCredentials(prefix: string): () => AWS.EnvironmentCredentials {
  return (): AWS.EnvironmentCredentials => new AWS.EnvironmentCredentials(prefix);
}

/**
 * Set credentials and region to AWS from config and env variables
 */
export async function setAWSCredentials(profile?: string, region?: string): Promise<void> {
  const sources: (() => AWS.Credentials)[] = [environmentCredentials('AWS'), environmentCredentials('AMAZON')];

  profile = profile || process.env.AWS_PROFILE || process.env.AWS_DEFAULT_PROFILE || 'default';

  sources.push(() => new AWS.SharedIniFileCredentials({ profile, tokenCodeFn }));

  const credentials = await new AWS.CredentialProviderChain(sources).resolvePromise();
  AWS.config.update({ credentials });

  // If region is defined, then set that up as well
  await setAWSRegion(profile, region);
}

/**
 * Throws error if credentials are missing
 */
export function validateCredentials(): void {
  if (!AWS.config.credentials) {
    throw new Error('AWS credentials not set');
  }
}
