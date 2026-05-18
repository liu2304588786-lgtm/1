// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {AltCoin} from "./AltCoin.sol";
import {ConstantProductPool} from "./ConstantProductPool.sol";
import {ILeveragedToken} from "./interfaces/ILeveragedToken.sol";

contract BondingCurve {
    using SafeERC20 for IERC20Metadata;

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 ether;
    uint256 public constant CURVE_ALLOCATION = 750_000_000 ether;
    uint256 public constant LP_ALLOCATION = 250_000_000 ether;
    uint256 public constant SEED_USD_VALUE = 3_000 * 1e6;
    uint256 public constant GRAD_USD_THRESHOLD = 9_000 * 1e6;

    AltCoin public immutable token;
    ILeveragedToken public immutable ltToken;
    IERC20Metadata public immutable usdc;
    address public immutable creator;
    address public immutable locker;

    uint256 public virtualReserveX;
    uint256 public virtualReserveY;
    uint256 public realReserveX;
    uint256 public realReserveY;
    uint256 public invariantK;
    bool public graduated;
    address public pool;

    event Bought(
        address indexed buyer,
        uint256 usdcIn,
        uint256 ltIn,
        uint256 tokenOut,
        uint256 tokenPrice
    );
    event Sold(
        address indexed seller,
        uint256 tokenIn,
        uint256 ltOut,
        uint256 usdcOut,
        uint256 tokenPrice
    );
    event Graduated(address indexed pool, uint256 tokenLiquidity, uint256 ltLiquidity, uint256 burnedTokens);

    constructor(address token_, address ltToken_, address usdc_, address creator_, address locker_) {
        token = AltCoin(token_);
        ltToken = ILeveragedToken(ltToken_);
        usdc = IERC20Metadata(usdc_);
        creator = creator_;
        locker = locker_;

        uint256 initialLtPrice = ltToken.exchangeRate();
        require(initialLtPrice > 0, "lt price=0");

        virtualReserveX = TOTAL_SUPPLY;
        virtualReserveY = (SEED_USD_VALUE * 1e18) / initialLtPrice;
        realReserveX = CURVE_ALLOCATION;
        realReserveY = 0;
        invariantK = virtualReserveX * virtualReserveY;
    }

    function currentPrice() public view returns (uint256) {
        uint256 ltPrice = ltToken.exchangeRate();
        return (virtualReserveY * ltPrice) / virtualReserveX;
    }

    function quoteBuy(uint256 usdcIn) public view returns (uint256 tokenOut, uint256 ltIn) {
        ltIn = (usdcIn * 1e18) / ltToken.exchangeRate();
        uint256 newVirtualY = virtualReserveY + ltIn;
        uint256 newVirtualX = invariantK / newVirtualY;
        tokenOut = virtualReserveX - newVirtualX;
        if (tokenOut > realReserveX) {
            tokenOut = realReserveX;
        }
    }

    function quoteSell(uint256 tokenIn) public view returns (uint256 usdcOut, uint256 ltOut) {
        uint256 newVirtualX = virtualReserveX + tokenIn;
        uint256 newVirtualY = invariantK / newVirtualX;
        ltOut = virtualReserveY - newVirtualY;
        if (ltOut > realReserveY) {
            ltOut = realReserveY;
        }
        usdcOut = (ltOut * ltToken.exchangeRate()) / 1e18;
    }

    function buy(uint256 usdcIn, uint256 minTokenOut) external returns (uint256 tokenOut) {
        require(!graduated, "graduated");
        require(usdcIn > 0, "amount=0");

        usdc.safeTransferFrom(msg.sender, address(this), usdcIn);
        usdc.forceApprove(address(ltToken), usdcIn);

        uint256 ltIn = ltToken.mint(address(this), usdcIn, 0);
        uint256 newVirtualY = virtualReserveY + ltIn;
        uint256 newVirtualX = invariantK / newVirtualY;

        tokenOut = virtualReserveX - newVirtualX;
        require(tokenOut > 0, "tokenOut=0");
        require(tokenOut <= realReserveX, "curve exhausted");
        require(tokenOut >= minTokenOut, "slippage");

        virtualReserveX = newVirtualX;
        virtualReserveY = newVirtualY;
        realReserveX -= tokenOut;
        realReserveY += ltIn;

        token.transfer(msg.sender, tokenOut);
        emit Bought(msg.sender, usdcIn, ltIn, tokenOut, currentPrice());
    }

    function sell(uint256 tokenIn, uint256 minUsdcOut) external returns (uint256 usdcOut) {
        require(!graduated, "graduated");
        require(tokenIn > 0, "amount=0");

        token.transferFrom(msg.sender, address(this), tokenIn);

        uint256 newVirtualX = virtualReserveX + tokenIn;
        uint256 newVirtualY = invariantK / newVirtualX;
        uint256 ltOut = virtualReserveY - newVirtualY;

        require(ltOut > 0, "ltOut=0");
        require(ltOut <= realReserveY, "insufficient LT");

        virtualReserveX = newVirtualX;
        virtualReserveY = newVirtualY;
        realReserveX += tokenIn;
        realReserveY -= ltOut;

        usdcOut = ltToken.redeem(address(this), ltOut, 0);
        require(usdcOut >= minUsdcOut, "slippage");

        usdc.safeTransfer(msg.sender, usdcOut);
        emit Sold(msg.sender, tokenIn, ltOut, usdcOut, currentPrice());
    }

    function checkGraduation() public view returns (bool) {
        if (graduated) {
            return false;
        }
        if (realReserveX == 0) {
            return true;
        }
        uint256 ltValue = (realReserveY * ltToken.exchangeRate()) / 1e18;
        return ltValue >= GRAD_USD_THRESHOLD;
    }

    function previewGraduationLiquidity() public view returns (uint256 tokenLiquidity, uint256 ltLiquidity) {
        ltLiquidity = realReserveY;
        if (ltLiquidity == 0 || virtualReserveY == 0) {
            tokenLiquidity = 0;
            return (tokenLiquidity, ltLiquidity);
        }
        tokenLiquidity = (ltLiquidity * virtualReserveX) / virtualReserveY;
    }

    function graduate() external returns (address deployedPool) {
        require(checkGraduation(), "not ready");
        require(!graduated, "graduated");

        (uint256 tokenLiquidity, uint256 ltLiquidity) = previewGraduationLiquidity();
        require(tokenLiquidity > 0 && ltLiquidity > 0, "empty liquidity");
        require(tokenLiquidity <= LP_ALLOCATION, "lp reserve exceeded");

        graduated = true;

        string memory lpSymbol = string.concat(token.symbol(), "-LP");
        ConstantProductPool newPool = new ConstantProductPool(address(token), address(ltToken), lpSymbol);
        pool = address(newPool);

        token.approve(address(newPool), tokenLiquidity);
        IERC20Metadata(address(ltToken)).approve(address(newPool), ltLiquidity);
        newPool.seedInitialLiquidity(tokenLiquidity, ltLiquidity, locker);

        uint256 remainingTokenBalance = token.balanceOf(address(this));
        uint256 burnedTokens = remainingTokenBalance;
        if (remainingTokenBalance > 0) {
            token.burn(remainingTokenBalance);
        }

        realReserveX = 0;
        realReserveY = 0;

        emit Graduated(address(newPool), tokenLiquidity, ltLiquidity, burnedTokens);
        return address(newPool);
    }
}
