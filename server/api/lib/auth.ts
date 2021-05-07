import * as webnative from 'webnative'
import crypto from 'crypto'
const webcrypto = (crypto as any).webcrypto.subtle

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

export const validateUCAN = async (encoded: string): Promise<boolean> => {
  const ucan = webnative.ucan.decode(encoded)
  const isValid = await webnative.ucan.isValid(ucan)
  return isValid
}
