import test from 'ava'

import {didcomm} from '../../dist/index.js'

const k0 = {
  id:
    'did:example:123#zACHcwW82qt3JuD2Co21dHarqPoK4RYviAHW9x9xPjor9m4mBGiBCQUDtyMkAwUfQ6ogSR7GHBFe2tnz9Eenbe4PGn9r2c7cujfNo3HQuyQfc8Tfdk8LdoSTXeCA35RjrQoWcbbM',
  type: 'JsonWebKey2020',
  controller: 'did:example:123',
  publicKeyJwk: {
    kty: 'EC',
    crv: 'P-384',
    x: 'KVEDQVwV_1PDuIC1Ra5YNM1G1df-EdS81tAf9tM6Nwuk-W75JozY6uRW1DyiBq7u',
    y: 'StxYyQarQ1Qi-hQxJDsDlc-ojVXq_NbxX_ZibzOTLNCIZ4cEEBBqFvRRfqPHObPY',
  },
  privateKeyJwk: {
    kty: 'EC',
    crv: 'P-384',
    x: 'KVEDQVwV_1PDuIC1Ra5YNM1G1df-EdS81tAf9tM6Nwuk-W75JozY6uRW1DyiBq7u',
    y: 'StxYyQarQ1Qi-hQxJDsDlc-ojVXq_NbxX_ZibzOTLNCIZ4cEEBBqFvRRfqPHObPY',
    d: 'iKh5F1K7ukHt_XzMEpzk77redJ6SThfwWzJiylOwbdjqeIvIaEJud17fNb9X6kj3',
  },
}

test('ECDH-ES encrypt / decrypt', async t => {
  t.true('encrypt' in didcomm)
  const m0 = 'It’s a dangerous business, Frodo, going out your door.'
  const m0_jwe = await didcomm.encrypt(m0, k0.publicKeyJwk)
  const m0_dec = await didcomm.decrypt(m0_jwe, k0.privateKeyJwk)
  t.true(m0 === m0_dec)
})
