'use strict'

const createError = require('@fastify/error')
const fp = require('fastify-plugin')
const JSON5 = require('json5')

const FST_ERR_CTP_EMPTY_JSON5_BODY = createError(
  'FST_ERR_CTP_EMPTY_JSON5_BODY',
  "Body cannot be empty when content-type is set to 'application/json5'",
  400
)

function fastifyJson5 (fastify, options, next) {
  const {
    reviver
  } = options

  fastify.addContentTypeParser('application/json5',
    { parseAs: 'string' },
    json5Parser.bind(null, reviver))

  fastify.decorateReply('sendJSON5', sendJson5)

  next()
}

function json5Parser (userReviver, req, body, done) {
  if (body === '' || body == null) {
    done(new FST_ERR_CTP_EMPTY_JSON5_BODY())
    return
  }

  try {
    let bad
    const payload = JSON5.parse(body, function securityReviver (key, value) {
      if (key === 'prototype' ||
        key === 'constructor') {
        return undefined
      }

      if (typeof value === 'object' &&
          !Array.isArray(value) &&
          // eslint-disable-next-line no-proto
          value.__proto__ !== Object.prototype
      ) {
        bad = true
        return undefined
      }

      return userReviver?.(key, value) ?? value
    })

    if (bad) {
      const err = new Error('JSON5: invalid object')
      err.statusCode = 400
      done(err)
      return
    }

    done(null, payload)
  } catch (err) {
    err.statusCode = 400
    done(err)
  }
}

function sendJson5 (json, options) {
  this.type('application/json5')
  return this.send(JSON5.stringify(json, options))
}

module.exports = fp(fastifyJson5, {
  name: 'fastify-json5',
  fastify: '^5.x'
})
