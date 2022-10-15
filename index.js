'use strict'

const fp = require('fastify-plugin')

const createError = require('@fastify/error')

const FST_ERR_CTP_EMPTY_JSON5_BODY = createError(
  'FST_ERR_CTP_EMPTY_JSON5_BODY',
  "Body cannot be empty when content-type is set to 'application/json5'",
  400
)

const JSON5 = require('json5')

function fastifyJson5 (fastify, options, next) {
  const {
    reviver
  } = options

  fastify.addContentTypeParser('application/json5',
    { parseAs: 'string' },
    json5Parser.bind(null, reviver))

  next()
}

function json5Parser (reviver, req, body, done) {
  if (body === '' || body == null) {
    done(new FST_ERR_CTP_EMPTY_JSON5_BODY())
    return
  }

  try {
    const payload = JSON5.parse(body, reviver)
    done(null, payload)
  } catch (err) {
    err.statusCode = 400
    done(err)
  }
}

module.exports = fp(fastifyJson5, {
  name: 'fastify-json5',
  fastify: '^4.x'
})
