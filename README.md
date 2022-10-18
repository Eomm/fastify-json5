# fastify-json5

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![ci](https://github.com/Eomm/fastify-json5/actions/workflows/ci.yml/badge.svg)](https://github.com/Eomm/fastify-json5/actions/workflows/ci.yml)

This plugin enable your server to process JSON5 payloads.  
It adds a new `application/json5` content type parser to Fastify and
decorate the `reply` object with a `sendJSON5()` utility.


## Install

```
npm install fastify-json5
```

### Compatibility

| Plugin version | Fastify version |
| ------------- |:---------------:|
| `^1.0.0` | `^1.0.0` |


## Usage


```js
const fastify = require('fastify')
const fastifyJson5 = require('fastify-json5')

const app = fastify()
app.register(fastifyJson5, { 
  reviver: (key, value) => value // optionally pass a reviver function
})

app.post('/', (req, reply) => {
  console.log(req.body)
  reply.sendJSON5(req.body, {
    replacer, // optionally
    space,    // optionally
    quote     // optionally
  })
})

app.inject({
  method: 'POST',
  url: '/',
  headers: { 'content-type': 'application/json5' },
  payload: `{
    // comments
    unquoted: 'and you can quote me on that',
    singleQuotes: 'I can use "double quotes" here',
    lineBreaks: "Look, Mom! \
  No \\n's!",
    hexadecimal: 0xdecaf,
    leadingDecimalPoint: .8675309, andTrailing: 8675309.,
    positiveSign: +1,
    negativeSign: -9,
    trailingComma: 'in objects', andIn: ['arrays',],
    "backwardsCompatible": "with JSON",
  }`
})
```


## Options

This plugin uses the [`json5`](https://github.com/json5/json5) under the hood.
So you can provide the same options of the `json5` module.

When you register the plugin you can pass the [`JSON.parse`](https://github.com/json5/json5#parameters) options:

- `reviver`

When you call the `reply.sendJSON5()` you can pass the [`JSON.stringify`](https://github.com/json5/json5#parameters-1):

- `replacer`
- `space`
- `quote`


## Security

By default, the `json5` module behaves like the `JSON.parse` and `JSON.stringify` methods.
So [it parse and add to the prototype](https://github.com/json5/json5/commit/4a8c4568fe6bf85daf6f473aaa50007c43f74d6e) the `__proto__` property.

This module implements a security check to avoid the `__proto__` property to be added to the prototype. In this case the plugin will throw an http 400 error.


## License

Copyright [Manuel Spigolon](https://github.com/Eomm), Licensed under [MIT](./LICENSE).
