#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

ENV_FILE=".secrets/main.env"
PROFILES_FILE="profiles/syntrophic_agents_223_227.json"

usage() {
  cat <<'EOF'
Usage:
  scripts/upload_profiles_to_pinata.sh [--env-file <path>] [--profiles-file <path>]

Requirements in env file:
  PINATA_JWT=<your_jwt>

What it does:
  1) Uploads each local image file to IPFS via Pinata.
  2) Rewrites each metadata JSON "image" to ipfs://<imageCID>.
  3) Uploads each metadata JSON to IPFS.
  4) Updates profiles JSON with:
     - image_uri = ipfs://<imageCID>
     - metadata_uri = ipfs://<metadataCID>
  5) Writes a manifest file to profiles/ipfs_manifest_<timestamp>.json
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="${2:-}"
      shift 2
      ;;
    --profiles-file)
      PROFILES_FILE="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

[[ -f "$ENV_FILE" ]] || { echo "Env file not found: $ENV_FILE" >&2; exit 1; }
[[ -f "$PROFILES_FILE" ]] || { echo "Profiles file not found: $PROFILES_FILE" >&2; exit 1; }

command -v jq >/dev/null 2>&1 || { echo "Missing command: jq" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "Missing command: curl" >&2; exit 1; }

set -a
source "$ENV_FILE"
set +a

[[ -n "${PINATA_JWT:-}" ]] || { echo "PINATA_JWT is missing in $ENV_FILE" >&2; exit 1; }

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TMP_DIR=".secrets/logs/ipfs_upload_${TIMESTAMP}"
MANIFEST_FILE="profiles/ipfs_manifest_${TIMESTAMP}.json"
mkdir -p "$TMP_DIR"

upload_file_to_pinata() {
  local file_path="$1"
  local name="$2"
  local out_file="$3"

  curl -sS "https://api.pinata.cloud/pinning/pinFileToIPFS" \
    -X POST \
    -H "Authorization: Bearer ${PINATA_JWT}" \
    -F "file=@${file_path}" \
    -F "pinataMetadata={\"name\":\"${name}\"};type=application/json" \
    > "$out_file"

  local cid
  cid="$(jq -r '.IpfsHash // empty' "$out_file")"
  [[ -n "$cid" ]] || {
    echo "Pinata upload failed for $file_path" >&2
    cat "$out_file" >&2
    exit 1
  }
  printf '%s' "$cid"
}

agent_count="$(jq 'length' "$PROFILES_FILE")"
[[ "$agent_count" -gt 0 ]] || { echo "No profiles in $PROFILES_FILE" >&2; exit 1; }

echo "[]" > "${TMP_DIR}/manifest.json"

for i in $(seq 0 $((agent_count - 1))); do
  name="$(jq -r ".[$i].name" "$PROFILES_FILE")"
  slug="$(jq -r ".[$i].slug" "$PROFILES_FILE")"
  image_rel="$(jq -r ".[$i].image_uri" "$PROFILES_FILE")"
  metadata_rel="$(jq -r ".[$i].metadata_local_uri" "$PROFILES_FILE")"

  [[ -n "$image_rel" && "$image_rel" != "null" ]] || { echo "Missing image_uri for index $i" >&2; exit 1; }
  [[ -n "$metadata_rel" && "$metadata_rel" != "null" ]] || { echo "Missing metadata_local_uri for index $i" >&2; exit 1; }

  image_path="${REPO_ROOT}/${image_rel}"
  metadata_path="${REPO_ROOT}/${metadata_rel}"
  [[ -f "$image_path" ]] || { echo "Image file not found: $image_path" >&2; exit 1; }
  [[ -f "$metadata_path" ]] || { echo "Metadata file not found: $metadata_path" >&2; exit 1; }

  image_resp="${TMP_DIR}/${slug}_image_upload.json"
  metadata_resp="${TMP_DIR}/${slug}_metadata_upload.json"

  echo "Uploading image for ${name}"
  image_cid="$(upload_file_to_pinata "$image_path" "${slug}-image" "$image_resp")"
  image_ipfs="ipfs://${image_cid}"

  tmp_metadata="${TMP_DIR}/${slug}_metadata_prepared.json"
  jq --arg img "$image_ipfs" '.image = $img | .image_url = $img' "$metadata_path" > "$tmp_metadata"
  cp "$tmp_metadata" "$metadata_path"

  echo "Uploading metadata for ${name}"
  metadata_cid="$(upload_file_to_pinata "$metadata_path" "${slug}-metadata" "$metadata_resp")"
  metadata_ipfs="ipfs://${metadata_cid}"

  tmp_profiles="${TMP_DIR}/profiles.tmp.json"
  jq \
    --argjson idx "$i" \
    --arg image_ipfs "$image_ipfs" \
    --arg metadata_ipfs "$metadata_ipfs" \
    '.[$idx].image_uri = $image_ipfs | .[$idx].metadata_uri = $metadata_ipfs' \
    "$PROFILES_FILE" > "$tmp_profiles"
  mv "$tmp_profiles" "$PROFILES_FILE"

  tmp_manifest="${TMP_DIR}/manifest.tmp.json"
  jq \
    --arg name "$name" \
    --arg slug "$slug" \
    --arg image_rel "$image_rel" \
    --arg metadata_rel "$metadata_rel" \
    --arg image_cid "$image_cid" \
    --arg metadata_cid "$metadata_cid" \
    '. + [{
      name: $name,
      slug: $slug,
      image_local_path: $image_rel,
      metadata_local_path: $metadata_rel,
      image_cid: $image_cid,
      image_uri: ("ipfs://" + $image_cid),
      metadata_cid: $metadata_cid,
      metadata_uri: ("ipfs://" + $metadata_cid),
      image_gateway_url: ("https://gateway.pinata.cloud/ipfs/" + $image_cid),
      metadata_gateway_url: ("https://gateway.pinata.cloud/ipfs/" + $metadata_cid)
    }]' \
    "${TMP_DIR}/manifest.json" > "$tmp_manifest"
  mv "$tmp_manifest" "${TMP_DIR}/manifest.json"
done

cp "${TMP_DIR}/manifest.json" "$MANIFEST_FILE"
echo "Upload complete."
echo "Updated profiles file: ${PROFILES_FILE}"
echo "Manifest: ${MANIFEST_FILE}"
