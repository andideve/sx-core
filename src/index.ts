import memoize from '@emotion/memoize';
import isPropValid from '@emotion/is-prop-valid';

import {
  CSSProperties,
  Theme,
  ThemeScale,
  MyObject,
  Breakpoint,
  StyleFn,
  ParserConfig,
  Parser,
  CoreThemeKey,
  StyleConfig,
  SystemConfig,
} from './types';

// Utilities

export function createSfp(propNames: string[] = []) {
  const regex = new RegExp(`^(${propNames.join('|')})$`);
  return memoize(propName => isPropValid(propName) && !regex.test(propName));
}

export function isObject(arg: unknown): arg is MyObject {
  if (typeof arg === 'object' && !Array.isArray(arg)) return true;
  return false;
}

export function merge(a: MyObject, b: MyObject) {
  const result = { ...a };
  for (const key in b) {
    if (!isObject(a[key])) {
      result[key] = b[key];
      continue;
    }
    if (isObject(b[key])) result[key] = merge(a[key], b[key]);
  }

  return result;
}

export function createMediaQuery(_w: Breakpoint) {
  const w = typeof _w === 'number' ? `${_w}px` : _w;
  return `@media screen and (min-width: ${w})`;
}

/** @param path a string separated with `.` */
export function get(path?: string | number, object: MyObject = {}, fallback?: unknown) {
  if (path === undefined) return fallback;
  let result = { ...object };
  for (const key of typeof path === 'string' ? path.split('.') : [path]) {
    if (!isObject(result)) break;
    result = result[key];
  }

  return result === undefined ? fallback : result;
}

export function parseResponsiveObject(
  sx: StyleFn,
  raw: MyObject,
  { screens = {}, scale = {} }: { screens?: Theme['screens']; scale?: ThemeScale } = {},
) {
  const result: any = {};
  for (const key in raw) {
    if (raw[key] === undefined || raw[key] === null || raw[key] === false) continue;
    if (key === '_') {
      Object.assign(result, sx(raw[key], scale));
      continue;
    }
    const screen = screens[key];
    if (!screen) {
      console.error('Invalid object key:', key);
      continue;
    }
    result[createMediaQuery(screen)] = sx(raw[key], scale);
  }

  return result;
}

// Builder

export function createParser<P = unknown>(config: ParserConfig<P>) {
  const parser: Parser<P> = props => {
    const { theme = {} } = props;
    let result = {};
    for (const key in props) {
      if (!(key in config)) continue;

      const sx = config?.[key as keyof typeof config] as StyleFn;
      const raw = props[key];
      const scale = get(sx.scale, theme, {}) as ThemeScale;

      const rawType = typeof raw;
      if (rawType === 'string' || rawType === 'number') {
        result = merge(result, sx(raw, scale));
        continue;
      }
      if (isObject(raw)) {
        result = merge(
          result,
          parseResponsiveObject(sx, raw, { screens: theme[CoreThemeKey.screens], scale }),
        );
        continue;
      }

      console.error('Invalid value type:', raw);
    }

    return result;
  };

  parser.config = config;
  parser.propNames = Object.keys(config);

  return parser;
}

export function createStyleFn({
  property,
  properties,
  scale,
  transform = (raw, scale = {}) => get(raw, scale, raw) as string | number,
}: StyleConfig) {
  const sx: StyleFn = (value, themeScale = {}) => {
    const result: any = {};
    for (const key of properties || [property]) {
      if (key !== undefined) result[key] = transform(value, themeScale);
    }
    return result;
  };

  sx.scale = scale;

  return sx;
}

// APIs

export function system<P = unknown>(config: SystemConfig<P>) {
  const parserConfig: ParserConfig<P> = {};
  for (const _key in config) {
    const key = _key as keyof typeof config;
    const conf = config[key];
    if (conf === true) {
      parserConfig[key] = createStyleFn({
        property: key as keyof CSSProperties,
        scale: key as string,
      });
      continue;
    }
    if (typeof conf === 'string') {
      parserConfig[key] = createStyleFn({
        property: conf as keyof CSSProperties,
        scale: conf as string,
      });
      continue;
    }
    parserConfig[key] = createStyleFn(conf as StyleConfig);
  }

  return createParser<P>(parserConfig);
}

/** @param args Recommended arg type: `Parser` */
export function compose<P = unknown>(...args: (Parser | SystemConfig)[]) {
  const config: ParserConfig<P> = {};
  for (const arg of args) {
    if (typeof arg === 'function') {
      Object.assign(config, (arg as Parser).config);
      continue;
    }
    Object.assign(config, system(arg).config);
  }

  return createParser<P>(config);
}

export {
  CSSProperties,
  CoreThemeKey,
  ThemeKey,
  Theme,
  MyObject,
  ParserConfig,
  StyleConfig,
  SystemConfig,
  ResponsiveValue,
} from './types';
