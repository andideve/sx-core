import {
  isObject,
  merge,
  createMediaQuery,
  get,
  createParser,
  createStyleFn,
  parseResponsiveObject,
  system,
  createSfp,
  compose,
} from '../src';
import {
  ParserConfig,
  CSSProperties,
  StyleFn,
  SystemConfig,
  ResponsiveValue,
  CoreThemeKey,
} from '../src/types';

describe('createSfp', () => {
  const propNames = ['m', 'mt', 'mb', 'mx', 'my'];
  const sfp = createSfp(propNames);

  it('return function', () => {
    expect(typeof sfp).toBe('function');
  });

  it('valid props', () => {
    expect(sfp('href')).toBe(true);
  });

  it('invalid props', () => {
    expect(propNames.every(e => sfp(e))).toBe(false);
  });
});

describe('isObject', () => {
  it('valid', () => {
    expect(isObject({})).toBe(true);
  });
  it('invalid', () => {
    expect(isObject([])).toBe(false);
  });
});

describe('merge', () => {
  it('copy objects', () => {
    const a = { firstName: 'andi' };
    const b = { lastName: 'deve' };

    merge(a, b);

    expect('firstName' in b).toBe(false);
    expect('lastName' in a).toBe(false);
  });

  it('merge deep object', () => {
    const a = {
      name: { first: 'andi' },
      usernames: {
        github: 'andideve',
        linkedin: {
          first: 'andideve',
        },
      },
    };
    const b = {
      name: { last: 'deve' },
      usernames: {
        linkedin: {
          first: 'andideve',
          second: '4nkym',
        },
      },
      hobies: ['coding'],
    };

    const expected = {
      name: { first: 'andi', last: 'deve' },
      usernames: {
        github: 'andideve',
        linkedin: {
          first: 'andideve',
          second: '4nkym',
        },
      },
      hobies: ['coding'],
    };

    expect(merge(a, b)).toEqual(expected);
  });
});

describe('createMediaQuery', () => {
  const media = (w: string) => `@media screen and (min-width: ${w})`;

  it('return valid media query', () => {
    expect(createMediaQuery('576px')).toBe(media('576px'));
  });

  it('convert number arg. to px', () => {
    expect(createMediaQuery(576)).toBe(media('576px'));
  });
});

describe('get', () => {
  const object = {
    space: {
      1.5: '.375rem',
    },
    colors: {
      gray: { 200: '#hex' },
    },
  };

  it('return specified object property value', () => {
    expect(get('colors.gray.200', object)).toEqual(object.colors.gray[200]);
    expect(get(1.5, object.space)).toBe(object.space['1.5']);
    expect(get(0, { 0: '1rem' })).toBe('1rem');
  });

  it('return fallback on path=undefined', () => {
    const fallback = {};
    expect(get(undefined, object, fallback)).toEqual(fallback);
  });

  it('return fallback on result=undefined', () => {
    const fallback = 'value';
    expect(get('colors.gray.key', object, fallback)).toEqual(fallback);
  });

  it("don't return fallback on result=null", () => {
    const fallback = 'value';
    expect(get('space.4', { space: { 4: null } }, fallback)).toBe(null);
  });
});

describe('createParser', () => {
  it('return parser function', () => {
    const parser = createParser({});

    expect(typeof parser).toBe('function');
    expect(parser({})).toEqual({});
  });
});

describe('parser', () => {
  it('pass value (raw, except: responsive value) as styleFn arg.', () => {
    interface Props {
      m?: ResponsiveValue<CSSProperties['margin']>;
      p?: ResponsiveValue<CSSProperties['padding']>;
      color?: ResponsiveValue<CSSProperties['color']>;
    }

    const parser = createParser<Props>({
      m: value => {
        expect(value).toEqual(1.5);
        return {};
      },
      p: value => {
        expect(isObject(value)).toBe(false);
        return {};
      },
      color: value => {
        expect(value).toEqual('gray.200');
        return {};
      },
    });

    parser({ m: 1.5, p: { _: '3rem', lg: '5rem' }, color: 'gray.200' });
  });

  it('pass theme scale as styleFn arg.', () => {
    const sFs = {
      marginY: ((value, scale = {}) => ({
        marginTop: scale[value],
        marginBottom: scale[value],
      })) as StyleFn,
    };
    sFs.marginY.scale = 'space';

    interface Props {
      my?: ResponsiveValue<CSSProperties['margin']>;
    }

    const config: ParserConfig<Props> = {
      my: sFs.marginY,
    };

    const parser = createParser<Props>(config);

    const theme = {
      space: { 1.5: '.375rem', 4: '1rem' },
    };

    expect(parser({ theme, my: 1.5 })).toEqual({
      marginTop: theme.space['1.5'],
      marginBottom: theme.space['1.5'],
    });
  });

  it('support responsive value', () => {
    const sFs = {
      margin: (value => ({ margin: value })) as StyleFn,
    };

    interface Props {
      m?: ResponsiveValue<CSSProperties['margin']>;
    }

    const config: ParserConfig<Props> = {
      m: sFs.margin,
    };

    const parser = createParser<Props>(config);

    const theme = {
      [CoreThemeKey.screens]: { sm: 576, md: 768, lg: 1024 },
    };

    expect(parser({ theme, m: { _: '1rem', md: '1.5rem', lg: '2rem' } })).toEqual({
      margin: '1rem',
      [createMediaQuery(theme[CoreThemeKey.screens].md)]: { margin: '1.5rem' },
      [createMediaQuery(theme[CoreThemeKey.screens].lg)]: { margin: '2rem' },
    });
  });
});

describe('createStyleFn', () => {
  it('return styleFn', () => {
    const styleFn = createStyleFn({ property: 'margin' });

    expect(typeof styleFn).toBe('function');
    expect(styleFn('1rem')).toEqual({ margin: '1rem' });
  });

  it('support many prop names', () => {
    const styleFn = createStyleFn({
      properties: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
    });
    expect(styleFn('1rem')).toEqual({
      marginTop: '1rem',
      marginRight: '1rem',
      marginBottom: '1rem',
      marginLeft: '1rem',
    });
  });

  it('return specified theme scale', () => {
    const styleFn = createStyleFn({ property: 'margin' });
    const scale = { 1.5: '.375rem' };

    expect(styleFn(1.5, scale)).toEqual({ margin: scale['1.5'] });
  });

  it('return value as fallback on scale=undefined', () => {
    const styleFn = createStyleFn({ property: 'margin' });
    expect(styleFn(1.5, {})).toEqual({ margin: 1.5 });
  });

  it("don't return fallback on scale=null", () => {
    const styleFn = createStyleFn({ property: 'margin' });
    expect(styleFn(1.5, { 1.5: null })).toEqual({ margin: null });
  });

  it('return transformed value', () => {
    const styleFn = createStyleFn({
      property: 'margin',
      transform: raw => (typeof raw === 'number' ? `${raw}px` : raw),
    });
    expect(styleFn(1.5, {})).toEqual({ margin: '1.5px' });
  });
});

describe('parseResponsiveObject', () => {
  const screens = { sm: 576, md: 768, lg: 1024 };

  it('return responsive css object', () => {
    const css = parseResponsiveObject(
      createStyleFn({ property: 'margin' }),
      { sm: '1rem' },
      { screens },
    );
    expect(css).toEqual({
      [createMediaQuery(screens.sm)]: { margin: '1rem' },
    });
  });

  it('invalid object key', () => {
    const css = parseResponsiveObject(
      createStyleFn({ property: 'margin' }),
      { string: '1rem' },
      { screens },
    );
    expect(css).toEqual({});
  });

  it('use `_` to assigning mobile-first style', () => {
    const css = parseResponsiveObject(
      createStyleFn({ property: 'margin' }),
      { _: '1rem' },
      { screens },
    );
    expect(css).toEqual({ margin: '1rem' });
  });

  it('return parsed result of all responsive value properties', () => {
    const css = parseResponsiveObject(
      createStyleFn({ property: 'margin' }),
      {
        _: '1rem',
        md: '1.5rem',
        lg: '2rem',
      },
      { screens },
    );
    expect(css).toEqual({
      margin: '1rem',
      [createMediaQuery(screens.md)]: { margin: '1.5rem' },
      [createMediaQuery(screens.lg)]: { margin: '2rem' },
    });
  });

  it("don't parse prop value when: undefined, null, false", () => {
    const css = parseResponsiveObject(
      createStyleFn({ property: 'margin' }),
      {
        _: false,
        sm: '1rem',
        md: undefined,
        lg: null,
      },
      { screens },
    );
    expect(css).toEqual({
      [createMediaQuery(screens.sm)]: { margin: '1rem' },
    });
  });
});

describe('system', () => {
  it('return parser function', () => {
    interface Props {
      m?: ResponsiveValue<CSSProperties['margin']>;
    }

    const config: SystemConfig<Props> = {
      m: { property: 'margin' },
    };

    const parser = system<Props>(config);

    expect(typeof parser).toBe('function');
    expect(parser({ m: '1rem' })).toEqual({ margin: '1rem' });
  });

  it('support shorthand def. config', () => {
    interface Props {
      margin?: ResponsiveValue<CSSProperties['margin']>;
      p?: ResponsiveValue<CSSProperties['padding']>;
    }

    const config: SystemConfig<Props> = {
      margin: true,
      p: 'padding',
    };

    const parser = system<Props>(config);

    const theme = {
      margin: { 1.5: '.375rem' },
      padding: { 4: '1rem' },
    };

    expect(parser({ theme, margin: 1.5, p: 4 })).toEqual({
      margin: theme.margin[1.5],
      padding: theme.padding[4],
    });
  });
});

describe('compose', () => {
  it('return parser function', () => {
    const parser = compose(system({ margin: true, padding: true }), {
      color: true,
      backgroundColor: true,
    });

    expect(typeof parser).toBe('function');
    expect(parser({ margin: '1rem', padding: '1.25rem', color: 'red' })).toEqual({
      margin: '1rem',
      padding: '1.25rem',
      color: 'red',
    });
  });
});
