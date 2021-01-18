import logger from '../../common/logger';

interface KeyPair {
  pairedPubKey: string,
  userPubKey: string,
  userOriginDid: string,
  cosignerEncryptedPrivKey: string,
  cosignerPubKey: string
}

const keyPairs: KeyPair[] = [];

export class FilecoinCosigningService {
  createKeyPair(
    userPubKey: string,
    userOriginDid: string): Promise<KeyPair> {
      logger.info(`create new key pair for bls key ${userPubKey} `
        + `with origin did ${userOriginDid}`);
      // TODO: generate bls key
      // TODO: pair with user key
      const keyPair: KeyPair = {
        // TODO: fill out
        pairedPubKey: "123xyz",
        userPubKey : userPubKey,
        userOriginDid : userOriginDid,
        cosignerEncryptedPrivKey: "abc",
        cosignerPubKey: "def"
      }
      return Promise.resolve(keyPair)
    }
}

export default new FilecoinCosigningService();
