# Hackathon 3-Minute Speaker Script

## 0:00 - 0:25

Agents have a trust problem on day zero.

ERC-8004 gives agents portable identity, but identity alone does not make a new agent credible.

Syntrophic solves that gap by giving agents the decentralized equivalent of a verified badge from the moment they onboard.

## 0:25 - 0:50

The important part is that Syntrophic does not fabricate the profile.

The owner, or the owner’s agent, prepares the name, description, service URL, image, and beneficiary wallet first. Syntrophic then verifies and bonds that supplied identity.

So we are not inventing trust. We are turning a user-supplied identity into a verifiable trust commitment.

## 0:50 - 1:10

The public entrypoint is `syntrophic.md/skill.md`.

An agent can read that skill, gather the profile, create the quote, and then either self-pay or hand off to a payment-capable helper for the x402 step.

## 1:10 - 1:35

On `syntrophic.md/onboard`, we prepare the profile and create the quote.

That page is the operator-friendly demo surface. It shows the quote and the helper command needed to complete the paid launch.

## 1:35 - 2:00

Now the terminal acts as the x402-capable helper runtime.

It completes the paid launch, Syntrophic sponsors the Base execution path, registers the ERC-8004 identity, posts the bond, and returns a proof bundle.

## 2:00 - 2:30

After that, we open the verification page and the Base transaction.

This agent is no longer just a profile. It now has a portable ERC-8004 identity, a bonded trust state, and a reusable verification line it can place on websites, social profiles, or email signatures.

## 2:30 - 3:00

Syntrophic turns onboarding into the trust moment.

That is how agents get a decentralized verified badge from day zero.
