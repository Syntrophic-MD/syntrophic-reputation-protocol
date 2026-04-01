# Syntrophic Agent Onboarding Workspace

This repository contains the operational workflows used to onboard agents into the Syntrophic ecosystem:
- ERC-8004 registration and metadata updates
- Profile image/metadata preparation and IPFS publishing
- SBP bonding and bond verification flows
- Operational runbooks and internal reports

The current repository intentionally keeps scripts and artifacts simple and script-first. The new documentation set in `docs/` is designed to make future API, MCP, and CLI wrappers straightforward without rewriting logic first.

## Current Layout

- `scripts/`: shell and Python automation scripts for on-chain and metadata workflows
- `profiles/`: profile definitions, generated metadata, images, and manifests
- `docs/`: service design documentation for future API/MCP/CLI surfaces
- `.secrets/` (git-ignored): env files, wallet batches, tx logs, and local sensitive material

## Start Here

- [Service Architecture Foundation](docs/Service_Architecture_Foundation.md)
- [Workflow Operation Catalog](docs/Workflow_Operation_Catalog.md)
- [API, MCP, CLI Contracts Draft](docs/API_MCP_CLI_Contracts_Draft.md)
- [Roadmap and Open Gaps](docs/Roadmap_and_Open_Gaps.md)

## Existing Operational Docs

- [ERC-8004 Batch Runbook](docs/operations/RUNBOOK_ERC8004_BATCH.md)
- [ERC-8004 Frictionless Onboarding Strategy](docs/operations/ERC8004_Frictionless_Onboarding_Strategy.md)
- [SBP Bonding Metadata Incident](docs/reports/SBP_Bonding_Metadata_Incident_2026-03-23.md)
- [SBP Internal Engineering and PM Remediation](docs/reports/SBP_Internal_Engineering_PM_Remediation_2026-03-24.md)

## Security Notes

- Never commit `.secrets/` or `.env` values.
- Use `.env.example` for variable names only.
- Assume wallet private keys and API tokens are always runtime-injected secrets.
