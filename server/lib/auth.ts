import * as webnative from 'webnative'
import * as filecoin from 'webnative-filecoin'
import * as error from './error'
import crypto from 'crypto'
const webcrypto = (crypto as any).webcrypto.subtle

export const SERVER_DID =
  'did:key:z2AHoGyfRQZ3Zdf8BJiTr7KJpFbzrif6NbFP7rutAcsHHQ3pbzecLF5VfdPpGuQ57cPYcBKAkHjrWnbARcaXGfokLC5i2L4XKCSrDtg'

webnative.setup.setDependencies({
  rsa: {
    verify: async (
      message: Uint8Array,
      signature: Uint8Array,
      publicKey: Uint8Array
    ): Promise<boolean> => {
      const key = await webcrypto.importKey(
        'spki',
        publicKey,
        { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } },
        true,
        ['verify']
      )
      const result = await webcrypto.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        signature,
        message
      )
      return result
    },
  },
})

export const validateUCAN = async (
  encoded: string,
  address: string,
  rootDid: string,
  amount: number
): Promise<void> => {
  const ucan = webnative.ucan.decode(encoded)
  const isValid = await webnative.ucan.isValid(ucan)
  if (!isValid) {
    error.raise(401, 'Invalid UCAN')
  }
  if (ucan.payload.aud !== SERVER_DID) {
    error.raise(401, 'UCAN not intended for server')
  }

  const expectedRoot = await webnative.ucan.rootIssuer(encoded)
  if (expectedRoot !== rootDid) {
    error.raise(401, 'UCAN does not come from registered root DID')
  }

  const signingDid = webnative.did.publicKeyToDid(
    filecoin.addressToPubKey(address),
    webnative.did.KeyType.BLS
  )
  if (
    typeof ucan.payload.rsc === 'object' &&
    ucan.payload.rsc.cosign !== signingDid
  ) {
    error.raise(401, 'UCAN is not for the given FIL address')
  }
  if (filecoin.withinSpendLimit(amount, ucan)) {
    error.raise(401, 'Transaction amount exceeds UCAN spend limit')
  }
}
