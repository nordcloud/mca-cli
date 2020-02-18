import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as hb from 'handlebars';

import {
  TableItem,
  FunctionItem,
  Args,
} from './types';

export const generatePath = (profile: string) => {
  return path.join(process.cwd(), `${profile}-monitoring`)
}

const generateFromTemplateFile = async (profile: string, templatePath: string, options?: object): Promise<void> => {
  const fullPath = path.join(__dirname, 'files', templatePath) + '.hb';
  const content = await fs.promises.readFile(fullPath);
  const filePath = path.join(generatePath(profile), templatePath);
  const template = hb.compile(content.toString());
  await fs.promises.writeFile(filePath, template(options));
}

export const generateConfig = async (functions: FunctionItem[], tables: TableItem[], args: Args) => {
  const obj = {
    cli: {
      version: 1,
      profile: args.profile,
      services: args.service,
      includes: args.include,
      excludes: args.exclude,
    },
    lambdas: functions.map(f => ({ name: f.FunctionName, arn: f.FunctionArn })),
    tables: tables.map(t => ({ name: t.TableName, arn: t.TableArn })),
    custom: {
      default: {
        lambda: {
          errors: {
            threshold: 100,
            evaluationPeriods: 2,
          }
        }
      },
      snsTopics: {
        alarm: {
          name: "Alarm switched to error state",
          id: `${args.profile}-alarm-error`,
          endpoints: [
            "https://events.pagerduty.com/integration/<INTEGRATION ID>/enqueue",
          ],
        },
        ok: {
          name: "Alarm switched to ok state",
          id: `${args.profile}-alarm-ok`,
          endpoints: [
            "https://events.pagerduty.com/integration/<INTEGRATION ID>/enqueue",
          ],
        },
      }
    }
  }

  const filePath = path.join(generatePath(args.profile), 'config.yml');
  return fs.promises.writeFile(filePath, yaml.dump(obj));
}

export const generateMonitoring = async (functions: FunctionItem[], tables: TableItem[], args: Args): Promise<void> => {
  await fs.promises.mkdir(generatePath(args.profile), { recursive: true });

  await Promise.all([
    generateFromTemplateFile(args.profile, 'cdk.context.json'),
    generateFromTemplateFile(args.profile, 'cdk.json'),
    generateFromTemplateFile(args.profile, 'index.ts'),
    generateFromTemplateFile(args.profile, 'package.json', { profile: args.profile }),
    generateFromTemplateFile(args.profile, 'package-lock.json'),
    generateFromTemplateFile(args.profile, 'tsconfig.json'),
    generateFromTemplateFile(args.profile, 'README.md', { profile: args.profile }),
    generateConfig(functions, tables, args),
  ])

  logGenerateSuccess(functions, tables, args);
}

export const logGenerateSuccess = (functions: FunctionItem[], tables: TableItem[], args: Args) => {
  console.log('');
  console.log('Monitoring generated successfully to', generatePath(args.profile));
  console.log('Lambdas:', functions.length);
  functions.forEach(f => {
    console.log('  -', f.FunctionName);
  })
  console.log('Tables:', tables.length);
  tables.forEach(t => {
    console.log('  -', t.TableName);
  })
  console.log('');
}
