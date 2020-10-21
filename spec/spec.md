# Online JWT Interactions

**Specification Status:** ??

**Editors:**
~ [Afshan Aman](https://www.linkedin.com/in/afshan-aman/) (Bloom)
~ [Eddie Hedges](https://www.linkedin.com/in/eddiehedges/) (Bloom)

**Contributors:**
~ [Jace Hensley](https://www.linkedin.com/in/jacehensley/) (Bloom)

**Participate:**
~ [GitHub repo](https://github.com/hellobloom/online-jwt-interactions)
~ [File a bug](https://github.com/hellobloom/online-jwt-interactions/issues)
~ [Commit history](https://github.com/hellobloom/online-jwt-interactions/commits/master)

---

## Abstract

When an app/website (issuer, requester, etc.) is interacting with a user there might be a need to do an exchange of JWTs or other signatures. The problem is that QR codes can only contain so much data and a token might be too large. The proposed solution is to start the interaction with a QR code (or link on mobile devices) that contains a link to fetch the token from. The end result returned from the user to the app/website will be signed by the user and will contain the initial token as a challenge. This proves ownership of the DID in addition to the main purpose of the interaction.

Specifically this spec covers:

- the flow where an issuer gives a VC to a user and where
- the flow where a data requester is requesting VCs from a user (to be shared as a VP)

## Status of This Document

## Payload

This payload will be what's presented to the user either in a QR code or link.

```json
{
  "tokenUrl": "https://example.com/api/get-token/fb28b4ec-4209-4b78-8507-7cc49164cb37"
}
```

- `tokenUrl`:
  - MUST be unique to the user
  - MUST be a `GET` endpoint that returns the [Token Payload](#token-payload)

## Token Payload

```json
{
  "token": "{{JWT String}}"
}
```

- `token`:
  - MUST be a JWT
  - MUST conform to the structure [below](#token)

### Token

```json
{
  "header": {
    "alg": "...",
    "kid": "did:example:ebfeb1f712ebc6f1c276e12ec21#primary"
  },
  "payload": {
    "callbackUrl": "https://example.com/api/callback-url",
    "purpose": "...",
    "iss": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "aud": "..."
  }
}
```

In addition to base JWT fields the following applies:

- `header`
  - MUST have `kid`, so the JWT can be verified
- `payload`
  - MUST have `callbackUrl`
    - MUST be a `POST` endpoint to take the user's reponse (determined by the `purpose`)
  - MUST have `purpose`
    - See [Purpose](#purpose) below
  - MUST have `iss`

## Callback Response

The POST to the provided `callbackUrl` can return with a simple `200` for success or it can provide a `redirectUrl` that the app will open. This could be used to show a success message or bring them back to the website/app to continue where they left off. Most of the time `redirectUrl` will only be used when the user is already using their phone (see [below](#qr-code-or-link)).

```json
{
  "redirectUrl": "https://example.com/redirect-url?id={{Some id that identifies the user}}"
}
```

## QR Code Or Link

If the user is using an app/webiste on their computer then they would be able to scan a QR code with their mobile wallet. But if the user is using a mobile app/website then they wouldn't be able to scan a QR code, they would need to be able to click a link that will open their mobile wallet.

## Purpose

The idea of this specification is to support any number of interaction that require transferring JWTs between two parties. The `purpose` field in the initial JWT's payload is what's responsible for informing the second party what the initiator wants. Depending on the purpose there will be additional fields in the payload.

### Offer/Claim Purpose

This purpose is for the use case where an Issuer wants to give credential(s) to the user.

```json
{
  "header": {
    "alg": "...",
    "kid": "did:example:ebfeb1f712ebc6f1c276e12ec21#primary"
  },
  "payload": {
    "callbackUrl": "https://example.com/api/callback-url",
    "iss": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "purpose": "offer",
    /* Not finalized, and I would love if this could rely on a separate spec */
    "offeredCredentials": [
      {
        "type": ["PhoneCredential"]
      },
      {
        "type": ["EmailCredential"]
      }
    ]
  }
}
```

This JWT tells the user that the issuer has a `PhoneCredential` and `EmailCredential` waiting for them to claim.

- `payload`
  - MUST have `offeredCredentials`

#### Callback URL Payload

The payload that will be `POST`ed to the `callbackUrl` will contain a JWT signed by the user and whether the user is using a QR code or link.

```json
{
  token: "{{Signed JWT}}"
  from: "qr" | "link"
}
```

- `from`
  - MUST be either "qr" or "link"
  - The issuer may need to handle things differently based on how the user is claiming the credentials

##### Token

This is the format that the JWT sent to the `callbackUrl` must adhere to.

```json
{
  "header": {
    "alg": "...",
    "kid": "did:example:c276e12ec21ebfeb1f712ebc6f1#primary"
  },
  "payload": {
    "challenge": "{{Initial JWT}}",
    "iss": "did:example:c276e12ec21ebfeb1f712ebc6f1",
    "aud": "did:example:ebfeb1f712ebc6f1c276e12ec21"
  }
}
```

- `header`
  - MUST have `kid`, so the JWT can be verified
- `payload`
  - MUST have `challenge`
    - MUST be the initial token fetched from `tokenUrl`
      - Sending back the original token allows the Issuer to not have to store the tokens, see [Token Storage](#token-storage) for more details and caveats
  - MUST have `iss`
  - MUST have `aud`
    - MUST be the initial token's `iss`

#### Callback Response

In addition to the optional `redirectUrl` the offer purpose must respond with signed credentials

```json
{
  "redirectUrl": "...",
  "vc": [
    {
      /* ... */
      "type": ["VerifiableCredential" /* ... */]
    }
    /* ... */
  ]
}
```

#### Flow

<tab-panels selected-index="0">

<nav>
  <button type="button">QR Based</button>
  <button type="button">Link Based</button>
</nav>

<section>

1. Issuer displays a QR code
1. User scans QR code with mobile wallet
1. Wallet `GET`s `tokenUrl` and recieves the `token`
1. (Optional) Wallet parses the token and displays to the user the credentials that are being offered
1. Wallet creates a reponse token and `POST`s it to the `callbackUrl`
1. Issuer recieves token and verifies it, verification includes:
   - Verify the recieved token
   - Verify the recieved token's challenge
     - Verify the challenge token
     - Verify that the challenge token was signed by the Issuer
     - Verify that the token hasn't been used (protect against replay attacks, see [Token Storage](#token-storage) for more details)
   - Verify that the recieved token's `iss` matches the challenge token's `aud` (if present)
1. Issuer responds with the signed credentials and a redirect URL (optional)
1. Wallet recieves credentials, verifies them (optional), and stores them (optional)
1. If provided, the Wallet will open a browser to `redirectUrl`

</section>

<section>

1. Issuer displays a link
1. User clicks link, opening their mobile wallet
1. Wallet `GET`s `tokenUrl` and recieves the `token`
1. (Optional) Wallet parses the token and displays to the user the credentials that are being offered
1. Wallet creates a reponse token and `POST`s it to the `callbackUrl`
1. Issuer recieves token and verifies it, verification includes:
   - Verify the recieved token
   - Verify the recieved token's challenge
     - Verify the challenge token
     - Verify that the challenge token was signed by the Issuer
     - Verify that the token hasn't been used (protect against replay attacks, see [Token Storage](#token-storage) for more details)
   - Verify that the recieved token's `iss` matches the challenge token's `aud` (if present)
1. Issuer responds with the signed credentials and a redirect URL (optional)
1. Wallet recieves credentials, verifies them (optional), and stores them (optional)
1. If provided, the Wallet will open a browser to `redirectUrl`

</section>

</tab-panels>

### Request/Share Purpose

This purpose is for the use case where an Requester wants a user to share credentials with them.

```json
{
  "header": {
    "alg": "...",
    "kid": "did:example:ebfeb1f712ebc6f1c276e12ec21#primary"
  },
  "payload": {
    "callbackUrl": "https://example.com/api/callback-url",
    "iss": "did:example:ebfeb1f712ebc6f1c276e12ec21",
    "purpose": "request",
    /* Using [Presentation Exchange](https://identity.foundation/presentation-exchange/) to define the requirements */
    "presentationDefinition": {
      /* ... */
    }
  }
}
```

This JWT tells the user what credentials the requester is asking for.

#### Callback URL Payload

The payload that will be `POST`ed to the `callbackUrl` will contain a signed [Verifiable Presentation](https://www.w3.org/TR/vc-data-model/#presentations-0) and whether the user is using a QR code or link.

The VP will contain the credentials that were requested. The `challenge` will be set to the initial JWT and the `domain` will be set to the host of the `callbackUrl`.

```json
{
  vp: {
    // ...
    "type": ["VerifiablePresentation"],
    "proof": {
      // ...
      "challenge": "{{Initial JWT}}",
      "domain": "{{URI(callbackUrl).host}}"
    }
  }
  from: "qr" | "link"
}
```

- `from`
  - MUST be either "qr" or "link"
  - The issuer may need to handle things differently based on how the user is claiming the credentials
- `vp`
  - MUST be a VP
  - `challenge`
    - MUST be the initial JWT from the Requester
  - `domain`
    - MUST be the host of the `callbackUrl`

#### Callback Response

Only the optional `redirectUrl` needs to be returned from the `callbackUrl`.

#### Flow

##### QR Based

<tab-panels selected-index="0">

<nav>
  <button type="button">QR Based</button>
  <button type="button">Link Based</button>
</nav>

<section>

1. Requester displays a QR code
1. User scans QR code with mobile wallet
1. Wallet `GET`s `tokenUrl` and recieves the `token`
1. Wallet parses the token and displays to the user the credentials that are being requested
1. Wallet gathers the requested VCs and creates a VP containing them all and `POST`s it to the `callbackUrl`
1. Requester recieves VP and verifies it, verification includes:
   - Verify the recieved VP
   - Verify the recieved VP's challenge
     - Verify the challenge token
     - Verify that the challenge token was signed by the Issuer
     - Verify that the token hasn't been used (protect against replay attacks, see [Token Storage](#token-storage) for more details)
   - Verify that the VP's `holder` matches the challenge token's `aud` (if present)
1. Requester responds successfully to the wallet, optionally providing a redirect URL
1. Wallet indicates to the user that the share was successful
1. If provided the Wallet will open a browser to `redirectUrl`

</section>

<section>

1. Requester displays a link
1. User clicks link, opening their mobile wallet
1. Wallet `GET`s `tokenUrl` and recieves the `token`
1. Wallet parses the token and displays to the user the credentials that are being requested
1. Wallet creates gathers the requested VCs and creates a VP containing them all and `POST`s it to the `callbackUrl`
1. Requester recieves VP and verifies it, verification includes:
   - Verify the recieved VP
   - Verify the recieved VP's challenge
     - Verify the challenge token
     - Verify that the challenge token was signed by the Issuer
     - Verify that the token hasn't been used (protect against replay attacks, see [Token Storage](#token-storage) for more details)
   - Verify that the VP's `holder` matches the challenge token's `aud` (if present)
1. Requester responds successfully to the wallet, optionally providing a redirect URL
1. Wallet indicates to the user that the share was successful

</section>

## Token Storage

Because the initial token is always sent back to the initiator the token doesn't need to be stored on creation. But no storage at all can lead to replay attacks. One suggested way to mitigate replay attacks while keeping storage to a minimal is to only store the hash of "used" tokens and have a cron job that cleans this storage based on expiration date of the tokens.
