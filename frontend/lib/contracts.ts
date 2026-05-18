export const FACTORY_ABI = [
  "function launch(string name,string symbol,address ltToken,address usdc,string imageUri,string description) returns (address bondingCurve,address token)"
];

export const CURVE_ABI = [
  "function usdc() view returns (address)",
  "function buy(uint256 usdcIn,uint256 minTokenOut) returns (uint256 tokenOut)",
  "function sell(uint256 tokenIn,uint256 minUsdcOut) returns (uint256 usdcOut)",
  "function graduated() view returns (bool)"
];

export const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
  "function faucet(address to,uint256 amount)"
];

export const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "";
