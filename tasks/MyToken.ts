import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

// TODOS
// [ ] Update comments to reflect new commands
// [ ] remove all mentions of "counter"
// [ ] alice is signer 1 in the tests, but signer 0 here. Reconcile this


/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the FHECounter contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the FHECounter contract
 *
 *   npx hardhat --network localhost task:decrypt-count
 *   npx hardhat --network localhost task:increment --value 2
 *   npx hardhat --network localhost task:decrement --value 1
 *   npx hardhat --network localhost task:decrypt-count
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the FHECounter contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the FHECounter contract
 *
 *   npx hardhat --network sepolia task:decrypt-count
 *   npx hardhat --network sepolia task:increment --value 2
 *   npx hardhat --network sepolia task:decrement --value 1
 *   npx hardhat --network sepolia task:decrypt-count
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:token-address", "Prints the MyToken address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const myToken = await deployments.get("MyToken");

  console.log("MyToken address is " + myToken.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-balance
 *   - npx hardhat --network sepolia task:decrypt-balance
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
 *   - npx hardhat --network localhost task:increment --value 1
 *   - npx hardhat --network sepolia task:increment --value 1
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

task("task:sweep-bob-tokens", "Sweeps bob's tokens to alice")
  .addOptionalParam("address", "Optionally specify the MyToken contract address")
  //.addParam("value", "The increment value")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
/*
    const value = parseInt(taskArguments.value);
    if (!Number.isInteger(value)) {
      throw new Error(`Argument --value is not an integer`);
    }
*/
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
    console.log(`encryptedCount: ${encryptedCount}`);

    // Encrypt the value passed as argument
    /*
    const encryptedValue = await fhevm
      .createEncryptedInput(MyTokenDeployment.address, signers[0].address)
      .add64(value)
      .encrypt();
    */

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



/**
 * Example:
 *   - npx hardhat --network localhost task:decrement --value 1
 *   - npx hardhat --network sepolia task:decrement --value 1
 */
/*
task("task:decrement", "Calls the decrement() function of FHECounter Contract")
  .addOptionalParam("address", "Optionally specify the FHECounter contract address")
  .addParam("value", "The decrement value")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const value = parseInt(taskArguments.value);
    if (!Number.isInteger(value)) {
      throw new Error(`Argument --value is not an integer`);
    }

    await fhevm.initializeCLIApi();

    const FHECounterDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHECounter");
    console.log(`FHECounter: ${FHECounterDeployement.address}`);

    const signers = await ethers.getSigners();

    const fheCounterContract = await ethers.getContractAt("FHECounter", FHECounterDeployement.address);

    // Encrypt the value passed as argument
    const encryptedValue = await fhevm
      .createEncryptedInput(FHECounterDeployement.address, signers[0].address)
      .add32(value)
      .encrypt();

    const tx = await fheCounterContract
      .connect(signers[0])
      .decrement(encryptedValue.handles[0], encryptedValue.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const newEncryptedCount = await fheCounterContract.getCount();
    console.log("Encrypted count after decrement:", newEncryptedCount);

    console.log(`FHECounter decrement(${value}) succeeded!`);
  });
*/
