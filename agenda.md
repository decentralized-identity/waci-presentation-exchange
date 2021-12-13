# WACI-PEx for C&C WG

[![hackmd-github-sync-badge](https://hackmd.io/6vK3iMaETna1QGipK5QvbQ/badge)](https://hackmd.io/6vK3iMaETna1QGipK5QvbQ)

*Note: If you are viewing this on github and it seems out of date, try clicking the above link, hackmd may hold more recent content not yet approved/cleaned by WI editors/WG chairs for syncing to github archival records.*

{ [Meeting Recordings](https://docs.google.com/spreadsheets/d/1wgccmMvIImx30qVE9GhRKWWv3vmL2ZyUauuKx3IfRmA/edit#gid=1791597999) }

## 11/29

Agenda:
- PR #124 and related discussion topics
- live demo of what PR #124 enables from SecureKey-- a redirect-enabled [complete flow](https://github.com/trustbloc/sandbox/blob/main/docs/demo/duty-free-shop-usecase.md)!

Minutes
- PR #124
    - DIDComm v2 just merged a PR for the "redirectURL" property; this WACI-PEx PR merges in language about attaching a redirectUrl to the ACK message at the end of the flow
- Demo: SecureKey's recent prototype... first at natural speed, then showing how each step maps to WACI-PEx messages and their contents!
    - note: OOB --> Base64-encoded URL as described in [DIDComm v2 spec](https://identity.foundation/didcomm-messaging/spec/#invitation-httpsdidcommorgout-of-band20invitation) and mentioned in [WACI-PEx OOB step](https://identity.foundation/waci-presentation-exchange/#step-1-generate-out-of-band-oob-message)
    - Dmitry: Base64 only, not multi-base? Orie: Take it up[stream] with the DIDComm bois, bub.
- Dmitry: This reminds me of the IIW33 [slides](https://docs.google.com/presentation/d/1ki2VMtW1yZnWlomyeoYCIfrkLhb2Qb7Kb5sNQOiLYnY/edit#slide=id.p): Prisoner's Dilemma of QR handling (URL versus JSON blob parsing)
- Orie: [VC-API](https://w3c-ccg.github.io/vc-api/#architecture-overview) and w3c-ccg/Trace-vocab needs
    - Orie: Demo [here](https://api.did.actor/docs) and ["Verifiable Business Cards"](https://w3c-ccg.github.io/traceability-vocab/#VerifiableBusinessCard) (VP Req Spec query syntax)
    - Dmitry: GH VC-API Issue [here](https://github.com/w3c-ccg/vc-api/issues/245)
        - Forthcoming demo: VC-Request+CHAPI extended (with a little "continue-interaction" inspo from GNAP) 
- OIDC equiv? 
    - Dmitry: openid:// deep link can be handled cross-device IF they have an openid://-enabled app (Orie: I thought iOS wouldn't let you handle custom protocol handler? Dmitry: there are warning messages but you technically still can! Orie: but can you set a custom PH to a PWA? I think not! Dmitry: Hmmm, not sure-- but the OIDF folks are aware of this limitation and aren't happy about it, bemoaning it in SIOPv2 spec)
        - Rolson: Custom PH has a security issue-- doesn't default to oldest OR newest app that handles a protocol... dangerously undefined!
        - Orie: OIDF people are looking at PresEx... VC-API could use PresEx (DIDComm or OIDF) or VP Req Spec (CHAPI only)
    
