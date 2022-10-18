'use strict'

const { test } = require('tap')
const sget = require('simple-get').concat
const fastify = require('fastify')
const plugin = require('../index')

const headers = {
  'content-type': 'application/json5'
}

test('proto-poisoning', t => {
  t.plan(3)

  const app = fastify()
  app.register(plugin)
  t.teardown(app.close.bind(app))

  app.post('/', (req, reply) => {
    t.fail('should not be called')
  })

  app.listen({ port: 0 }, function (err) {
    t.error(err)

    sget({
      method: 'POST',
      url: 'http://localhost:' + app.server.address().port,
      headers,
      body: '{ __proto__: { a: 55 }, b: 42, c: ["a"] }'
    }, (err, response, body) => {
      t.error(err)
      t.equal(response.statusCode, 400)
    })
  })
})

test('proto-poisoning in array', t => {
  t.plan(3)

  const app = fastify()
  app.register(plugin)
  t.teardown(app.close.bind(app))

  app.post('/', (req, reply) => {
    t.fail('should not be called')
  })

  app.listen({ port: 0 }, function (err) {
    t.error(err)

    sget({
      method: 'POST',
      url: 'http://localhost:' + app.server.address().port,
      headers,
      body: '{ b: 42, c: [ {__proto__: { a: 55 }} ] }'
    }, (err, response, body) => {
      t.error(err)
      t.equal(response.statusCode, 400)
    })
  })
})

test('constructor-poisoning', t => {
  t.plan(5)

  const app = fastify()
  app.register(plugin)
  t.teardown(app.close.bind(app))

  app.post('/', (request, reply) => {
    t.strictSame(request.body, { z: 1 })
    t.equal(undefined, Object.assign({}, request.body).foo)
    reply.send({ ok: true })
  })

  app.listen({ port: 0 }, function (err) {
    t.error(err)

    sget({
      method: 'POST',
      url: `http://localhost:${app.server.address().port}`,
      headers,
      body: '{ constructor: { "prototype": { foo: "bar" } }, z: 1 }'
    }, (err, response, body) => {
      t.error(err)
      t.equal(response.statusCode, 200)
    })
  })
})
