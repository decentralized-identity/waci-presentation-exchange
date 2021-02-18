// ****************
// Base
// ****************

export type WACIChallengeJWTPayload<Version extends string, Purpose extends string> = {
  callbackUrl: string
  purpose: Purpose
  version: Version
}

export type WACIResponseJWTPayload = {
  challenge: string
}

// ****************
// Offer / Claim
// ****************

export type OfferChallengeJWTPayloadV1 = WACIChallengeJWTPayload<'1', 'offer'> & {
  credential_manifest: Record<string, any>
}

export type OfferChallengeJWTPayload = OfferChallengeJWTPayloadV1

export type OfferResponseJWTPayload = WACIResponseJWTPayload & {
  verifiable_presentation?: Record<string, any>
}

// ****************
// Request / Share
// ****************

export type RequestChallengeJWTPayloadV1 = WACIChallengeJWTPayload<'1', 'request'> & {
  presentation_definition: Record<string, any>
}

export type RequestChallengeJWTPayload = RequestChallengeJWTPayloadV1

export type RequestResponseJWTPayload = WACIResponseJWTPayload & {
  verifiable_presentation: Record<string, any>
}
