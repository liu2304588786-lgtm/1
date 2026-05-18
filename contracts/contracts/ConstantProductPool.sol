// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ConstantProductPool is ERC20 {
    using SafeERC20 for IERC20Metadata;

    uint256 public constant FEE_BPS = 30;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    IERC20Metadata public immutable token0;
    IERC20Metadata public immutable token1;
    address public immutable launcher;
    bool public seeded;

    event Seeded(uint256 token0Amount, uint256 token1Amount, uint256 lpMinted);
    event Swapped(address indexed trader, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    constructor(address token0_, address token1_, string memory symbol_) ERC20("alt.fun Graduated LP", symbol_) {
        token0 = IERC20Metadata(token0_);
        token1 = IERC20Metadata(token1_);
        launcher = msg.sender;
    }

    function reserves() public view returns (uint256 reserve0, uint256 reserve1) {
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
    }

    function seedInitialLiquidity(
        uint256 token0Amount,
        uint256 token1Amount,
        address recipient
    ) external returns (uint256 liquidity) {
        require(msg.sender == launcher, "not launcher");
        require(!seeded, "seeded");
        require(token0Amount > 0 && token1Amount > 0, "invalid liquidity");

        seeded = true;
        token0.safeTransferFrom(msg.sender, address(this), token0Amount);
        token1.safeTransferFrom(msg.sender, address(this), token1Amount);

        liquidity = _sqrt(token0Amount * token1Amount);
        _mint(recipient, liquidity);

        emit Seeded(token0Amount, token1Amount, liquidity);
    }

    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient
    ) external returns (uint256 amountOut) {
        require(seeded, "not seeded");
        require(tokenIn == address(token0) || tokenIn == address(token1), "invalid token");
        require(amountIn > 0, "amount=0");

        bool zeroForOne = tokenIn == address(token0);
        (IERC20Metadata inToken, IERC20Metadata outToken) = zeroForOne
            ? (token0, token1)
            : (token1, token0);

        (uint256 reserveIn, uint256 reserveOut) = zeroForOne ? reserves() : _reverseReserves();
        inToken.safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 amountInWithFee = amountIn * (BPS_DENOMINATOR - FEE_BPS);
        amountOut = (amountInWithFee * reserveOut) / ((reserveIn * BPS_DENOMINATOR) + amountInWithFee);

        require(amountOut >= minAmountOut, "slippage");
        outToken.safeTransfer(recipient, amountOut);

        emit Swapped(msg.sender, tokenIn, amountIn, amountOut);
    }

    function _reverseReserves() private view returns (uint256 reserveIn, uint256 reserveOut) {
        (uint256 reserve0, uint256 reserve1) = reserves();
        reserveIn = reserve1;
        reserveOut = reserve0;
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y == 0) {
            return 0;
        }
        z = y;
        uint256 x = (y / 2) + 1;
        while (x < z) {
            z = x;
            x = ((y / x) + x) / 2;
        }
    }
}

