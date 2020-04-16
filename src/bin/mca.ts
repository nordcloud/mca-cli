#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import yargs from 'yargs';

interface PkgJson {
  version: string;
}

// Setup version from package.json
const pkgPath: string = path.join(__dirname, '..', '..', 'package.json');
const pkg: PkgJson = JSON.parse(fs.readFileSync(pkgPath).toString());

yargs
  .version(pkg.version)
  .commandDir(path.join(__dirname, '..', 'cmd'))
  .demandCommand()
  .help().argv;
