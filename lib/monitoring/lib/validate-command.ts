import fs from 'fs';
import path from 'path';
const servicePath = path.join(__dirname, '..', '..');

interface Commands {
  [key: string]: Array<string>;
}

const commands: Commands = {
  monitoring: ['init', 'update'],
};
const services: Array<string> = [];

console.log(servicePath);
// Get only .ts ending files (services)
fs.readdirSync(servicePath).forEach(file => {
  if (path.extname(file) === '.ts') {
    const serviceName: string = path.basename(file, path.extname(file));
    services.push(serviceName);
    commands[serviceName] = [];

    // Get commands under services
    fs.readdirSync(path.join(servicePath, serviceName)).forEach(file => {
      if (path.extname(file) === '.ts') {
        const filename: string = path.basename(file, path.extname(file));
        commands[serviceName].push(filename);
      }
    });
  }
});

function ValidateService(serviceName: string): boolean {
  return services.includes(serviceName);
}

function ValidateCommand(serviceName: string, commandName: string): boolean {
  return commands[serviceName].includes(commandName);
}

function PrintErrorMessage(serviceName: string, commandName: string): void {
  const message = ValidateService(serviceName) ? 'Invalid command ' + commandName : 'Invalid service ' + serviceName;
  console.log('\x1b[31m');
  console.log('###########################');
  console.log(message);
  console.log('###########################', '\n');
  console.log('\x1b[0m');
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
