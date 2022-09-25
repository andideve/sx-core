# sx-core

## Install

```sh
$ npm i @andideve/sx-core
```

you might need peer deps, to install them run:

```sh
$ npm i @emotion/react @emotion/styled
```

## Usage

```jsx
import styled from '@emotion/styled';
import { system } from '@andideve/sx-core';

// Define system config
const config = {
  m: { property: 'margin', scale: 'margin' },
  // ...
};

// Create function interpolation
const margin = system(config);

// Finally you can add function interpolation like this:
const Box = styled.div(margin);
```

### Removing props from HTML elements

```jsx
import styled from '@emotion/styled';
import { createSfp } from '@andideve/sx-core';

const shouldForwardProp = createSfp(margin.propNames);

const Box = styled('div', { shouldForwardProp })(margin);
```

### Path value

```jsx
<Box m={1.5} />
// margin: theme.margin[1.5]
// margin: 1.5px

<Box color="gray.200" />
// color: theme[scale].gray[200]
// color: gray.200
```

### Responsive value

```jsx
<Box m={{ _: '1rem', lg: '1.5rem' }} />
```

## Theming

```js
import { CoreThemeKey } from '@andideve/sx-core';

const theme = {
  [CoreThemeKey.screens]: { sm: 576, md: 768, lg: 1024 },
  margin: {},
  // ...
};
```
