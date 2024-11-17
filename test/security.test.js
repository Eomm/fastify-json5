'use strict'

const { test } = require('node:test')
const sget = require('simple-get').concat
const fastify = require('fastify')
const plugin = require('../index')

const headers = {
  'content-type': 'application/json5'
}

test('proto-poisoning', (t, done) => {
  t.plan(3)

  const app = fastify()
  app.register(plugin)
  t.after(() => { app.close() })

  app.post('/', (req, reply) => {
    t.assert.fail('should not be called')
  })

  app.listen({ port: 0 }, function (err) {
    t.assert.ifError(err)

    sget({
      method: 'POST',
      url: 'http://localhost:' + app.server.address().port,
      headers,
      body: '{ __proto__: { a: 55 }, b: 42, c: ["a"] }'
    }, (err, response, body) => {
      t.assert.ifError(err)
      t.assert.strictEqual(response.statusCode, 400)
      done()
    })
  })
})

test('proto-poisoning in array', (t, done) => {
  t.plan(3)

  const app = fastify()
  app.register(plugin)
  t.after(() => { app.close() })

  app.post('/', (req, reply) => {
    t.assert.fail('should not be called')
  })

  app.listen({ port: 0 }, function (err) {
    t.assert.ifError(err)

    sget({
      method: 'POST',
      url: 'http://localhost:' + app.server.address().port,
      headers,
      body: '{ b: 42, c: [ {__proto__: { a: 55 }} ] }'
    }, (err, response, body) => {
      t.assert.ifError(err)
      t.assert.strictEqual(response.statusCode, 400)
      done()
    })
  })
})

test('constructor-poisoning', (t, done) => {
  t.plan(5)

  const app = fastify()
  app.register(plugin)
  t.after(() => { app.close() })

  app.post('/', (request, reply) => {
    t.assert.deepStrictEqual(request.body, { z: 1 })
    t.assert.strictEqual(undefined, Object.assign({}, request.body).foo)
    reply.send({ ok: true })
  })

  app.listen({ port: 0 }, function (err) {
    t.assert.ifError(err)

    sget({
      method: 'POST',
      url: `http://localhost:${app.server.address().port}`,
      headers,
      body: '{ constructor: { "prototype": { foo: "bar" } }, z: 1 }'
    }, (err, response, body) => {
      t.assert.ifError(err)
      t.assert.strictEqual(response.statusCode, 200)
      done()
    })
  })
})
