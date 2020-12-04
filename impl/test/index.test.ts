import test from 'ava'

import {
  SignOfferChallengeJWT,
  SignOfferResponseJWT,
  offerResponseJwtVerify,
  SignRequestChallengeJWT,
  requestChallengeJwtVerify,
} from '../dist/index.js'

const credentialManifest = [
  {
    locale: 'en-US',
    issuer: {
      id: 'did:example:123',
      name: 'Washington State Government',
      styles: {
        thumbnail: {
          uri: 'https://dol.wa.com/logo.png',
          alt: 'Washington State Seal',
        },
        hero: {
          uri: 'https://dol.wa.com/people-working.png',
          alt: 'People working on serious things',
        },
        background: {
          color: '#ff0000',
        },
        text: {
          color: '#d4d400',
        },
      },
    },
    credential: {
      schema: 'https://schema.org/EducationalOccupationalCredential',
      display: {
        title: {
          text: 'Washington State Driver License',
        },
        subtitle: {
          text: 'Class A, Commercial',
        },
        description: {
          text:
            'License to operate a vehicle with a gross combined weight rating (GCWR) of 26,001 or more pounds, as long as the GVWR of the vehicle(s) being towed is over 10,000 pounds.',
        },
        properties: [
          {
            label: 'Organ Donor',
          },
        ],
      },
      styles: {
        thumbnail: {
          uri: 'https://dol.wa.com/logo.png',
          alt: 'Washington State Seal',
        },
        hero: {
          uri: 'https://dol.wa.com/happy-people-driving.png',
          alt: 'Happy people driving',
        },
        background: {
          color: '#ff0000',
        },
        text: {
          color: '#d4d400',
        },
      },
    },
  },
]
const presentationDefinition = {
  input_descriptors: [
    {
      id: 'banking_input',
      name: 'Bank Account Information',
      purpose: 'We need your bank and account information.',
      schema: [
        {
          uri: 'https://bank-standards.com/customer.json',
        },
      ],
      constraints: {
        limit_disclosure: true,
        fields: [
          {
            path: ['$.issuer', '$.vc.issuer', '$.iss'],
            purpose: 'The claim must be from one of the specified issuers',
            filter: {
              type: 'string',
              pattern: 'did:example:123|did:example:456',
            },
          },
        ],
      },
    },
    {
      id: 'citizenship_input',
      name: 'US Passport',
      schema: [
        {
          uri: 'hub://did:foo:123/Collections/schema.us.gov/passport.json',
        },
      ],
      constraints: {
        fields: [
          {
            path: ['$.credentialSubject.birth_date', '$.vc.credentialSubject.birth_date', '$.birth_date'],
            filter: {
              type: 'string',
              format: 'date',
              minimum: '1999-5-16',
            },
          },
        ],
      },
    },
  ],
}
const callbackUrl = 'https://example.com'

const relyingPartySecret = new Uint8Array(32)
const userSecret = new Uint8Array(32)

test('Offer Flow', async t => {
  const challengeString = await new SignOfferChallengeJWT({
    callbackUrl,
    credential_manifest: credentialManifest,
    version: '1',
  })
    .setProtectedHeader({alg: 'HS256'})
    .sign(relyingPartySecret)

  const responseString = await new SignOfferResponseJWT({
    challenge: challengeString,
  })
    .setProtectedHeader({alg: 'HS256'})
    .sign(userSecret)

  const {response, challenge} = await offerResponseJwtVerify(
    responseString,
    {
      key: userSecret,
    },
    {
      key: relyingPartySecret,
    },
  )

  t.true('purpose' in challenge.payload)
  t.deepEqual(challenge.payload['purpose'], 'offer')

  t.true('callbackUrl' in challenge.payload)
  t.deepEqual(challenge.payload['callbackUrl'], callbackUrl)

  t.true('credential_manifest' in challenge.payload)
  t.deepEqual(challenge.payload['credential_manifest'], credentialManifest)

  t.true('challenge' in response.payload)
  t.deepEqual(response.payload['challenge'], challengeString)
})

test('Request Flow', async t => {
  const challengeString = await new SignRequestChallengeJWT({
    callbackUrl,
    presentation_definition: presentationDefinition,
    version: '1',
  })
    .setProtectedHeader({alg: 'HS256'})
    .sign(relyingPartySecret)

  const challenge = await requestChallengeJwtVerify(challengeString, relyingPartySecret)

  t.true('purpose' in challenge.payload)
  t.deepEqual(challenge.payload['purpose'], 'request')

  t.true('callbackUrl' in challenge.payload)
  t.deepEqual(challenge.payload['callbackUrl'], callbackUrl)

  t.true('presentation_definition' in challenge.payload)
  t.deepEqual(challenge.payload['presentation_definition'], presentationDefinition)
})
