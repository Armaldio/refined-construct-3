import Fuse from 'fuse.js';
// eslint-disable-next-line import/no-unresolved
import { ConditionalKeys } from 'type-fest';

export const PREFIX = 'RFC_';

export type KeysOfAsType <T> = keyof Pick<T, ConditionalKeys<T, string>>
export type OnlyStrings <T> = ConditionalKeys<T, string>
// @ts-ignore
export type NewKeys <T> = `${OnlyStrings<T>}_highlight`
export type HighlightedObject <T> = T & { [K in NewKeys<T>]: string}

export function highlightElement <T>(fuseElement: Fuse.FuseResult<T>): HighlightedObject<T> {
  const item = fuseElement.item as HighlightedObject<T>;

  fuseElement.matches?.forEach((matchItem) => {
    const key = matchItem.key as KeysOfAsType<T>;

    // TODO support array
    if (!key || key === 'path') {
      return;
    }
    const text = item[key] as unknown as string;
    const result = [];
    const matches = [...matchItem.indices];
    let pair = matches.shift();

    if (text === undefined) {
      return;
    }

    for (let i = 0; i < text.length; i += 1) {
      const char = text.charAt(i);
      if (pair && i === pair[0]) {
        result.push('<span class="highlight-bg">');
      }
      result.push(char);
      if (pair && i === pair[1]) {
        result.push('</span>');
        pair = matches.shift();
      }
    }

    // @ts-ignore
    item[`${key}_highlight`] = result.join('');
  });

  return item;
}
