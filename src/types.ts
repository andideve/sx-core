import * as CSS from 'csstype';
import { FunctionInterpolation } from '@emotion/styled';

export type CSSProperties = CSS.Properties;

export enum CoreThemeKey {
  'screens' = 'screens',
}

export enum ThemeKey {
  'borders' = 'borders',
  'borderWidths' = 'borderWidths',
  'borderStyles' = 'borderStyles',
  'colors' = 'colors',
  'radii' = 'radii',
  'space' = 'space',
  'sizes' = 'sizes',
  'zIndices' = 'zIndices',
  'shadows' = 'shadows',
  'fonts' = 'fonts',
  'fontSizes' = 'fontSizes',
  'fontWeights' = 'fontWeights',
  'lineHeights' = 'lineHeights',
  'letterSpacings' = 'letterSpacings',
}

export interface Theme {
  [CoreThemeKey.screens]?: ThemeScale<Breakpoint>;
  [ThemeKey.borders]?: ThemeScale;
  [ThemeKey.borderWidths]?: ThemeScale;
  [ThemeKey.borderStyles]?: ThemeScale;
  [ThemeKey.colors]?: ThemeScale;
  [ThemeKey.radii]?: ThemeScale;
  [ThemeKey.space]?: ThemeScale;
  [ThemeKey.sizes]?: ThemeScale;
  [ThemeKey.zIndices]?: ThemeScale;
  [ThemeKey.shadows]?: ThemeScale;
  [ThemeKey.fonts]?: ThemeScale;
  [ThemeKey.fontSizes]?: ThemeScale;
  [ThemeKey.fontWeights]?: ThemeScale;
  [ThemeKey.lineHeights]?: ThemeScale;
  [ThemeKey.letterSpacings]?: ThemeScale;
  [key: string]: any;
}

export type ThemeScale<T = any> = MyObject<T>;

export type MyObject<T = any> = Record<string | number, T>;

export type Breakpoint = string | number;

export interface StyleFn {
  (value: string | number, scale?: ThemeScale): {
    [key in keyof CSSProperties]: string | number;
  };
  scale?: string;
}

export type ParserConfig<P = unknown> = { [key in keyof CSSProperties | keyof P]?: StyleFn };

export type ParserProps<P = unknown> = {
  theme?: Theme;
  [key: string]: any;
} & Partial<P>;

export interface Parser<P = unknown> extends FunctionInterpolation<ParserProps<P>> {
  config: ParserConfig<P>;
  propNames: string[];
}

export interface StyleConfig {
  property?: keyof CSSProperties;
  properties?: (keyof CSSProperties)[];
  scale?: string;
  transform?: (raw: string | number, scale?: ThemeScale) => string | number;
}

export type SystemConfig<P = unknown> = {
  [key in keyof CSSProperties | keyof P]?: true | keyof CSSProperties | StyleConfig;
};

export type ResponsiveObject<T = string> = MyObject<undefined | null | false | number | T>;

export type ResponsiveValue<T = string> = ResponsiveObject<T> | number | T;
