# 🧬 Syntrophic.md Website Development Brief

## Goal
Build a modern web application for **Syntrophic.md** that serves as the definitive explorer and discovery platform for ERC-8004 agents enhanced with Syntrophic's decentralized reputation staking system. The platform should enable users to discover, browse, and verify AI agents based on their on-chain identity, stake amounts, reputation scores, and cryptographic attestations - creating the trust infrastructure for the billion-agent internet.

## High-Level Instructions
Develop a **Next.js 15** application with **TypeScript**, **Tailwind CSS**, and **Prisma** that integrates with both official ERC-8004 registries and Syntrophic's reputation contracts on Base network. The frontend should feature an agent discovery interface with advanced search and filtering capabilities (by stake amount, reputation score, trust level), individual agent profile pages displaying comprehensive reputation data and stake attestations, real-time updates via blockchain indexing, and a clean, modern UI that emphasizes trust signals and cryptographic verification. Implement Web3 connectivity using **viem/wagmi** for reading contract data, create a responsive design optimized for both desktop and mobile, and ensure the platform works seamlessly across multiple EVM chains with Base as the primary focus.

## Resource List

### **Smart Contract References**
- **Official ERC-8004 Contracts:** https://github.com/erc-8004/erc-8004-contracts (deployed on Base Sepolia: IdentityRegistry `0x8004A818BFB912233c491871b3d84c89A494BD9e`, ReputationRegistry `0x8004B663056A597Dffe9eCcC1965A193B7388713`)
- **Syntrophic Contracts:** Base Sepolia SyntrophicRegistry `0xFd51f2D5477FB7Af13f3654CFdAc990095Ce7Ab9`, MockERC8004 `0x56eAFa41dA67E59C0dd87EEd60a196a3AF9B9435`
- **Contract Documentation:** `~/code/syntrophic/docs/REFERENCES.md` with complete deployment addresses and integration patterns

### **Development Resources**
- **Agent0 TypeScript SDK:** https://github.com/agent0lab/agent0-ts (production ERC-8004 SDK with examples)
- **Awesome ERC-8004:** https://github.com/sudeepb02/awesome-erc8004 (comprehensive resource hub)
- **Content Specification:** `~/code/the-synthesys/landing-page/CONTENT.md` (complete website structure and design requirements)
- **Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, viem/wagmi, Prisma/PostgreSQL, RainbowKit for wallet connectivity

### **Design & UX References**
- **8004scan.io:** https://www.8004scan.io/ (UI/UX inspiration for agent browsing)
- **AgentSniff Dashboard:** https://agentsniff.org (professional dashboard patterns)
- **Visual Requirements:** Clean, modern interface with molecular/DNA-inspired graphics, trust-focused design emphasizing stake verification and cryptographic proofs
- **Color Scheme:** Deep blue primary, electric blue secondary, bright green accents for verification states

### **Integration Examples**
- **Live Demo Data:** Email attestation in `~/code/syntrophic/docs/demo/agent-email-communication.md`
- **Attestation Utils:** `~/code/syntrophic/scripts/attestation-utils.ts` (EIP-712 signature generation and verification)
- **Demo Summary:** `~/code/syntrophic/DEMO_EXECUTION_SUMMARY.md` (working implementation examples)

### **Key Features to Implement**
- **Agent Discovery:** Search and filter by name, stake amount (>0.001 ETH), reputation score, trust signals
- **Agent Profiles:** Individual pages showing ERC-8004 identity, Syntrophic stake data, reputation history, attestation viewer
- **Real-time Updates:** Blockchain event monitoring for new registrations and stake changes
- **Attestation Verification:** Display and verify EIP-712 signatures with Basescan integration
- **Multi-chain Support:** Base mainnet/testnet initially, extensible to other EVM chains

The goal is to create the **definitive platform** for discovering trustworthy AI agents in a decentralized manner, proving that reputation can scale to billions of agents without central authorities. 🚀
