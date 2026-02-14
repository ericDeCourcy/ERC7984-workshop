import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHECounter, FHECounter__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
    deployer: HardhatEthersSigner;
    alice: HardhatEthersSigner;
    bob: HardhatEthersSigner;
  };

async function deployFixture() {
    const factory = (await ethers.getContractFactory("MyToken")) as MyToken_factory;
    const myTokenContract = (await factory.deploy()) as MyToken;
    const myTokenContractAddress = await myTokenContract.getAddress();

    return { myTokenContract, myTokenContractAddress };
}

describe("MyToken", function() {
    let signers: Signers;
    let myTokenContract: MyToken;
    let myTokenContractAddress: string;

    before(async function () {
        const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
        const signer_0 = await ethSigners[0].getAddress();
        console.log(`ethSigner[0]: ` + signer_0);
        signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
    });

    beforeEach(async function () {
        // Check whether the tests are running against an FHEVM mock environment
        if (!fhevm.isMock) {
          console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
          this.skip();
        }
    
        ({ myTokenContract, myTokenContractAddress } = await deployFixture());
      });

      it("deployer token balance should start at 1000 after deployment", async function () {
        const encryptedBalance = await myTokenContract.confidentialBalanceOf(signers.deployer.getAddress());
        
        const clearBalanceAfterDeploy = await fhevm.userDecryptEuint(
            FhevmType.euint64, 
            encryptedBalance,
            myTokenContractAddress,
            signers.deployer
        );
        expect(clearBalanceAfterDeploy).to.eq(1000_000_000);
      });

      it("alice token balance should start at 0 after deployment", async function () {
        const encryptedBalance = await myTokenContract.confidentialBalanceOf(signers.alice.getAddress());
        expect(encryptedBalance).to.eq(ethers.ZeroHash);
      });

      it("token total supply should start at 1000", async function () {
        const encryptedSupply = await myTokenContract.confidentialTotalSupply();

        const clearSupply = await fhevm.userDecryptEuint(
            FhevmType.euint64, 
            encryptedSupply,
            myTokenContractAddress,
            signers.deployer
        );
        expect(clearSupply).to.eq(1000_000_000);
      });

      it("unpermissioned minting works", async function () {

        // encrypt const 10 as a euint64
        const clearTen = 10;
        const encryptedTen = await fhevm
            .createEncryptedInput(myTokenContractAddress, signers.alice.address)
            .add64(clearTen)
            .encrypt();
        
        const tx = await myTokenContract
            .connect(signers.alice)
            .mintFromExternal(signers.alice.address, encryptedTen.handles[0], encryptedTen.inputProof);
        await tx.wait();

        const encryptedBalanceAfterMint = await myTokenContract.confidentialBalanceOf(signers.alice.address);
        const clearBalanceAfterMint = await fhevm.userDecryptEuint(
            FhevmType.euint64, 
            encryptedBalanceAfterMint,
            myTokenContractAddress,
            signers.alice
        );

        expect(clearBalanceAfterMint).to.eq(clearTen);
      });

      it("transfers work (using duplicated input proof!)", async function () {
        
        // encrypt const 10 as a euint64
        const clearTen = 10;
        const encryptedTen = await fhevm
            .createEncryptedInput(myTokenContractAddress, signers.alice.address)
            .add64(clearTen)
            .encrypt();
        
        const tx = await myTokenContract
            .connect(signers.alice)
            .mintFromExternal(signers.alice.address, encryptedTen.handles[0], encryptedTen.inputProof);
        await tx.wait();

        const encryptedBalanceAfterMint = await myTokenContract.confidentialBalanceOf(signers.alice.address);
        const clearBalanceAfterMint = await fhevm.userDecryptEuint(
            FhevmType.euint64, 
            encryptedBalanceAfterMint,
            myTokenContractAddress,
            signers.alice
        );

        const transfer_tx = await myTokenContract
            .connect(signers.alice)["confidentialTransfer(address,bytes32,bytes)"](signers.bob.address, encryptedTen.handles[0], encryptedTen.inputProof);
        await transfer_tx.wait();

        const encryptedBalanceAfterTransfer = await myTokenContract.confidentialBalanceOf(signers.bob.address);

        const clearBalanceAfterTransfer = await fhevm.userDecryptEuint(
            FhevmType.euint64, 
            encryptedBalanceAfterTransfer,
            myTokenContractAddress,
            signers.bob
        );

        expect(clearBalanceAfterTransfer).to.eq(clearTen);
      });


      it("transfers using same input proof but different signer fail", async function () {
        
        // encrypt const 10 as a euint64
        const clearTen = 10;
        const encryptedTen = await fhevm
            .createEncryptedInput(myTokenContractAddress, signers.alice.address)
            .add64(clearTen)
            .encrypt();
        
        const tx = await myTokenContract
            .connect(signers.alice)
            .mintFromExternal(signers.alice.address, encryptedTen.handles[0], encryptedTen.inputProof);
        await tx.wait();

        const encryptedBalanceAfterMint = await myTokenContract.confidentialBalanceOf(signers.alice.address);
        const clearBalanceAfterMint = await fhevm.userDecryptEuint(
            FhevmType.euint64, 
            encryptedBalanceAfterMint,
            myTokenContractAddress,
            signers.alice
        );

        const transfer_tx = await myTokenContract
            .connect(signers.alice)["confidentialTransfer(address,bytes32,bytes)"](signers.bob.address, encryptedTen.handles[0], encryptedTen.inputProof);
        await transfer_tx.wait();

        const encryptedBalanceAfterTransfer = await myTokenContract.confidentialBalanceOf(signers.bob.address);

        const clearBalanceAfterTransfer = await fhevm.userDecryptEuint(
            FhevmType.euint64, 
            encryptedBalanceAfterTransfer,
            myTokenContractAddress,
            signers.bob
        );

        // ensure trnasfers fail when calling them with the same input proof for a different user
        await expect(
            myTokenContract.connect(signers.bob)["confidentialTransfer(address,bytes32,bytes)"](signers.alice.address, encryptedTen.handles[0], encryptedTen.inputProof)
        ).to.be.reverted;
    });
    

})