import { Request, Response } from 'express'
import ucan from 'webnative/ucan'

export const createKeyPair = (req: Request, res: Response): void => {
  const { publicKey } = req.body
  if (!publicKey) {
    res.status(400).send('Missing param: `publicKey`')
    return
  } else if (typeof publicKey !== 'string') {
    res.status(400).send('Ill-formatted param: `publicKey` should be a string')
    return
  }
  res.status(200).send({ publicKey: 'abcd123' })
}

export const cosignMessage = (req: Request, res: Response): void => {
  try {
    // const decoded = ucan.decode(req.token)
  } catch (err) {
    res.status(401).send('Invalid UCAN')
    return
  }

  const { message } = req.body
  if (!message) {
    res.status(400).send('Missing param: `message`')
    return
  } else if (typeof message !== 'string') {
    res.status(400).send('Ill-formatted param: `message`')
    return
  }
  res.status(200).send({ thing: 12 })
}
