import { isMatch } from 'micromatch';

function fixMatchString(str: string): string {
  return str.replace(/\//g, '-');
}

export default function match(str: string, include: string[], exclude: string[]): boolean {
  const matchStr = fixMatchString(str)
  const included = (include || []).map((str) => fixMatchString(str))
  const excluded = (exclude || []).map((str) => fixMatchString(str))
  return (included.length === 0 || isMatch(matchStr, included)) && (excluded.length === 0 || !isMatch(matchStr, excluded));
}
