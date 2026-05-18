# alt.fun MVP

这是一个面向 HyperEVM 测试网的 alt.fun 风格 MVP，目标是把以下链路先跑通：

- 创建 alt coin
- 在 bonding curve 上买入 / 卖出
- LT 价格驱动币价联动
- 达到阈值后毕业到常数乘积 AMM
- 前端可浏览、发射、交易、查看毕业状态

这个版本保留了白皮书中的核心定价与毕业公式，同时把真实 BounceTech 依赖抽象成了接口，默认用 `MockLeveragedToken` 在测试网完成端到端联调。

## 目录

- `contracts/` Hardhat 合约工程
- `backend/` Node.js API + WebSocket + keeper
- `frontend/` Next.js 前端

## 快速开始

1. 安装依赖

```bash
npm run install:all
```

2. 复制环境变量

```bash
copy .env.example .env
```

3. 编译与测试合约

```bash
npm run contracts:compile
npm run contracts:test
```

4. 选择部署模式

`mock` 模式：
用于本地与 HyperEVM 测试网联调，部署 mock USDC + mock LT。

`real` 模式：
用于接入真实 Bounce LT。当前官方 Bounce 合约地址在 HyperEVM 主网有部署，在 HyperEVM 测试网没有部署。

5. 部署到本地 Hardhat、HyperEVM 测试网或 HyperEVM 主网

```bash
npm run contracts:deploy -- --network localhost
npm run contracts:deploy -- --network hyperevmTestnet
DEPLOY_MODE=real BOUNCE_LT_ADDRESS=0x7b430c5842ce7dba29b910c018369fa2fa0ac2e3 npm run contracts:deploy -- --network hyperevmMainnet
```

部署完成后会生成 `deployments/<network>.json`。

如果你要跑前端交互，还需要把工厂地址写进环境变量：

```bash
NEXT_PUBLIC_FACTORY_ADDRESS=<deployments 里的 factory 地址>
```

如果你本地联调，请把 `.env` 里的 RPC 改成你的本地节点，并把 `DEPLOYMENT_FILE` 指向 `./deployments/localhost.json` 或 `./deployments/hardhat.json`。

6. 启动后端与前端

```bash
npm run backend:dev
npm run frontend:dev
```

## MVP 与正式版差异

- 已实现：曲线发射、买卖、毕业、AMM、LP 锁仓、前后端联调
- 已实现：真实 Bounce LT ABI 兼容，调用形态已切换到官方 `mint` / `redeem`
- 已实现：`mock testnet` 与 `real mainnet` 双模式部署保护
- 暂未实现：地址后缀挖矿、防狙击延迟、IPFS 上传

## 测试网参数

- HyperEVM Testnet Chain ID: `998`
- HyperEVM Testnet RPC: `https://rpc.hyperliquid-testnet.xyz/evm`
- HyperEVM Mainnet Chain ID: `999`
- HyperEVM Mainnet RPC: `https://rpc.hyperliquid.xyz/evm`
- Bounce 索引接口基线：`https://indexing.bounce.tech`

## 安全提醒

当前仓库上下文里出现了一个明文 OpenAI API Key。建议立即旋转并改为放进本地环境变量，不要继续保存在项目说明或版本库中。
