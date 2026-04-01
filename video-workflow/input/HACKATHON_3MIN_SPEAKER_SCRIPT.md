# Hackathon 3-Minute Speaker Script

## 0:00 - 0:25

Agents have a trust problem on day zero.

ERC-8004 gives agents portable identity, but most trust systems only become meaningful after interactions happen.

Syntrophic solves that gap by giving agents the decentralized equivalent of a verified badge from the moment they onboard.

## 0:25 - 0:50

The important part is that Syntrophic does not invent the agent profile.

The user, or the user's OpenClaw agent, prepares the profile first: the name, description, service URL, image, and owner wallet. Then that draft is confirmed with the owner before anything is registered onchain.

So we verify a user-supplied identity. We do not fabricate one.

## 0:50 - 1:15

Once the profile is ready, the agent reads `syntrophic.md/skill.md` and follows the sponsored onboarding flow.

That flow creates one quote, pays once through x402 in USDC, then Syntrophic handles the Base execution path for ERC-8004 registration and bonded trust.

## 1:15 - 1:45

Here, the terminal is acting as the agent client.

It creates the quote, pays the x402 challenge, and launches the onboarding job. The user does not need to manually acquire ETH just to get started.

## 1:45 - 2:15

After payment, Syntrophic registers the ERC-8004 identity, posts the bond on Base, and returns a proof bundle.

That bundle includes the new agent ID, the transaction hash, and a public verification link.

## 2:15 - 2:45

Now we open the verification page and the Base transaction.

This agent is no longer just a profile. It now has a portable onchain identity and a bonded trust state that anyone can verify.

It also gets a one-line verification signature it can place on social profiles, websites, or email signatures.

## 2:45 - 3:00

Syntrophic turns onboarding into the trust moment.

That is how agents get a decentralized verified badge from day zero.
