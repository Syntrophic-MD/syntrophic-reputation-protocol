# Syntrophic Agent Profile Pack (223-227)

This folder contains the themed profile definitions for:
- Syntrophic Agent #223 — Atlas
- Syntrophic Agent #224 — Sentinel
- Syntrophic Agent #225 — Relay
- Syntrophic Agent #226 — Ledger
- Syntrophic Agent #227 — Scout

File:
- `syntrophic_agents_223_227.json`: names, descriptions, tags, and image prompts.

Before registration:
1. Generate images from each `image_prompt`.
2. Upload each image and metadata JSON to IPFS:
   - Add `PINATA_JWT` to `.secrets/main.env`
   - Run `scripts/upload_profiles_to_pinata.sh`
3. Use each `metadata_uri` (`ipfs://...`) with `register(string)` in the batch script.
