import { InfuraProvider, JsonRpcProvider  } from '@ethersproject/providers';
import dotenv from 'dotenv';
import {Contract, ethers} from "ethers";
import XenContract from '@faircrypto/xen-crypto/build/contracts/XENCrypto.json' with { type: "json" };
import XeNFTContract from '@faircrypto/xenft/build/contracts/XENTorrent.json' with { type: "json" };

const burnRates = [
  '0',
  '250000000000000000000000000',
  '500000000000000000000000000',
  '1000000000000000000000000000',
  '2500000000000000000000000000',
  '5000000000000000000000000000',
  '10000000000000000000000000000'
];

const classLimits =  [0, 0, 10000, 6000, 3000, 1000, 100];

const getBurnRate = (id) => {
  const cls = classLimits.findLastIndex((l, i) => id <= l);
  return burnRates[cls] || 0;
}

dotenv.config();

async function main() {
  const userAddress = '0xdd78367826D226D68ab446830B3Afd54366a7dEC';

  const contractAddress = process.env.CONTRACT_ADDRESS;
  const minterAddress = process.env.MINTER_ADDRESS;
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

  const { abi: xenCryptoAbi } = XenContract;
  const { abi: xenTorrentAbi } = XeNFTContract;
  const XEN = new Contract(contractAddress, xenCryptoAbi, provider);
  const burns = await XEN.userBurns(userAddress).then(_ => BigInt(_.toString()));
  const balance = await XEN.balanceOf(userAddress).then(_ => BigInt(_.toString()));
  console.log('Address:', userAddress)
  console.log('  XEN balance (wei):', balance)
  console.log('  XEN total burns (wei):', burns)

  const XENFT = new Contract(minterAddress, xenTorrentAbi, provider);
  // const events = await XENFT.queryFilter("*", '16300528', )

  const tokens = await XENFT.ownedTokens();
  /*
  const burnRates = []
  for (const i of [0,1,2,3,4,5,6]) {
    const specialClassesBurnRates = await XENFT.specialClassesBurnRates(i);
    burnRates.push(specialClassesBurnRates.toString());
  }
  const classLimits = []
  for (const i of [0,1,2,3,4,5,6]) {
    const specialClassesTokenLimits = await XENFT.specialClassesTokenLimits(i);
    classLimits.push(specialClassesTokenLimits.toString());
  }
  console.log('  XENFT burn rates', burnRates);
  console.log('  XENFT limits', classLimits);
   */
  console.log('  XENFT owned now', tokens.map(t => t.toString()));
  const minting = XENFT.filters.Transfer(ethers.constants.AddressZero, userAddress);
  const logs = await XENFT.queryFilter(minting, 16300528, "latest");
  console.log('  XENFT minted', logs.map(l => l.args?.tokenId.toString()));
  console.log('  XENFT burns', logs.map(l => {
    return `${l.args?.tokenId.toString()}: ${BigInt(getBurnRate(l.args?.tokenId.toString()))}`
  }));
}

main().catch(console.error);