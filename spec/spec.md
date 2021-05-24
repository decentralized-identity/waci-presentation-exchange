# Wallet And Credential Interactions

> WACI [__wak__-ee]

**Specification Status:** Draft

**Editors:**
~ [Afshan Aman](https://www.linkedin.com/in/afshan-aman/) (Bloom)
~ [Eddie Hedges](https://www.linkedin.com/in/eddiehedges/) (Bloom)

**Contributors:**
~ [Jace Hensley](https://www.linkedin.com/in/jacehensley/) (Bloom)

**Participate:**
~ [GitHub repo](https://github.com/hellobloom/wallet-and-credential-interactions)
~ [File a bug](https://github.com/hellobloom/wallet-and-credential-interactions/issues)
~ [Commit history](https://github.com/hellobloom/wallet-and-credential-interactions/commits/master)

---

## Abstract

There are interactions between a wallet and relying party that require passing information between the two. WACI provides a standard for these interactions.

## Status of This Document

WACI is a draft specification under development by Bloom and Affinidi.

## Interactions

All interactions use the same common blocks:

### QR Code or Link

Two ways of initiating an interaction is for the relying party to display either a QR code or a link to the user. There could be other ways to initiate an interaction but this document will be discussing QR codes and links.

If the user is using an app/webiste on something other than the device that their wallet is on, then they would be able to scan a QR code with the wallet. _But_ if the user is using the device that also has their wallet then they wouldn't be able to scan a QR code, they would need to be able to click a link that will open their mobile wallet.

There are of course other use cases where you might need one over the other or both. For example, in an email you may want to display both a link and a QR code because you won't be able to dynamically choose between the two.

### Payload

Some mediums do not allow for a large amount of data to be sent (e.g a QR code) to support those cases the initial payload contains instructions for fetching the challenge token.

This is payload can be displayed in a QR code or added to a link as a query parameter.

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
  - MUST be a `GET` endpoint that returns the [Token Payload](#token-url-response)
- `version`:
  - This is the version of just the QR/link payload, not the rest of the interaction

### Token URL Response

The result from `GET`ing the provided `challengeTokenUrl`. This contains the initial JWT that really starts the interaction.

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
  - MUST be a `POST` endpoint to take the wallet's reponse (payload determined by the `purpose`)
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
  - The issuer may need to handle things differently based on how the user is claiming the credentials

##### Response Token

The response token is signed by the user and acts as a way to prove ownership of their DID and to pass aditional data back to the relying party.

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

The `POST` to the provided `callbackUrl` can return with a simple successful HTTP response or it can return a success with follow up details. A `redirectLink` that the app will open in a browser or `challengeToken` that will start a new interaction.

::: example Response Redirect Payload

```json
{
  "redirectUrl": "https://example.com/redirect-url?id={{Some id that identifies the user}}"
}
```

:::

This could be used to show a success message or bring them back to the website/app to continue where they left off. Most of the time `redirectUrl` will only be used when the user is already using their phone (see [above](#qr-code-or-link)).

**OR**

::: example Response Chain Payload

```json
{
  "challengeToken": "{{JWT String}}"
}
```

:::

This could be used to follow up a request interaction with an offer interaction, or even a chain of request interactions that are based on the previously shared VCs.

### Token Storage

Because the challenge token is always sent back to the relying party, the token doesn't need to be stored on creation. And this allows the relying party to not have to worry about someone spamming their API and driving up their storage costs.

But no storage at all can lead to replay attacks. One suggested way to mitigate replay attacks while keeping storage to a minimum is to only store the hash of "used" tokens and have a cron job that cleans this storage based on expiration date of the tokens.

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

The request/share interaction is for the use case where an verifier wants a user to share credential(s) with them.

### Challenge Token

An example of a `request` challenge token has the following properties (in addition to the base [properties](#challenge-token)):

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
  - Uses [Presentation Exchange](https://identity.foundation/presentation-exchange/) to define the requirements

### Callback URL

#### Request

In addition to the standard [Callback URL Request](#request) payload, the offer/claim flow adds `presentation`

:::example Request Callback URL Request Payload

```json
{
  "responseToken": "{{Signed JWT}}",
  "from": "qr" | "link"
}
```

:::

##### Response Token

In addition to the standard `responseToken` the offer/claim interaction adds `verifiable_presentation` to the payload.

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
  - Using Presentation Exchange's [Presentation Submission](https://identity.foundation/presentation-exchange/#presentation-submission)
  - This `VerifiablePresentation` MUST be a `PresentationSubmission`
  - This `VerifiablePresentation`'s `proof.challenge` MUST be the challenge token given by the issuer

#### Response

The request/share flow does not add anything to the [Callback URL Response](#response).

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

## Credential Manifest (Working Copy)

Because the [Credential Manifest spec](https://identity.foundation/credential-manifest) is just a strawman at the moment we will rely on a "frozen" copy of the spec outline below. The WACI spec will not be considered stable until the Credential Manifest spec is, but we want to be able to implement early prototypes against something so we need a version of the spec to base it off of.

This is the CM spec as of 02/22/2021.

Alterations in the spec are colored in <span style="color:darkgreen;">green</span>

</section>
