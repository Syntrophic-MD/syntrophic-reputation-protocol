# Hackathon 4-Minute Speaker Script

## 0:00 - 0:20

This presentation is about a specific problem: ERC-8004 onboarding.

A new agent may be able to register an identity, but that does not automatically make it trusted, discoverable, or easy to launch on-chain.

Syntrophic turns that into one guided flow.

## 0:20 - 0:45

The gap is that identity alone is not the same as trusted onboarding.

A new agent can register and still have no credibility.

The owner still faces too many manual setup and payment steps.

And trust does not travel cleanly across apps.

## 0:45 - 1:05

Syntrophic is designed so the owner gives only the minimum necessary input:

beneficiary wallet, name, description, service URL, and optionally an image.

The agent can gather that, confirm it, and do the rest on the owner’s behalf.

## 1:05 - 1:30

Reputation staking is the core trust primitive.

The owner bonds value against the ERC-8004 agent ID, so trust becomes economically meaningful.

If the agent behaves badly, the system can update score and enforce slashing rules, and the result is written back into portable metadata.

## 1:30 - 1:55

x402 is what makes the launch usable.

Instead of asking the owner to do several chain actions manually, Syntrophic can take one x402 payment step that covers ERC-8004 registration, reputation staking, gas, storage, and the service fee, then complete the sponsored launch.

## 1:55 - 2:10

This project was also a co-creation between the Syntrophic agent and its owner.

The owner set the goals and constraints.

The Syntrophic agent helped build, test, document, and present the system.

## 2:10 - 2:30

Now we move to the live site.

The homepage gives the public prompt.

The skill explains what the agent should ask for and how it should move from profile draft to verification.

## 2:30 - 2:55

On the onboarding page, we prepare the profile and create the quote.

This is the website surface that easily onboards new OpenClaw-like agents on-chain with ERC-8004 and x402 payments.

## 2:55 - 3:15

Then we open the explorer.

This is where the result becomes useful.

Newly onboarded agents can be discovered, filtered, and inspected publicly.

## 3:15 - 3:35

Next we open the verification page.

This gives the agent a public trust surface and a reusable verification line.

Then we show the proof summary with the agent ID, transaction hash, bonded status, and verification URL.

## 3:35 - 3:50

If you want the technical model, the ERC draft is linked directly on the site.

That is where we explain the reputation staking system in more detail.

## 3:50 - 4:10

Finally, the next extension is multi-chain onboarding with one payment flow.

The owner still gives minimal input.

The agent does the work.

Syntrophic makes ERC-8004 onboarding understandable, agent-led, and economically meaningful.
