import fs from 'fs';
import path from 'path';
import { error } from '../logger';

const servicePath = path.join(__dirname, '..', '..', 'cmd');

interface Commands {
  [key: string]: Array<string>;
}

const commands: Commands = {
  monitoring: [],
};
const services: Array<string> = [];

function AddCommand(fileName: string, parentFolder?: string): void {
  const commandName: string = path.basename(fileName, path.extname(fileName));
  if (parentFolder) {
    if (!commands[parentFolder]) {
      commands[parentFolder] = [];
    }
    commands[parentFolder].push(commandName);
  }
}

/**
 * Recursively get all services and commands under start path
 */
(function GetServices(startPath: string, parentFolder?: string): void {
  fs.readdirSync(startPath).forEach(item => {
    // Validates to directory or file
    if (fs.lstatSync(path.join(startPath, item)).isDirectory()) {
      const serviceName: string = item;
      services.push(serviceName);
      GetServices(path.join(startPath, item), serviceName);
    } else if (fs.lstatSync(path.join(startPath, item)).isFile()) {
      AddCommand(item, parentFolder);
    }
  });
})(servicePath);

function ValidateService(serviceName: string): boolean {
  return services.includes(serviceName);
}

function ValidateCommand(serviceName: string, commandName: string): boolean {
  return commands[serviceName].includes(commandName);
}

function PrintErrorMessage(serviceName: string, commandName: string): void {
  const message = ValidateService(serviceName) ? 'Invalid command ' + commandName : 'Invalid service ' + serviceName;
  error('###########################');
  error(message);
  error('###########################', '\n');
}

export function IsValid(argv: any): boolean {
  const service: string = argv._[0];
  const command: string = argv.command ? argv.command : argv._[argv._.length - 1];
  let isValid = true;
  if (!ValidateService(service)) {
    PrintErrorMessage(service, command);
    isValid = false;
  } else if (!ValidateCommand(service, command)) {
    PrintErrorMessage(service, command);
    isValid = false;
  }
  return isValid;
}
