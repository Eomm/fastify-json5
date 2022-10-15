'use strict'

const fp = require('fastify-plugin')

const createError = require('@fastify/error')

const FST_ERR_CTP_EMPTY_JSON5_BODY = createError(
  'FST_ERR_CTP_EMPTY_JSON5_BODY',
  "Body cannot be empty when content-type is set to 'application/json5'",
  400
)

const clone = require('rfdc')()

const JSON5 = require('json5')

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
    const payload = JSON5.parse(body, function securityReviver (key, value) {
      console.log({
        key,
        value,
        p: value.__proto__
      })
      if (
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype') {
        // just NO
        return undefined
      }

      let bad
      // eslint-disable-next-line no-proto
      if (value.__proto__ && (bad = Object.keys(value.__proto__), bad).length > 0) {
        value.__proto__ = undefined
        for (const k of bad) {
          console.log('deleting', k)
          delete value[k]
        }
        return value
      }

      return userReviver?.(key, value) ?? value
    })
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
  fastify: '^4.x'
})
