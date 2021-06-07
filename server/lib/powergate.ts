import { createPow } from '@textile/powergate-client'
import { CID } from 'webnative/dist/ipfs'

const host = 'http://0.0.0.0:6002'

const pow = createPow({ host })

export const getBuildInfo = async (): Promise<any> => {
  return await pow.buildInfo()
}

export const store = async (cid: CID): Promise<any> => {
  return await pow.buildInfo()
}
