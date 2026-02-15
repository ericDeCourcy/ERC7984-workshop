import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/** 
 * These define the tasks you can use via `npx hardhat task:{taskName} {options} --network sepolia`.
 * They assume you have already deployed MyToken via `npx hardhat deploy --network sepolia`
 * 
 * 
 * They are designed with sepolia in mind, but can also be used with hardhat's local network.
 * If using hardhat's local network, first you will need to start up the network.
 * In a separate terminal window, run:
 *    `npx hardhat node`
 * Then, you can deploy the contract to the local network with:
 *    `npx hardhat deploy --network localhost`
 * After that, you can run tasks via:
 *    `npx hardhat task:{taskName} {options} --network localhost`
 * 
 * See README.md for details on intended use
 */
task("task:token-address", "Prints the MyToken address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const myToken = await deployments.get("MyToken");

  console.log("MyToken address is " + myToken.address);
});

/**
 * Example:
 *   - npx hardhat --network sepolia task:decrypt-alice-balance
 */
task("task:decrypt-alice-balance", "Calls the confidentialBalanceOf() function of MyToken Contract for alice")
  .addOptionalParam("address", "Optionally specify the MyToken contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const MyTokenDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MyToken");
    console.log(`MyToken: ${MyTokenDeployment.address}`);

    const signers = await ethers.getSigners();

    const myTokenContract = await ethers.getContractAt("MyToken", MyTokenDeployment.address);

    const encryptedCount = await myTokenContract.confidentialBalanceOf(signers[0].address);
    if (encryptedCount === ethers.ZeroHash) {
      console.log(`encrypted count: ${encryptedCount}`);
      console.log("clear count    : 0");
      return;
    }

    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedCount,
      MyTokenDeployment.address,
      signers[0],
    );
    console.log(`Encrypted count: ${encryptedCount}`);
    console.log(`Clear count    : ${clearCount}`);
  });

/**
 * Example:
 *   - npx hardhat --network sepolia task:decrypt-bob-balance
 */
task("task:decrypt-bob-balance", "Calls the confidentialBalanceOf() function of MyToken Contract for bob")
  .addOptionalParam("address", "Optionally specify the MyToken contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const MyTokenDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MyToken");
    console.log(`MyToken: ${MyTokenDeployment.address}`);

    const signers = await ethers.getSigners();

    const myTokenContract = await ethers.getContractAt("MyToken", MyTokenDeployment.address);

    const encryptedCount = await myTokenContract.confidentialBalanceOf(signers[1].address);
    if (encryptedCount === ethers.ZeroHash) {
      console.log(`encrypted count: ${encryptedCount}`);
      console.log("clear count    : 0");
      return;
    }

    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedCount,
      MyTokenDeployment.address,
      signers[1],
    );
    console.log(`Encrypted count: ${encryptedCount}`);
    console.log(`Clear count    : ${clearCount}`);
  });

/**
 * Example:
 *   - npx hardhat --network sepolia task:send-tokens --value 123456
 */
task("task:send-tokens", "Sends tokens from alice to bob")
  .addOptionalParam("address", "Optionally specify the MyToken contract address")
  .addParam("value", "The increment value")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const value = parseInt(taskArguments.value);
    if (!Number.isInteger(value)) {
      throw new Error(`Argument --value is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const MyTokenDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MyToken");
    console.log(`MyToken: ${MyTokenDeployment.address}`);

    const signers = await ethers.getSigners();

    const myTokenContract = await ethers.getContractAt("MyToken", MyTokenDeployment.address);

    // Encrypt the value passed as argument
    const encryptedValue = await fhevm
      .createEncryptedInput(MyTokenDeployment.address, signers[0].address)
      .add64(value)
      .encrypt();

    const tx = await myTokenContract
      .connect(signers[0])
      ["confidentialTransfer(address,bytes32,bytes)"](signers[1].address, encryptedValue.handles[0], encryptedValue.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const newEncryptedCount = await myTokenContract.confidentialBalanceOf(signers[1].address);
    console.log("Bob's encrypted balance after transfer:", newEncryptedCount);

    console.log(`Transfer of (${value}) tokens succeeded!`);
  });


/**
 * Example:
 *   - npx hardhat --network sepolia task:sweep-bob-tokens
 */
task("task:sweep-bob-tokens", "Sweeps bob's tokens to alice")
  .addOptionalParam("address", "Optionally specify the MyToken contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const MyTokenDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("MyToken");
    console.log(`MyToken: ${MyTokenDeployment.address}`);

    const signers = await ethers.getSigners();

    const myTokenContract = await ethers.getContractAt("MyToken", MyTokenDeployment.address);

    const encryptedCount = await myTokenContract.confidentialBalanceOf(signers[1].address);
    if (encryptedCount === ethers.ZeroHash) {
      return;
    }
    console.log(`encrypted balance handle: ${encryptedCount}`);

    const tx = await myTokenContract
      .connect(signers[1])
      ["confidentialTransfer(address,bytes32)"](signers[0], encryptedCount); 
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const newEncryptedCount = await myTokenContract.confidentialBalanceOf(signers[1].address);
    console.log("Bob's encrypted balance after transfer:", newEncryptedCount);

    console.log(`Sweep of Bob's tokens succeeded!`);
  });