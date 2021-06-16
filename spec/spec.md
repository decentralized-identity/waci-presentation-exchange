# Wallet And Credential Interactions

> WACI [__wak__-ee]

**Specification Status:** Draft

**Editors:**
~ [Orie Steele](https://www.linkedin.com/in/or13b/) (Transmute)
~ [Brent Zundel](https://www.linkedin.com/in/bzundel/) (Evernym)

**Authors:**
~ [Afshan Aman](https://www.linkedin.com/in/afshan-aman/) (Bloom)
~ [Eddie Hedges](https://www.linkedin.com/in/eddiehedges/) (Bloom)
~ [Jace Hensley](https://www.linkedin.com/in/jacehensley/) (Bloom)

**Participate:**
~ [GitHub repo](https://github.com/decentralized-identity/waci-presentation-exchange)
~ [File a bug](https://github.com/decentralized-identity/waci-presentation-exchange/issues)
~ [Commit history](https://github.com/decentralized-identity/waci-presentation-exchange/commits/master)

---

## Abstract

There are interactions between a wallet and relying party that require passing
information between the two. WACI provides a standard for these interactions.

WACI v0.1 incorporates elements from a number of existing specifications and
protocols. It inherits its overall structure from a
[previous version of WACI](https://github.com/decentralized-identity/wallet-and-credential-interactions),
but makes use of
[DIDComm v2.0](https://github.com/decentralized-identity/didcomm-messaging)
communication protocols, along with
[Aries Present Proof](https://github.com/hyperledger/aries-rfcs/blob/master/features/0454-present-proof-v2/README.md)
message formats and
[DIF Presentation Exchange](https://identity.foundation/presentation-exchange/)
data objects.

It is anticipated that future versions of this specification will add
support for additional messaging, transport, or other mechanisms beyond those
used in v0.1.

![Layering Diagram](./resources/layer_cake_v0-1.png)

## Status of This Document

WACI v0.1 is a _PRE-DRAFT_ specification under development by the
[DIF Claims and Credentials WG](https://identity.foundation/working-groups/claims-credentials.html).


## Interactions

All interactions use the same common blocks:

### QR Code or Link

Two ways of initiating an interaction is for the relying party to display either
a QR code or a link to the user. There could be other ways to initiate an
interaction but this document will be discussing QR codes and links.

If the user is using an app/webiste on something other than the device that
their wallet is on, then they would be able to scan a QR code with the wallet.
_But_ if the user is using the device that also has their wallet then they
wouldn't be able to scan a QR code, they would need to be able to click a link
that will open their mobile wallet.

There are of course other use cases where you might need one over the other or
both. For example, in an email you may want to display both a link and a QR code
because you won't be able to dynamically choose between the two.

### Payload

Some mediums do not allow for a large amount of data to be sent (e.g a QR code)
to support those cases the initial payload contains instructions for fetching
the challenge token.

This is payload can be displayed in a QR code or added to a link as a query
parameter.

<tab-panels selected-index="0">

<nav>
  <button type="button">QR</button>
  <button type="button">Link</button>
</nav>

<section>

![QR Code](./resources/qr.png)

</section>

<section>

<a target="_blank" rel="noopener noreferrer" href="https://deep-link-into-app.com/waci?payload=eyJjaGFsbGVuZ2VUb2tlblVybCI6Imh0dHBzOi8vZXhhbXBsZS5jb20vYXBpL2dldC10b2tlbi9mYjI4YjRlYy00MjA5LTRiNzgtODUwNy03Y2M0OTE2NGNiMzciLCJ2ZXJzaW9uIjoiMSJ9">Click Me!</a>

</section>

</tab-panels>

::: example QR/Link Payload

```json
{
  "challengeTokenUrl": "https://example.com/api/get-token/fb28b4ec-4209-4b78-8507-7cc49164cb37",
  "version": "1"
}
```

:::

- `challengeTokenUrl`:
  - MUST be unique to the interaction
  - MUST be a `GET` endpoint that returns the
  [Token Payload](#token-url-response)
- `version`:
  - This is the version of just the QR/link payload, not the rest of the
  interaction

### Token URL Response

The result from `GET`ing the provided `challengeTokenUrl`. This contains the
initial JWT that really starts the interaction.

::: example Token URL Response

```json
{
  "challengeToken": "{{JWT String}}"
}
```

:::

#### Challenge Token

::: example Challenge Token Header

```json
// Header
{
  "alg": "...",
  "kid": "did:example:ebfeb1f712ebc6f1c276e12ec21#primary"
}
```

:::

- MUST have `alg` and `kid`, so the JWT can be verified

::: example Challenge Token Payload

```json
// Payload
{
  "jti": "...",
  "iss": "did:example:ebfeb1f712ebc6f1c276e12ec21",
  "aud": "...",
  "callbackUrl": "https://example.com/api/callback-url",
  "purpose": "...",
  "version": "..."
}
```

:::

- MUST have `iss`
- MUST have `jti` to protect against replay attacks
- CAN have `aud` if the DID of the wallet is known
- MUST have `callbackUrl`
  - MUST be a `POST` endpoint to take the wallet's reponse (payload determined
  by the `purpose`)
- MUST have `purpose`
- MUST have `version`
  - This is specific to the `purpose`

### Callback URL

#### Request

Each interaction will `POST` data to the `callbackUrl`:

::: example Callback URL Request Payload

```json
{
  "responseToken": "{{Signed JWT}}",
  "from": "qr" | "link"
}
```

:::

- `responseToken`
  - A JWT signed by the user, will contain the `challengeToken`
- `from`
  - MUST be either "qr" or "link"
  - The issuer may need to handle things differently based on how the user is
  claiming the credentials

##### Response Token

The response token is signed by the user and acts as a way to prove ownership of
their DID and to pass additional data back to the relying party.

:::example Response Token Header

```json
{
  "alg": "...",
  "kid": "did:example:c276e12ec21ebfeb1f712ebc6f1#primary"
}
```

:::

- MUST have `alg` and `kid`, so the JWT can be verified

:::example Response Token Payload

```json
{
  "iss": "did:example:c276e12ec21ebfeb1f712ebc6f1",
  "aud": "did:example:ebfeb1f712ebc6f1c276e12ec21",
  "challenge": "{{CHALLENGE TOKEN}}"
}
```

:::

- MUST have `iss`
- MUST have `aud`
  - `aud` MUST be the `iss` of the challenge token
- MUST have `challenge`
  - `challenge` MUST be the challenge token given by the issuer

#### Reponse

The `POST` to the provided `callbackUrl` can return with a simple successful
HTTP response or it can return a success with follow up details. A
`redirectLink` that the app will open in a browser or `challengeToken` that will
start a new interaction.

::: example Response Redirect Payload

```json
{
  "redirectUrl": "https://example.com/redirect-url?id={{Some id that identifies the user}}"
}
```

:::

This could be used to show a success message or bring them back to the
website/app to continue where they left off. Most of the time `redirectUrl` will
only be used when the user is already using their phone (see
[above](#qr-code-or-link)).

**OR**

::: example Response Chain Payload

```json
{
  "challengeToken": "{{JWT String}}"
}
```

:::

This could be used to follow up a request interaction with an offer interaction,
or even a chain of request interactions that are based on the previously shared
VCs.

### Token Storage

Because the challenge token is always sent back to the relying party, the token
doesn't need to be stored on creation. And this allows the relying party to not
have to worry about someone spamming their API and driving up their storage
costs.

But no storage at all can lead to replay attacks. One suggested way to mitigate
replay attacks while keeping storage to a minimum is to only store the hash of
"used" tokens and have a cron job that cleans this storage based on expiration
date of the tokens.

### Swimlane

Each interaction will be slightly different but will follow this general pattern:

<tab-panels selected-index="0">

<nav>
  <button type="button">QR Based</button>
  <button type="button">Link Based</button>
</nav>

<section>

```mermaid
sequenceDiagram
  title: Interaction (QR)

  activate Wallet

  Wallet ->>+ Relying Party's Interface: Scan QR Code
  Relying Party's Interface -->>- Wallet: Retrieve `challengeTokenUrl`

  Wallet ->>+ Relying Party: GET `challengeTokenUrl`
  Relying Party -->> Wallet: Return `challengeToken`

  Wallet ->> Wallet: Verify/decode `challengeToken`
  Wallet ->> Wallet: Create/sign a `responseToken`, with `challengeToken` as the `challenge`

  Wallet ->> Relying Party: POST the `responseToken` to `challengeToken`'s `callBackUrl`
  Relying Party ->> Relying Party: Verify the `responseToken`
  Relying Party ->> Relying Party: Verify the `responseToken`'s challenge token (valid JWT, signed by Relying Party, and not used before)
  Relying Party -->>- Wallet: Return success

  opt `redirectUrl` or `challengeToken` is provided
    alt `redirectUrl` is provided
      Wallet ->> Browser: Open `redirectUrl`
    else `challengeToken` is provided
      Wallet ->> Wallet: Start new interaction
    end
  end

  deactivate Wallet
```

</section>

<section>

```mermaid
sequenceDiagram
  title: Interaction (Link)

  User ->>+ Relying Party's Interface: Click link

  Relying Party's Interface ->>- Wallet: Open Wallet with deep link

  activate Wallet

  Wallet ->> Wallet: Parse deep link

  Wallet ->>+ Relying Party: GET `challengeTokenUrl`
  Relying Party -->> Wallet: Return `challengeToken`

  Wallet ->> Wallet: Verify/decode `challengeToken`
  Wallet ->> Wallet: Create/sign a `responseToken`, with `challengeToken` as the `challenge`

  Wallet ->> Relying Party: POST the `responseToken` to `challengeToken`'s `callBackUrl`
  Relying Party ->> Relying Party: Verify the `responseToken`
  Relying Party ->> Relying Party: Verify the `responseToken`'s challenge token (valid JWT, signed by Relying Party, and not used before)
  Relying Party -->>- Wallet: Return success

  opt `redirectUrl` or `challengeToken` is provided
    alt `redirectUrl` is provided
      Wallet ->> Browser: Open `redirectUrl`
    else `challengeToken` is provided
      Wallet ->> Wallet: Start new interaction
    end
  end

  deactivate Wallet
```

</section>

</tab-panels>

## Request/Share

The request/share interaction is for the use case where an verifier wants a user
to share credential(s) with them.

### Challenge Token

An example of a `request` challenge token has the following properties (in
addition to the base [properties](#challenge-token)):

:::example Request Challenge Token Header

```json
// Header
{
  "alg": "...",
  "kid": "did:example:ebfeb1f712ebc6f1c276e12ec21#primary"
}
```

:::

:::example Request Challenge Token Payload

```json
// Payload
{
  "jti": "...",
  "iss": "did:example:ebfeb1f712ebc6f1c276e12ec21",
  "aud": "...",
  "callbackUrl": "https://example.com/api/callback-url",
  "purpose": "request",
  "version": "0.1",
  "presentation_definition": {
    // ...
  }
}
```

:::

- `purpose` MUST be `"request"`
- MUST have `presentation_definition`
  - Uses [Presentation Exchange](https://identity.foundation/presentation-exchange/)
  to define the requirements.

### Callback URL

#### Request

In addition to the standard [Callback URL Request](#request) payload, the
offer/claim flow adds `presentation`

:::example Request Callback URL Request Payload

```json
{
  "responseToken": "{{Signed JWT}}",
  "from": "qr" | "link"
}
```

:::

##### Response Token

In addition to the standard `responseToken` the offer/claim interaction adds
`verifiable_presentation` to the payload.

:::example Request Response Token Header

```json
// Header
{
  "alg": "...",
  "kid": "did:example:c276e12ec21ebfeb1f712ebc6f1#primary"
}
```

:::

:::example Request Response Token Payload

```json
// Paylaod
{
  "iss": "did:example:c276e12ec21ebfeb1f712ebc6f1",
  "aud": "did:example:ebfeb1f712ebc6f1c276e12ec21",
  "challenge": "{{CHALLENGE TOKEN}}",
  "verifiable_presentation": {
    /* ... */
    "type": ["VerifiablePresentation", "PresentationSubmission"],
    "presentation_submission": {
      /* ... */
    }
    /* ... */
  }
}
```

:::

- MUST have `verifiable_presentation`
  - Using Presentation Exchange's
  [Presentation Submission](https://identity.foundation/presentation-exchange/#presentation-submission)
  - This `VerifiablePresentation` MUST be a `PresentationSubmission`
  - This `VerifiablePresentation`'s `proof.challenge` MUST be the challenge
  token given by the issuer

#### Response

The request/share flow does not add anything to the
[Callback URL Response](#response).

### Swimlane

<tab-panels selected-index="0">

<nav>
  <button type="button">QR Based</button>
  <button type="button">Link Based</button>
</nav>

<section>

```mermaid
sequenceDiagram
  title: Request/Share (QR)

  activate Wallet

  Wallet ->>+ Verifier's Interface: Scan QR Code
  Verifier's Interface -->>- Wallet: Retrieve `challengeTokenUrl`

  Wallet ->>+ Verifier: GET `challengeTokenUrl`
  Verifier -->> Wallet: Return `challengeToken`

  Wallet ->> Wallet: Verify/decode `challengeToken`
  Wallet ->> Wallet: Collect VCs that are described in the `challengeToken`s `presentation_definition`
  Wallet ->> Wallet: Create VP containing the VCs, with `challengeToken` as the `challenge`
  Wallet ->> Wallet: Create/sign a `responseToken` containing the VP, with `challengeToken` as the `challenge`

  Wallet ->> Verifier: POST the `responseToken` to `challengeToken`'s `callBackUrl`
  Verifier ->> Verifier: Verify the `responseToken`
  Verifier ->> Verifier: Verify the `responseToken`'s challenge token (valid JWT, signed by verifier, and not used before)
  Verifier -->>- Wallet: Return success

  opt `redirectUrl` or `challengeToken` is provided
    alt `redirectUrl` is provided
      Wallet ->> Browser: Open `redirectUrl`
    else `challengeToken` is provided
      Wallet ->> Wallet: Start new interaction
    end
  end

  deactivate Wallet
```

</section>

<section>

```mermaid
sequenceDiagram
  title: Request/Share (Link)

  User ->>+ Verifier's Interface: Click link

  Verifier's Interface ->>- Wallet: Open Wallet with deep link

  activate Wallet

  Wallet ->> Wallet: Parse deep link

  Wallet ->>+ Verifier: GET `challengeTokenUrl`
  Verifier -->> Wallet: Return `challengeToken`

  Wallet ->> Wallet: Verify/decode `challengeToken`
  Wallet ->> Wallet: Collect VCs that are described in the `challengeToken`s `presentation_definition`
  Wallet ->> Wallet: Create VP containing the VCs, with `challengeToken` as the `challenge`
  Wallet ->> Wallet: Create/sign a `responseToken` containing the VP, with `challengeToken` as the `challenge`

  Wallet ->> Verifier: POST the `responseToken` to `challengeToken`'s `callBackUrl`
  Verifier ->> Verifier: Verify the `responseToken`
  Verifier ->> Verifier: Verify the `responseToken`'s challenge token (valid JWT, signed by verifier, and not used before)
  Verifier -->>- Wallet: Return success

  opt `redirectUrl` or `challengeToken` is provided
    alt `redirectUrl` is provided
      Wallet ->> Browser: Open `redirectUrl`
    else `challengeToken` is provided
      Wallet ->> Wallet: Start new interaction
    end
  end

  deactivate Wallet
```

</section>

</tab-panels>

## DIDComm v2 Messages

The exchange specified in the [DIDComm v2
specification](https://identity.foundation/didcomm-messaging/spec/) is presumed
to take place between two subjects that control DIDs with certain properties,
and can take place over many different transports.  The establishment of a
DIDComm channel with a DIDComm v2-conformant holder or verifier requires
starting from a conformant DID and establishing a channel using "[peer
DIDs](https://identity.foundation/peer-did-method-spec/#overview)" (i.e. local,
off-chain DIDs to encapsulate a peer relationship) and Aries-style "mediators"
for routing.  For an introduction to mediators, see [Aries RFC
0046](https://github.com/hyperledger/aries-rfcs/blob/master/concepts/0046-mediators-and-relays/README.md)
and for a treatment of cross-vendor interoperability for mediators and wallets,
see [Aries RFC
0211](https://github.com/hyperledger/aries-rfcs/blob/master/features/0211-route-coordination/README.md).
For differences between mediator routing in DIDComm v1 and v2, see explanatory
[Aries RFC
0496](https://github.com/hyperledger/aries-rfcs/tree/master/features/0496-transition-to-oob-and-did-exchange).

The examples in this section show and explain such a flow, step by step.

### Opening a DIDComm v2 connection over HTTP(S)

#### Service block expected in DID Documents for DIDComm

Both parties MUST have a `service` block containing the following properties:

```json
"service": [{
    "id": "did:example:123123123#someid",
    "type": "DIDCommMessaging",
    "serviceEndpoint": "https://example.com/endpoint",
    "routingKeys": ["did:example:somemediator#somekey"]
  }]
``` 

TODO: Explain routing keys. Each property and normative status:
- service block must be present
- `id` MUST contain a unique id
- `type` MUST be `DIDCommMessaging`
- `serviceEndpoint` MUST be a resolvable URI
- `routingKeys` MUST contain valid routing keys (ref directly to DIDComm spec section about routing keys)

#### Establishing an HTTP(S) Connection

The assumptions and requirements for using an HTTP(S) connection for sending,
routing, and receiving DIDComm packets are described in the [HTTP(S)
section](https://identity.foundation/didcomm-messaging/spec/#https) of the
DIDComm v2 specification.

### Message 0 - Propose Presentation

A "Propose Presentation" message, optional in many cases, is defined in [Aries
RFC
0454](https://github.com/hyperledger/aries-rfcs/tree/master/features/0454-present-proof-v2#messages)
and its Presentation Exchange "attachment" defined in [RFC
0510](https://github.com/hyperledger/aries-rfcs/blob/master/features/0510-dif-pres-exch-attach/README.md#propose-presentation-attachment-format).
It either initiates a Request/Share interaction or answers an earlier invitation
to do so; it can be functionally equivalent to the request for a challenge token
in the [challenge token section](#challenge-token-2) above:

```json
{
    "type": "https://didcomm.org/present-proof/3.0/propose-presentation",
    "id": "43f3a34d-9137-42b1-9404-efa9bfbf5cfd",
    "from": "did:example:prover",
    "to": "did:example:verifier",
    "body": {},
    "attachments": [
      {
        "format": "dif/presentation-exchange/definitions@v1.0",
        "@id": "47e3d077-d1a6-447d-8031-8f813a715be9",
        "mime-type": "application/json",
        "data": {
            "json": "<json>"
        }
      }
    ]
}
```

Note: `id`s can be any arbitrary string used to identify each message, such as a
UUID or a hash, but the `id` of each message should be included as `pthid`
("parent id") in each response to chain messages. In the above example, `id` of
the message that established a connection could be used; `id` could also be
blank if this message were the first one over the channel and a connection had
been established otherwise.

### Message 1 - Request Presentation

The [v2] request for a Verifiable Presentation is defined in the "request
presentation" section of [Aries RFC
0454](https://github.com/hyperledger/aries-rfcs/tree/master/features/0454-present-proof-v2#request-presentation)
and the attachment format for Presentation Exchange objects is defined in [Aries
RFC
0510](https://github.com/hyperledger/aries-rfcs/blob/master/features/0510-dif-pres-exch-attach/README.md#request-presentation-attachment-format).
The challenge token that the holder will use to generate a replay-resistant VP
is included in the the `options` object within the `dif` object, encoded as a
DIDComm attachment:

```json
{
  "type": "https://didcomm.org/present-proof/3.0/request-presentation",
  "id": "0ac534c8-98ed-4fe3-8a41-3600775e1e92",
  "from": "did:example:verifier",
  "to": "did:example:prover",
  "body": {},
  "attachments": [
    {
      "@id": "ed7d9b1f-9eed-4bde-b81c-3aa7485cf947",
      "mime-type": "application/json",
      "format": "dif/presentation-exchange/definitions@v1.0",
      "data": {
        "json": {
          "dif": {
            "options": {
              "challenge": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
              "domain": "4jt78h47fh47"
            },
            "presentation_definition": {
              "frame": {
                  "@context": [
                    "https://www.w3.org/2018/credentials/v1",
                    "https://w3id.org/vaccination/v1",
                    "https://w3id.org/security/suites/bls12381-2020/v1"
                  ],
                  "type": ["VerifiableCredential", "VaccinationCertificate"],
                  "credentialSubject": {
                    "@explicit": true,
                    "type": ["VaccinationEvent"],
                    "batchNumber": {},
                    "countryOfVaccination": {}
                  }
                },
                "input_descriptors": [
                  {
                    "id": "vaccination_input",
                    "name": "Vaccination Certificate",
                    "schema": "https://w3id.org/vaccination/#VaccinationCertificate",
                    "constraints": {
                      "fields": [
                        {
                          "path": ["$.credentialSubject.batchNumber"],
                          "filter": {
                            "type": "string"
                          }
                        },
                        {
                          "path": ["$.credentialSubject.countryOfVaccination"],
                          "filter": {
                            "type": "string"
                          }
                        }
                      ]
                    }
                  }
                ]
            }
          }
        }
      }
    }
  ]
}
```

For context on the Vaccination object passed, see the W3C-CCG [Vaccination
Vocabulary](https://w3c-ccg.github.io/vaccination-vocab/), from which the
example is drawn.

### Message 2 - Present Proof

The Verifiable Presentation is again returned as an attachment (defined by [RFC
0510](https://github.com/hyperledger/aries-rfcs/blob/master/features/0510-dif-pres-exch-attach/README.md#presentation-attachment-format))
to a DIDComm
[present-proof](https://github.com/hyperledger/aries-rfcs/tree/master/features/0454-present-proof-v2#presentation)
message.  Note the `challenge` from the previous message is given in the `proof`
object for the VP and used to generate the signature there.

```json
{
  "type": "https://didcomm.org/present-proof/3.0/presentation",
  "id": "f1ca8245-ab2d-4d9c-8d7d-94bf310314ef",
  "from": "did:example:verifier",
  "to": "did:example:prover",
  "body": {},
  "attachments": [
    {
      "@id": "2a3f1c4c-623c-44e6-b159-179048c51260",
      "mime-type": "application/ld+json",
      "format": "dif/presentation-exchange/submission@v1.0",
      "data": {
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://identity.foundation/presentation-exchange/submission/v1"
        ],
        "type": [
          "VerifiablePresentation",
          "PresentationSubmission"
        ],
        "holder": "did:example:123",
        "verifiableCredential": [
          {
            "@context": [
              "https://www.w3.org/2018/credentials/v1",
              "https://w3id.org/vaccination/v1",
              "https://w3id.org/security/bbs/v1"
            ],
            "id": "urn:uvci:af5vshde843jf831j128fj",
            "type": [
              "VaccinationCertificate",
              "VerifiableCredential"
            ],
            "description": "COVID-19 Vaccination Certificate",
            "name": "COVID-19 Vaccination Certificate",
            "expirationDate": "2029-12-03T12:19:52Z",
            "issuanceDate": "2019-12-03T12:19:52Z",
            "issuer": "did:example:456",
            "credentialSubject": {
              "id": "urn:bnid:_:c14n2",
              "type": "VaccinationEvent",
              "batchNumber": "1183738569",
              "countryOfVaccination": "NZ"
            },
            "proof": {
              "type": "BbsBlsSignatureProof2020",
              "created": "2021-02-18T23:04:28Z",
              "nonce": "JNGovx4GGoi341v/YCTcZq7aLWtBtz8UhoxEeCxZFevEGzfh94WUSg8Ly/q+2jLqzzY=",
              "proofPurpose": "assertionMethod",
              "proofValue": "AB0GQA//jbDwMgaIIJeqP3fRyMYi6WDGhk0JlGJc/sk4ycuYGmyN7CbO4bA7yhIW/YQbHEkOgeMy0QM+usBgZad8x5FRePxfo4v1dSzAbJwWjx87G9F1lAIRgijlD4sYni1LhSo6svptDUmIrCAOwS2raV3G02mVejbwltMOo4+cyKcGlj9CzfjCgCuS1SqAxveDiMKGAAAAdJJF1pO6hBUGkebu/SMmiFafVdLvFgpMFUFEHTvElUQhwNSp6vxJp6Rs7pOVc9zHqAAAAAI7TJuDCf7ramzTo+syb7Njf6ExD11UKNcChaeblzegRBIkg3HoWgwR0hhd4z4D5/obSjGPKpGuD+1DoyTZhC/wqOjUZ03J1EtryZrC+y1DD14b4+khQVLgOBJ9+uvshrGDbu8+7anGezOa+qWT0FopAAAAEG6p07ghODpi8DVeDQyPwMY/iu2Lh7x3JShWniQrewY2GbsACBYOPlkNNm/qSExPRMe2X7UPpdsxpUDwqbObye4EXfAabgKd9gCmj2PNdvcOQAi5rIuJSGa4Vj7AtKoW/2vpmboPoOu4IEM1YviupomCKOzhjEuOof2/y5Adfb8JUVidWqf9Ye/HtxnzTu0HbaXL7jbwsMNn5wYfZuzpmVQgEXss2KePMSkHcfScAQNglnI90YgugHGuU+/DQcfMoA0+JviFcJy13yERAueVuzrDemzc+wJaEuNDn8UiTjAdVhLcgnHqUai+4F6ONbCfH2B3ohB3hSiGB6C7hDnEyXFOO9BijCTHrxPv3yKWNkks+3JfY28m+3NO0e2tlyH71yDX0+F6U388/bvWod/u5s3MpaCibTZEYoAc4sm4jW03HFYMmvYBuWOY6rGGOgIrXxQjx98D0macJJR7Hkh7KJhMkwvtyI4MaTPJsdJGfv8I+RFROxtRM7RcFpa4J5wF/wQnpyorqchwo6xAOKYFqCqKvI9B6Y7Da7/0iOiWsjs8a4zDiYynfYavnz6SdxCMpHLgplEQlnntqCb8C3qly2s5Ko3PGWu4M8Dlfcn4TT8YenkJDJicA91nlLaE8TJbBgsvgyT+zlTsRSXlFzQc+3KfWoODKZIZqTBaRZMft3S/",
              "verificationMethod": "did:example:123#key-1"
            }
          }
        ],
        "presentation_submission": {
          "id": "1d257c50-454f-4c96-a273-c5368e01fe63",
          "definition_id": "32f54163-7166-48f1-93d8-ff217bdb0654",
          "descriptor_map": [
            {
              "id": "vaccination_input",
              "format": "ldp_vp",
              "path": "$.verifiableCredential[0]"
            }
          ]
        },
        "proof": {
          "type": "Ed25519Signature2018",
          "verificationMethod": "did:example:123#key-0",
          "created": "2021-05-14T20:16:29.565377",
          "proofPurpose": "authentication",
          "challenge": "3fa85f64-5717-4562-b3fc-2c963f66afa7",
          "jws": "eyJhbGciOiAiRWREU0EiLCAiYjY0IjogZmFsc2UsICJjcml0IjogWyJiNjQiXX0..7M9LwdJR1_SQayHIWVHF5eSSRhbVsrjQHKUrfRhRRrlbuKlggm8mm_4EI_kTPeBpalQWiGiyCb_0OWFPtn2wAQ"
        }
      }
    }
  ]
}
```

For context on the Vaccination object passed, see the W3C-CCG [Vaccination
Vocabulary](https://w3c-ccg.github.io/vaccination-vocab/), from which the
example is drawn.

## Appendix

### Out of Scope
The following are items that were considered "out of scope" for v0.1, but which
may be considered for future versions:

1. 
