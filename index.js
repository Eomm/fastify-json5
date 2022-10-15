'use strict'

const fp = require('fastify-plugin')

function fastifyJson5 (fastify, options, next) {
  // todo

  next()
}

module.exports = fp(fastifyJson5, {
  name: 'fastify-json5',
  fastify: '^4.x'
})
