import crypto from 'node:crypto'

import { getOnboardingConfig } from './config'

export async function pinRegistrationFile(payload: unknown) {
  const config = getOnboardingConfig()

  if (!config.pinataJwt) {
    throw new Error('PINATA_JWT is required to pin onboarding metadata.')
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.pinataJwt}`,
    },
    body: JSON.stringify({
      pinataMetadata: {
        name: `syntrophic-onboarding-${crypto.randomUUID()}`,
      },
      pinataContent: payload,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Pinata pin failed: ${response.status} ${details}`)
  }

  const data = (await response.json()) as { IpfsHash?: string }
  if (!data.IpfsHash) {
    throw new Error('Pinata response missing IpfsHash.')
  }

  return {
    cid: data.IpfsHash,
    uri: `ipfs://${data.IpfsHash}`,
  }
}
