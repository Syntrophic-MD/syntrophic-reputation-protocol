# Hackathon 4-Minute Voiceover Script

This presentation is about a specific onboarding problem: ERC-8004 onboarding.

A new agent may be able to register an identity, but that does not automatically make it trusted, discoverable, or easy to launch on-chain.

Syntrophic turns that into one guided flow.

The first issue is the ERC-8004 onboarding gap.

Identity alone does not tell another app that this agent has made any economic commitment, and the owner still faces too many manual steps to get from profile draft to a useful trust result.

Syntrophic is designed so the owner gives only the minimum necessary input: beneficiary wallet, name, description, service URL, and optionally an image.

The agent can gather that, confirm it, and do the rest on the owner’s behalf.

Reputation staking is the core trust primitive.

The owner bonds value against the ERC-8004 agent ID, so trust is not just descriptive. It is economically meaningful.

If the agent behaves badly, the trust system can update score and enforce slashing rules. The result is written back into portable `syntrophic.*` metadata.

x402 is what makes the launch usable.

Instead of asking the owner to perform several different chain actions, Syntrophic can take one x402 payment step that covers ERC-8004 registration, reputation staking, gas, storage, and the service fee, then complete the sponsored launch.

This project was itself a co-creation between the Syntrophic agent and its owner.

The owner defined goals, constraints, and direction. The Syntrophic agent helped write, test, document, and present the system.

That is important because the product is designed for the same owner-agent collaboration pattern it demonstrates.

Now we open the live site.

The homepage gives the public entry point.

The user sends one simple instruction to their agent: use `syntrophic.md/skill.md` to get a Syntrophic verified badge.

The public skill then explains what Syntrophic is for, what minimum information to request, and how to move from profile draft to quote to verification without inventing profile data.

On the onboarding page, we prepare the profile and create the quote.

This is the website surface that easily onboards new OpenClaw-like agents on-chain with ERC-8004 and x402 payments.

Then we open the explorer.

This is where the result becomes useful. Newly onboarded agents can be discovered, filtered, and inspected in one public interface.

Next we open the verification page.

Each onboarded agent gets a public verification page that shows identity, Syntrophic status, trust context, and a reusable verification line.

Then we show the proof summary.

The trust signal is not just visual. It is backed by an agent ID, transaction hash, bonded state, and public verification URL.

If you want the deeper protocol model, the ERC draft is linked directly on the site.

That draft explains the reputation staking design, the metadata surface, and the sponsored onboarding flow in more technical detail.

Finally, we show the future extension.

The next step is to let an agent pay once and complete onboarding across multiple chains in one guided flow, while still asking the owner for only the minimum necessary input.

Syntrophic makes ERC-8004 onboarding understandable, agent-led, and economically meaningful.

The owner gives minimal input. The agent does the work. One x402 payment step handles the launch. Reputation staking makes trust visible from day zero.
