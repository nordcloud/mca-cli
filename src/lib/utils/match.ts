import { isMatch } from 'picomatch';

// This fix is needed for picomatch library
// Otherwise there will be error when matching log groups for example
function fixMatchString(str: string): string {
  return str.replace(/\//g, '-');
}

function matchIncluded(str: string, included: string[]): boolean {
  return included.length === 0 || isMatch(str, included);
}

function matchExcluded(str: string, excluded: string[]): boolean {
  return excluded.length === 0 || !isMatch(str, excluded);
}

export default function match(str: string, include: string[], exclude: string[]): boolean {
  const matchStr = fixMatchString(str);
  const included = include.map(str => fixMatchString(str));
  const excluded = exclude.map(str => fixMatchString(str));

  return matchIncluded(matchStr, included) && matchExcluded(matchStr, excluded);
}
