import SignJWT, {JWTPayload, KeyLike} from 'jose/jwt/sign'
import jwtVerify, {JWTVerifyGetKey, JWTVerifyOptions} from 'jose/jwt/verify'
import {JWTVerifyResult} from 'jose/webcrypto/types'
import {JWTClaimValidationFailed} from 'jose/webcrypto/util/errors'

import { OfferChallengeJWTPayload, OfferResponseJWTPayload, RequestChallengeJWTPayload, RequestResponseJWTPayload } from './core'

// ****************
// Offer / Claim
// ****************

// Challenge

type JoseOfferChallengeJWTPayload = Omit<OfferChallengeJWTPayload, 'purpose'> & JWTPayload

export class SignOfferChallengeJWT extends SignJWT {
  constructor(payload: JoseOfferChallengeJWTPayload) {
    super({...payload, purpose: 'offer'})
  }
}

const offerChallengeJwtVerifyV1 = (result: JWTVerifyResult) => {
  if (result.payload['purpose'] !== 'offer') {
    throw new JWTClaimValidationFailed('"purpose" claim check failed', 'purpose', 'check_failed')
  }

  if (typeof result.payload['credential_manifest'] !== 'object') {
    throw new JWTClaimValidationFailed('"credential_manifest" claim check failed', 'credential_manifest', 'check_failed')
  }
}

export const offerChallengeJwtVerify = async (
  jwt: string | Uint8Array,
  key: KeyLike | JWTVerifyGetKey,
  options?: JWTVerifyOptions,
): Promise<JWTVerifyResult> => {
  const result = await jwtVerify(jwt, key, options)

  switch (result.payload['version']) {
    case '1':
      offerChallengeJwtVerifyV1(result)
      break
    default:
      throw new JWTClaimValidationFailed('"version" is an unknown value', 'version', 'invalid')
  }

  return result
}

// Response

export type JoseOfferResponseJWTPayload = OfferResponseJWTPayload & JWTPayload

export class SignOfferResponseJWT extends SignJWT {
  constructor(payload: JoseOfferResponseJWTPayload) {
    super(payload)
  }
}

const offerResponseJwtVerifyV1 = async (responseResult: JWTVerifyResult, challengeResult: JWTVerifyResult) => {
  if (typeof challengeResult.payload.aud === 'string' && challengeResult.payload.aud !== responseResult.payload.iss) {
    throw new JWTClaimValidationFailed(
      '"iss" claim check failed, the "iss" of the response does not match the "aud" of the challenge',
      'iss',
      'check_failed',
    )
  }

  if (challengeResult.payload.iss !== responseResult.payload.aud) {
    throw new JWTClaimValidationFailed(
      '"aud" claim check failed, the "aud" of the response does not match the "iss" of the challenge',
      'aud',
      'check_failed',
    )
  }

  if (challengeResult.payload['credential_manifest']['presentation_definition'] && !responseResult.payload['verifiable_presentation']) {
    throw new JWTClaimValidationFailed(
      '"verifiable_presentation" claim check failed, no "verifiable_presentation" in the response but a "presentation_definition" is defined in the challenge',
      'verifiable_presentation',
      'check_failed',
    )
  }
}

export const offerResponseJwtVerify = async (
  jwt: string | Uint8Array,
  response: {
    key: KeyLike | JWTVerifyGetKey
    options?: JWTVerifyOptions
  },
  challenge: {
    key: KeyLike | JWTVerifyGetKey
    options?: JWTVerifyOptions
  },
): Promise<{response: JWTVerifyResult; challenge: JWTVerifyResult}> => {
  const responseResult = await jwtVerify(jwt, response.key, response.options)

  if (typeof responseResult.payload['challenge'] !== 'string') {
    throw new JWTClaimValidationFailed('"challenge" claim check failed', 'challenge', 'check_failed')
  }

  const challengeResult = await offerChallengeJwtVerify(responseResult.payload['challenge'], challenge.key, challenge.options)

  // Verify the response based on the challenge's version
  switch (challengeResult.payload['version']) {
    case '1':
      offerResponseJwtVerifyV1(responseResult, challengeResult)
      break
    default:
      throw new JWTClaimValidationFailed('"version" is an unknown value', 'version', 'invalid')
  }

  return {response: responseResult, challenge: challengeResult}
}

// ****************
// Request / Share
// ****************

// Challenge

export type JoseRequestChallengeJWTPayload = Omit<RequestChallengeJWTPayload, 'purpose'> & JWTPayload

export class SignRequestChallengeJWT extends SignJWT {
  constructor(payload: JoseRequestChallengeJWTPayload) {
    super({...payload, purpose: 'request'})
  }
}

const requestChallengeJwtVerifyV1 = (result: JWTVerifyResult) => {
  if (result.payload['purpose'] !== 'request') {
    throw new JWTClaimValidationFailed(
      '"purpose" claim check failed',
      'purpose',
      'check_failed',
    )
  }

  if (typeof result.payload['presentation_definition'] !== 'object') {
    throw new JWTClaimValidationFailed(
      '"presentation_definition" claim check failed',
      'presentation_definition',
      'check_failed',
    )
  }
}

export const requestChallengeJwtVerify = async (
  jwt: string | Uint8Array,
  key: KeyLike | JWTVerifyGetKey,
  options?: JWTVerifyOptions,
): Promise<JWTVerifyResult> => {
  const result = await jwtVerify(jwt, key, options)

  switch (result.payload['version']) {
    case '1':
      requestChallengeJwtVerifyV1(result)
      break
    default:
      throw new JWTClaimValidationFailed('"version" is an unknown value', 'version', 'invalid')
  }

  return result
}

// Response

export type JoseRequestResponseJWTPayload = RequestResponseJWTPayload & JWTPayload

export class SignRequestResponseJWT extends SignJWT {
  constructor(payload: JoseRequestResponseJWTPayload) {
    super(payload)
  }
}

const requestResponseJwtVerifyV1 = async (responseResult: JWTVerifyResult, challengeResult: JWTVerifyResult) => {
  if (typeof challengeResult.payload.aud === 'string' && challengeResult.payload.aud !== responseResult.payload.iss) {
    throw new JWTClaimValidationFailed(
      '"iss" claim check failed, the "iss" of the response does not match the "aud" of the challenge',
      'iss',
      'check_failed',
    )
  }

  if (challengeResult.payload.iss !== responseResult.payload.aud) {
    throw new JWTClaimValidationFailed(
      '"aud" claim check failed, the "aud" of the response does not match the "iss" of the challenge',
      'aud',
      'check_failed',
    )
  }

  if (typeof responseResult.payload['verifiable_presentation'] !== 'object') {
    throw new JWTClaimValidationFailed(
      '"verifiable_presentation" claim check failed',
      'verifiable_presentation',
      'check_failed',
    )
  }
}

export const requestResponseJwtVerify = async (
  jwt: string | Uint8Array,
  response: {
    key: KeyLike | JWTVerifyGetKey
    options?: JWTVerifyOptions
  },
  challenge: {
    key: KeyLike | JWTVerifyGetKey
    options?: JWTVerifyOptions
  },
): Promise<{response: JWTVerifyResult; challenge: JWTVerifyResult}> => {
  const responseResult = await jwtVerify(jwt, response.key, response.options)

  if (typeof responseResult.payload['challenge'] !== 'string') {
    throw new JWTClaimValidationFailed('"challenge" claim check failed', 'challenge', 'check_failed')
  }

  const challengeResult = await requestChallengeJwtVerify(responseResult.payload['challenge'], challenge.key, challenge.options)

  // Verify the response based on the challenge's version
  switch (challengeResult.payload['version']) {
    case '1':
      requestResponseJwtVerifyV1(responseResult, challengeResult)
      break
    default:
      throw new JWTClaimValidationFailed('"version" is an unknown value', 'version', 'invalid')
  }

  return {response: responseResult, challenge: challengeResult}
}
