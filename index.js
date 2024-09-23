import { InfuraProvider, JsonRpcProvider  } from '@ethersproject/providers';
import dotenv from 'dotenv';
import {Contract} from "ethers";
import XenContract from '@faircrypto/xen-crypto/build/contracts/XENCrypto.json' assert { type: 'json' };

dotenv.config();

async function main() {
  const userAddress = '0x1234567890123456789012345678901234567890';

  const contractAddress = process.env.CONTRACT_ADDRESS;
  const rpcUrl = process.env.RPC_URL;
  const networkId = process.env.ETH_NETWORK_ID || Number(process.env.ETH_CHAIN_ID);
  const infuraAPIKey = process.env.INFURA_API_KEY;
  const infuraAPISecret = process.env.INFURA_API_SECRET;

  const provider = infuraAPIKey
    ? new InfuraProvider(networkId, {
      apiKey: infuraAPIKey,
      projectId: infuraAPIKey,
      projectSecret: infuraAPISecret
    })
    : new JsonRpcProvider(rpcUrl, networkId);

  const { abi } = XenContract;
  const XEN = new Contract(contractAddress, abi, provider);
  const data = await XEN.userBurns(userAddress).then(_ => _.toNumber());
  console.log('XEN Burns of ', userAddress, '=', data)
}

main().catch(console.error);