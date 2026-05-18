export const FACTORY_ABI = [
  "function getLaunchCount() view returns (uint256)",
  "function getLaunchInfo(uint256 index) view returns ((address creator,address token,address curve,address locker,address ltToken,string name,string symbol,string imageUri,string description,uint256 createdAt))"
];

export const CURVE_ABI = [
  "function token() view returns (address)",
  "function ltToken() view returns (address)",
  "function usdc() view returns (address)",
  "function locker() view returns (address)",
  "function pool() view returns (address)",
  "function graduated() view returns (bool)",
  "function currentPrice() view returns (uint256)",
  "function virtualReserveX() view returns (uint256)",
  "function virtualReserveY() view returns (uint256)",
  "function realReserveX() view returns (uint256)",
  "function realReserveY() view returns (uint256)",
  "function quoteBuy(uint256 usdcIn) view returns (uint256 tokenOut, uint256 ltIn)",
  "function quoteSell(uint256 tokenIn) view returns (uint256 usdcOut, uint256 ltOut)",
  "function previewGraduationLiquidity() view returns (uint256 tokenLiquidity, uint256 ltLiquidity)",
  "function checkGraduation() view returns (bool)",
  "function graduate() returns (address)",
  "event Bought(address indexed buyer,uint256 usdcIn,uint256 ltIn,uint256 tokenOut,uint256 tokenPrice)",
  "event Sold(address indexed seller,uint256 tokenIn,uint256 ltOut,uint256 usdcOut,uint256 tokenPrice)",
  "event Graduated(address indexed pool,uint256 tokenLiquidity,uint256 ltLiquidity,uint256 burnedTokens)"
];

export const LT_ABI = [
  "function usdc() view returns (address)",
  "function exchangeRate() view returns (uint256)"
];

export const ERC20_ABI = [
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
  "function faucet(address to,uint256 amount)"
];
