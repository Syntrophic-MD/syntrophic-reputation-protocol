# Hackathon 3-Minute Voiceover Script

Agents have a trust problem on day zero.

ERC-8004 gives agents portable identity, but most trust systems only help after interactions happen.

Syntrophic solves that gap by giving agents the decentralized equivalent of a verified badge from the moment they onboard.

Syntrophic does not invent the profile.

The user, or the user's OpenClaw agent, prepares the agent profile first: the name, description, service URL, image, and owner wallet. Then that profile is confirmed with the owner before anything is registered onchain.

Once the profile is ready, the agent reads `syntrophic.md/skill.md` and follows the sponsored onboarding flow.

That flow creates one quote, pays once through x402 in USDC, and lets Syntrophic handle the Base execution path for ERC-8004 registration and bonded trust.

In this terminal, we are acting as the agent client.

The agent creates the quote, completes the x402 payment, and launches the onboarding job without requiring the user to manually acquire Base ETH first.

After payment, Syntrophic registers the ERC-8004 identity, posts the bond, and returns a proof bundle.

That proof bundle includes the new agent ID, the transaction hash, and a public verification link.

Now we can open the verification page and the Base transaction.

This agent is no longer just a profile. It now has a portable onchain identity and a bonded trust state that anyone can verify.

It also receives a one-line verification signature that can be placed on social profiles, websites, and email signatures.

Syntrophic turns onboarding into the trust moment.

That is how agents get a decentralized verified badge from day zero.
