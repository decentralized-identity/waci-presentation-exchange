import CompactEncrypt from 'jose/jwe/compact/encrypt'
import compactDecrypt from 'jose/jwe/compact/decrypt'
import parseJwk from 'jose/jwk/parse'

const JWE_ALG = 'ECDH-ES'
const JWE_ENC = 'A256GCM'

export const encrypt = async (payload: string, publicKeyJwk: any) => {
  const ecPublicKey = await parseJwk(publicKeyJwk, JWE_ALG)
  const encoder = new TextEncoder()
  const jwe = await new CompactEncrypt(encoder.encode(payload))
    //
    .setProtectedHeader({alg: JWE_ALG, enc: JWE_ENC})
    .encrypt(ecPublicKey)
  return jwe
}

export const decrypt = async (jwe: string, privateKeyJwk: any) => {
  const ecPrivateKey = await parseJwk(privateKeyJwk, JWE_ALG)
  const {plaintext} = await compactDecrypt(jwe, ecPrivateKey)
  return Buffer.from(plaintext).toString()
}
