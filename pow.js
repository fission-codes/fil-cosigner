const { createPow } = require('@textile/powergate-client')

const host = 'http://0.0.0.0:6002'
const token = 'bbe1ac90-5e2f-4a5b-8675-3eed7ac47e40'

const pow = createPow({ host })
pow.setToken(token)

const getBuildInfo = async () => {
  return await pow.buildInfo()
}

const store = async (cid) => {
  return await pow.buildInfo()
}

const run = async () => {
  // const cid = 'QmPQn7EyxGRKGRgNfunW5yzvLRLFuBV483m3d4oMJyJSVr'
  // const cid = 'QmQQWf6uH6JDUBsFKcxHRrgoAvCySUkXEgdzLabF9VAueC'

  // const { jobId } = await pow.storageConfig.apply(cid)


  // console.log(await pow.data.cidInfo(cid))

  // console.log(resp)
  console.log(pow)
  // console.log(await getBuildInfo())
}

// {
//   user: {
//     id: '37b46016-892f-4d33-a691-128f4cf35cb2',
//     token: 'bbe1ac90-5e2f-4a5b-8675-3eed7ac47e40'
//   }
// }

run()
