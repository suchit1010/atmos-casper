import { CasperClient } from 'casper-js-sdk';

async function fetchRealHash() {
  const client = new CasperClient('https://rpc.testnet.casperlabs.io/rpc');
  try {
    const block = await client.nodeClient.getLatestBlockInfo();
    console.log('Latest block:', block.block?.header.height);
    // Find a block with deploys by walking backwards
    let currentHeight = block.block?.header.height;
    if (!currentHeight) return;
    
    for (let i = 0; i < 20; i++) {
      const b = await client.nodeClient.getBlockInfoByHeight(currentHeight - i);
      const deploys = b.block?.body.deploy_hashes;
      if (deploys && deploys.length > 0) {
        console.log('Found real deploy hash:', deploys[0]);
        return;
      }
    }
    console.log('No deploys found in last 20 blocks');
  } catch (e) {
    console.error(e);
  }
}

fetchRealHash();
