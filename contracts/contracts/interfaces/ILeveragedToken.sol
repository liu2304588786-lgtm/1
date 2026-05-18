// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ILeveragedToken is IERC20 {
    function exchangeRate() external view returns (uint256);

    function mint(address to, uint256 baseAmount, uint256 minOut) external returns (uint256 ltOut);

    function redeem(address to, uint256 ltAmount, uint256 minBaseAmount) external returns (uint256 baseAmountOut);
}
