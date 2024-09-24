import { InfuraProvider, JsonRpcProvider  } from '@ethersproject/providers';
import dotenv from 'dotenv';
import {Contract} from "ethers";
import XenContract from '@faircrypto/xen-crypto/build/contracts/XENCrypto.json' with { type: "json" };

dotenv.config();

async function main() {
  const userAddress = '0xdd78367826D226D68ab446830B3Afd54366a7dEC';

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
  const burns = await XEN.userBurns(userAddress).then(_ => BigInt(_.toString()));
  const balance = await XEN.balanceOf(userAddress).then(_ => BigInt(_.toString()));
  console.log('Addr:', userAddress, 'XEN balance', balance, 'XEN Burns:', burns)
}

main().catch(console.error);