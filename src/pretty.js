'use strict'

const lookup = require('./lookup')

function isLocal (address) {
  var split = address.split('.')
  if (split[0] === '10') return true
  if (split[0] === '127') return true
  if (split[0] === '192' && split[1] === '168') return true
  if (split[0] === '172' && Number(split[1]) >= 16 && Number(split[1]) <= 31) return true
  return false
}

module.exports = function lookupPretty (ipfs, multiaddrs) {
  return new Promise(async (resolve, reject) => {
    if (multiaddrs.length === 0) {
      reject(new Error('lookup requires a multiaddr array with length > 0'), null)
    }

    if (typeof multiaddrs === 'string') {
      multiaddrs = [multiaddrs]
    }

    const current = multiaddrs[0].split('/')
    const address = current[2]

    // No ip6 support at the moment
    if (isLocal(address) || current[1] === 'ip6') {
      const next = multiaddrs.slice(1)
      if (next.length > 0) {
        resolve(lookupPretty(ipfs, multiaddrs.slice(1)))
      }
      reject(new Error('Unmapped range'))
    }

    try {
      const res = await lookup(ipfs, address)

      if (!res.country_name && multiaddrs.length > 1) {
        resolve(lookupPretty(ipfs, multiaddrs.slice(1)))
      }

      const location = []

      if (res.planet) location.push(res.planet)
      if (res.country_name) location.unshift(res.country_name)
      if (res.region_code) location.unshift(res.region_code)
      if (res.city) location.unshift(res.city)

      res.formatted = location.join(', ')

      resolve(res)
    } catch (err) {
      reject(err)
    }
  })
}
