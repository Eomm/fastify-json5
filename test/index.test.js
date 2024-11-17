'use strict'

const { test } = require('node:test')
const fastify = require('fastify')
const plugin = require('../index')

const headers = {
  'content-type': 'application/json5'
}

test('basic test', async t => {
  const app = fastify()
  app.register(plugin)

  app.post('/', (req, reply) => {
    t.assert.deepStrictEqual(req.body, {
      unquoted: 'and you can quote me on that',
      singleQuotes: 'I can use "double quotes" here',
      lineBreaks: "Look, Mom!     No \n's!",
      hexadecimal: 912559,
      leadingDecimalPoint: 0.8675309,
      andTrailing: 8675309,
      positiveSign: 1,
      negativeSign: -9,
      trailingComma: 'in objects',
      andIn: ['arrays'],
      backwardsCompatible: 'with JSON'
    })

    reply.sendJSON5(req.body, {
      quote: "'",
      space: 1
    })
  })

  const response = await app.inject({
    method: 'POST',
    url: '/',
    headers,
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

  t.assert.strictEqual(response.payload, `{
 unquoted: 'and you can quote me on that',
 singleQuotes: 'I can use "double quotes" here',
 lineBreaks: 'Look, Mom!     No \\n\\'s!',
 hexadecimal: 912559,
 leadingDecimalPoint: 0.8675309,
 andTrailing: 8675309,
 positiveSign: 1,
 negativeSign: -9,
 trailingComma: 'in objects',
 andIn: [
  'arrays',
 ],
 backwardsCompatible: 'with JSON',
}`)
})

test('set reviver', async t => {
  const app = fastify()
  app.register(plugin, {
    reviver: (key, value) => {
      if (key === '') {
        return value
      }
      return typeof value
    }
  })

  app.post('/', (req, reply) => {
    t.assert.deepStrictEqual(req.body, {
      unquoted: 'string',
      singleQuotes: 'string',
      lineBreaks: 'string',
      hexadecimal: 'number',
      leadingDecimalPoint: 'number',
      andTrailing: 'number',
      positiveSign: 'number',
      negativeSign: 'number',
      trailingComma: 'string',
      andIn: 'object',
      backwardsCompatible: 'string'
    })
    return 'ok'
  })

  const response = await app.inject({
    method: 'POST',
    url: '/',
    headers,
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
  t.assert.strictEqual(response.statusCode, 200)
})

test('bad payload', async t => {
  const app = fastify()
  app.register(plugin)

  app.post('/', (req, reply) => {
    t.assert.fail('should not be called')
  })

  const response = await app.inject({
    method: 'POST',
    url: '/',
    headers,
    payload: '<ops>not a json</ops>'
  })

  t.assert.strictEqual(response.statusCode, 400)
  t.assert.deepStrictEqual(response.json(), {
    statusCode: 400,
    error: 'Bad Request',
    message: "JSON5: invalid character '<' at 1:1"
  })
})

test('empty payload', async t => {
  const app = fastify()
  app.register(plugin)

  app.post('/', (req, reply) => {
    t.assert.fail('should not be called')
  })

  const response = await app.inject({
    method: 'POST',
    url: '/',
    headers,
    payload: null
  })

  t.assert.strictEqual(response.statusCode, 400)
  t.assert.deepStrictEqual(response.json(), {
    statusCode: 400,
    code: 'FST_ERR_CTP_EMPTY_JSON5_BODY',
    error: 'Bad Request',
    message: "Body cannot be empty when content-type is set to 'application/json5'"
  })
})
