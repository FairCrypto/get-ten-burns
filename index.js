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

const decodeMintInfo = (mintInfo) => ({
  term: parseInt(`0x${mintInfo.slice(0, 4)}`),
  maturityTs: parseInt(`0x${mintInfo.slice(4, 20)}`),
  rank: parseInt(`0x${mintInfo.slice(20, 52)}`),
  amp: parseInt(`0x${mintInfo.slice(52, 56)}`),
  eaa: parseInt(`0x${mintInfo.slice(56, 60)}`),
  isApex: parseInt(`0x${mintInfo.slice(60, 62)}`) > 128,
  isLimited: parseInt(`0x${mintInfo.slice(60, 62)}`) > 64 && parseInt(`0x${mintInfo.slice(60, 62)}`) < 128,
  redeemed: parseInt(`0x${mintInfo.slice(62)}`) === 1
});

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
  const XENFT = new Contract(minterAddress, xenTorrentAbi, provider);

  const getMintInfo = async (id) => {
    const mintInfo = await XENFT.mintInfo(id).then(_ => BigInt(_.toString()));
    return decodeMintInfo(mintInfo.toString(16).padStart(64, '0'));
  }


  const burns = await XEN.userBurns(userAddress).then(_ => BigInt(_.toString()));
  const balance = await XEN.balanceOf(userAddress).then(_ => BigInt(_.toString()));
  console.log('Address:', userAddress)
  console.log('  XEN balance (wei):', balance)
  console.log('  XEN total burns (wei):', burns)

  const tokens = await XENFT.ownedTokens();
  console.log('  XENFT owned now', tokens.map(t => t.toString()));

  const minting = XENFT.filters.Transfer(ethers.constants.AddressZero, userAddress);
  const logs = await XENFT.queryFilter(minting, 16300528, "latest");
  console.log('  XENFT minted', logs.map(l => l.args?.tokenId.toString()));

  const burnRates = logs.map(l => getBurnRate(l.args?.tokenId.toString()));
  const mintInfos = await Promise.all(logs.map(l => l.args?.tokenId.toString()).map(getMintInfo));
  const merged = logs
    .map((l, i) => ({ burnRate: burnRates[i], mintInfo: mintInfos[i]}))
    .map(({ burnRate, mintInfo }) => ({ burnRate: mintInfo.isLimited? burnRates[1] : burnRate, mintInfo }));

  console.log('  XENFT mint info', merged);
}

main().catch(console.error);