// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AltCoin} from "./AltCoin.sol";
import {BondingCurve} from "./BondingCurve.sol";
import {LPLocker} from "./LPLocker.sol";

contract AltCoinFactory {
    struct LaunchInfo {
        address creator;
        address token;
        address curve;
        address locker;
        address ltToken;
        string name;
        string symbol;
        string imageUri;
        string description;
        uint256 createdAt;
    }

    LaunchInfo[] public launches;
    mapping(address => uint256) public launchIndexByCurve;

    event TokenLaunched(
        address indexed creator,
        address indexed token,
        address indexed curve,
        address locker,
        address ltToken,
        string name,
        string symbol
    );

    function launch(
        string memory name,
        string memory symbol,
        address ltToken,
        address usdc,
        string memory imageUri,
        string memory description
    ) external returns (address bondingCurve, address token) {
        bytes32 baseSalt = keccak256(
            abi.encode(msg.sender, launches.length, name, symbol, ltToken, usdc, imageUri, description)
        );

        AltCoin altToken = new AltCoin{salt: keccak256(abi.encode(baseSalt, "TOKEN"))}(name, symbol, address(this));
        LPLocker locker = new LPLocker{salt: keccak256(abi.encode(baseSalt, "LOCKER"))}(address(altToken), symbol);
        BondingCurve curve = new BondingCurve{salt: keccak256(abi.encode(baseSalt, "CURVE"))}(
            address(altToken),
            ltToken,
            usdc,
            msg.sender,
            address(locker)
        );
        locker.setCurve(address(curve));

        altToken.initializeSupply(address(curve));

        launches.push(
            LaunchInfo({
                creator: msg.sender,
                token: address(altToken),
                curve: address(curve),
                locker: address(locker),
                ltToken: ltToken,
                name: name,
                symbol: symbol,
                imageUri: imageUri,
                description: description,
                createdAt: block.timestamp
            })
        );
        launchIndexByCurve[address(curve)] = launches.length - 1;

        emit TokenLaunched(msg.sender, address(altToken), address(curve), address(locker), ltToken, name, symbol);
        return (address(curve), address(altToken));
    }

    function getLaunchCount() external view returns (uint256) {
        return launches.length;
    }

    function getLaunchInfo(uint256 index) external view returns (LaunchInfo memory) {
        return launches[index];
    }

    function getLaunchInfoByCurve(address curve) external view returns (LaunchInfo memory) {
        return launches[launchIndexByCurve[curve]];
    }
}
