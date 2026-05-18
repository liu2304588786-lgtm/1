// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {ILeveragedToken} from "../interfaces/ILeveragedToken.sol";

contract MockLeveragedToken is ERC20, Ownable, ILeveragedToken {
    using SafeERC20 for IERC20Metadata;

    address public immutable baseAsset;
    IERC20Metadata private immutable usdcToken;
    uint256 public override exchangeRate;

    event ExchangeRateUpdated(uint256 newRate);

    constructor(
        string memory name_,
        string memory symbol_,
        address usdc_,
        uint256 initialRate
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        require(initialRate > 0, "rate=0");
        baseAsset = usdc_;
        usdcToken = IERC20Metadata(usdc_);
        exchangeRate = initialRate;
    }

    function setExchangeRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "rate=0");
        exchangeRate = newRate;
        emit ExchangeRateUpdated(newRate);
    }

    function mint(address to, uint256 baseAmount, uint256 minOut) external override returns (uint256 ltOut) {
        require(baseAmount > 0, "amount=0");
        usdcToken.safeTransferFrom(msg.sender, address(this), baseAmount);
        ltOut = (baseAmount * 1e18) / exchangeRate;
        require(ltOut >= minOut, "slippage");
        _mint(to, ltOut);
    }

    function redeem(address to, uint256 ltAmount, uint256 minBaseAmount) external override returns (uint256 usdcOut) {
        require(ltAmount > 0, "amount=0");
        _burn(msg.sender, ltAmount);
        usdcOut = (ltAmount * exchangeRate) / 1e18;
        require(usdcOut >= minBaseAmount, "slippage");
        usdcToken.safeTransfer(to, usdcOut);
    }
}
