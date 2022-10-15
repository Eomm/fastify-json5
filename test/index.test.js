'use strict'

const { test } = require('tap')
const fastify = require('fastify')
const plugin = require('../index')

const headers = {
  'content-type': 'application/json5'
}

test('basic test', async t => {
  const app = fastify()
  await app.register(plugin)

  app.post('/', (req, reply) => {
    t.strictSame(req.body, {
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
    reply.send(req.body)
  })

  await app.inject({
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
})

test('bad payload', async t => {
  const app = fastify()
  await app.register(plugin)

  app.post('/', (req, reply) => {
    t.fail('should not be called')
  })

  const response = await app.inject({
    method: 'POST',
    url: '/',
    headers,
    payload: '<ops>not a json</ops>'
  })

  t.equal(response.statusCode, 400)
  t.strictSame(response.json(), {
    statusCode: 400,
    error: 'Bad Request',
    message: "JSON5: invalid character '<' at 1:1"
  })
})

test('empty payload', async t => {
  const app = fastify()
  await app.register(plugin)

  app.post('/', (req, reply) => {
    t.fail('should not be called')
  })

  const response = await app.inject({
    method: 'POST',
    url: '/',
    headers,
    payload: null
  })

  t.equal(response.statusCode, 400)
  t.strictSame(response.json(), {
    statusCode: 400,
    code: 'FST_ERR_CTP_EMPTY_JSON5_BODY',
    error: 'Bad Request',
    message: "Body cannot be empty when content-type is set to 'application/json5'"
  })
})
