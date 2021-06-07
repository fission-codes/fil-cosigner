const dotenv = require('dotenv')
dotenv.config()

const { createPow } = require('@textile/powergate-client')

const host = process.env.POWERGATE_HOST || 'http://0.0.0.0:6002'

const pow = createPow({ host })

const runScript = async (): Promise<any> => {
  const user = await pow.admin.users.create()
  console.log(`Created User: `)
  console.log(user)
}

runScript()
