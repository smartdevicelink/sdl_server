'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  ENABLE_REPORTING: process.env.ENABLE_REPORT === 'true' ? true : false
})
