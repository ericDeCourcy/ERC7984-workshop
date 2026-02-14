pragma solidity ^0.8.27;

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {FHE, euint32, externalEuint32, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyToken is ERC7984, ZamaEthereumConfig {
    constructor() ERC7984("MyToken", "MTN", "<CONTRACT-URI>") {
        _mint(msg.sender, FHE.asEuint64(1000e6));

        FHE.allow(confidentialTotalSupply(), msg.sender); //needed to allow visibility to total supply
    }

    function mintFromExternal(address to, externalEuint64 externalAmount, bytes calldata inputProof) public returns(euint64 transferred)
    {
        euint64 amount = FHE.fromExternal(externalAmount, inputProof);
        return _mint(to, amount);

        //`allow` and `allowThis` are handled within the ERC7984 contract `_update` function

    }
}