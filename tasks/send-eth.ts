import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";


/**
 * Example:
 *   - npx hardhat --network sepolia task:send-ether --address <some address>
 */
task("task:send-ether", "Calls the confidentialBalanceOf() function of MyToken Contract for alice")
  .addParam("address", "specify the MyToken contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const [sender] = await ethers.getSigners();

    const tx = await sender.sendTransaction({
    to: taskArguments.address,
    value: ethers.parseEther("0.1")
    });

    console.log(`transaction hash: ${tx.hash}`);

});
