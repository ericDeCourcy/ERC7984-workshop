# Workshop Steps

Here's all the steps for following along at home / during the workshop

### 0. Get some Sepolia ETH

This is the [Sepolia ETH PoW Faucet](https://sepolia-faucet.pk910.de/)

Basically, you "mine" Sepolia ETH in the browser. Within a few minutes you should have enough to deploy your contracts. But its a good idea to have this running in the background while we do the rest of the workshop, so you have ETH at deploy time.

**0.1 Sepolia ETH should be enough**


### 1. Install Prerequisites

First, lets make a repository on your machine and clone this repo. 

This assumes you are using a Unix system and have `git` installed

```bash
mkdir ERC7984-workshop
cd ERC7984-workshop
git clone https://github.com/ericDeCourcy/ERC7984-workshop.git
cd ERC7984-workshop
```

For this project, we need:

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

Also, we will need hardhat **version 2**. Version 3 doesn't work with this code just yet.

Lets check our node installation. We're using `nvm`, which if you don't have you'll need to install.

Check the node version you're using:
```bash
node -v
```

Check which node versions you have installed:
```bash
nvm ls
```

Install version 20, or the latest LTS version of node
```bash
nvm install 20
   ~ OR ~
nvm install --lts
```

Switch to node version 20, or the latest LTS version of node
```bash
nvm use 20
   ~ OR ~
nvm use --lts
```

Node comes with npm, so if you have Node you should have npm. Check it with 
```bash
npm -v
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variable

You will need to get a Mnemonic and an infura API key.

You can use this [**🚨INSECURE🚨 MNEMONIC GENERATOR**](https://it-tools.tech/bip39-generator) for quickly generating a Mnemonic. This Mnemonic is good for this throw-away application. Please do not store real funds on it.

To get an infura api key, you can go to [this page in the metamask docs](https://docs.metamask.io/services/get-started/infura) and follow the instructions to get a free key.

```bash
npx hardhat vars set MNEMONIC
> <your twelve word mnemonic>

# Set your Infura API key for network access
npx hardhat vars set INFURA_API_KEY
> <numeric api key>
```

### 4. Compile and run local tests

```bash
npm run compile
npm run test
```

OR 

```bash
npx hardhat compile
npx hardhat test
```