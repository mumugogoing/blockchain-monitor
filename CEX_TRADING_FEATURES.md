# CEX 套利交易功能说明

## 功能概述

本系统新增了完整的 CEX 跨交易所套利交易功能，包括：

1. **交易所充提币能力检查** - 自动检查买入和卖出交易所是否支持相应数字货币的充值和提现
2. **一键买入功能** - 在买入交易所快速执行市价买入
3. **一键提币功能** - 从买入交易所提币到卖出交易所，并实时监控提币状态
4. **到账实时监控** - 监控卖出交易所的充值到账情况
5. **一键现货卖出** - 在卖出交易所执行市价现货卖出
6. **一键合约卖出** - 在卖出交易所开合约空单卖出

## 主要文件

### 1. `/src/api/cex-trading.ts`
新增的交易 API 模块，包含以下核心功能：

#### 接口定义
- `CurrencyInfo` - 货币信息接口，包含充提币能力
- `NetworkInfo` - 网络信息接口，包含各链的充提币参数
- `WithdrawalStatus` - 提币状态接口
- `DepositStatus` - 充值状态接口
- `OrderResult` - 订单结果接口

#### 核心函数

**1. checkCurrencyCapability(exchange, currency)**
- 检查特定交易所的货币充提币能力
- 支持的交易所：Binance, OKX, Gate.io, Bybit, Bitget, MEXC, Huobi
- 返回 `CurrencyInfo` 对象，包含：
  - `canDeposit`: 是否支持充值
  - `canWithdraw`: 是否支持提现
  - `networks`: 支持的网络列表及详细参数

**2. placeMarketBuyOrder(exchange, symbol, quoteAmount, apiKey, apiSecret)**
- 在指定交易所下市价买单
- 需要配置 API Key 和 Secret
- 目前为占位实现，返回模拟订单

**3. placeMarketSellOrder(exchange, symbol, quantity, apiKey, apiSecret)**
- 在指定交易所下市价卖单（现货）
- 需要配置 API Key 和 Secret
- 目前为占位实现，返回模拟订单

**4. placeFuturesSellOrder(exchange, symbol, quantity, apiKey, apiSecret)**
- 在指定交易所下合约空单
- 需要配置 API Key 和 Secret
- 目前为占位实现，返回模拟订单

**5. initiateWithdrawal(exchange, currency, amount, address, network, apiKey, apiSecret)**
- 发起提币请求
- 需要配置 API Key 和 Secret
- 返回提币状态对象

**6. getWithdrawalStatus(exchange, withdrawalId, apiKey, apiSecret)**
- 查询提币状态
- 用于实时监控提币进度

**7. getDepositStatus(exchange, currency, apiKey, apiSecret)**
- 查询充值状态
- 用于实时监控到账情况

**8. getDepositAddress(exchange, currency, network, apiKey, apiSecret)**
- 获取充值地址
- 用于跨交易所转账

### 2. `/src/components/CexArbitrageMonitor.tsx`
增强的套利监控组件，新增以下功能：

#### UI 组件
1. **交易按钮** - 表格最右侧新增"交易"按钮，仅在套利机会 > 0.5% 时显示
2. **交易弹窗 (Trading Modal)** - 点击交易按钮打开，包含：
   - 套利信息展示
   - 交易所能力检查结果
   - 四步交易流程
3. **提币监控弹窗** - 实时显示提币状态
4. **充值监控弹窗** - 实时显示充值到账状态

#### 交易流程
完整的套利交易流程分为 4 步：

**步骤 1: 买入**
- 点击"一键买入"按钮
- 系统在买入交易所执行市价买单
- 前提：买入交易所支持该币种提现

**步骤 2: 提现**
- 点击"一键提现到卖出交易所"按钮
- 打开提币监控弹窗
- 点击"开始提现"发起提币
- 实时监控状态：
  - `idle` - 准备提现
  - `initiating` - 正在发起提现请求
  - `processing` - 提现处理中（等待区块链确认）
  - `completed` - 提现已完成

**步骤 3: 监控到账**
- 点击"开始实时监控到账"按钮
- 打开充值监控弹窗
- 自动开始监控充值
- 实时监控状态：
  - `monitoring` - 正在监控充值
  - `confirming` - 检测到充值，等待网络确认
  - `completed` - 充值已到账

**步骤 4: 卖出**
- 选择卖出方式：
  - **一键现货卖出** - 执行现货市价卖单
  - **一键合约卖出** - 开合约空单卖出
- 前提：卖出交易所支持该币种充值

## 使用说明

### 1. 查看套利机会
- 访问"CEX 跨交易所套利"页面
- 系统自动监控市值前 1000 的代币价格
- 当价差 > 0.5% 时，套利机会列会显示买入和卖出交易所信息
- 同时显示"交易"按钮

### 2. 检查交易所能力
- 点击"交易"按钮
- 系统自动检查：
  - 买入交易所是否支持该币种提现
  - 卖出交易所是否支持该币种充值
  - 支持的网络列表
- 如果不支持，会显示警告信息

### 3. 执行套利交易
按照 4 步流程依次执行：
1. 一键买入
2. 一键提现（实时监控状态）
3. 监控到账（实时监控状态）
4. 选择卖出方式（现货或合约）

### 4. 配置 API Key（重要）
**注意：** 实际交易功能需要配置交易所 API Key

目前为占位实现，需要在后续版本中添加：
- API Key 管理界面
- 安全的 API Key 存储（建议使用环境变量或加密存储）
- 各交易所的认证实现

## 技术实现细节

### 1. 交易所 API 集成
目前已集成以下交易所的公开 API：
- Binance - 币安
- OKX
- Gate.io
- Bybit
- Bitget
- MEXC
- Huobi - 火币

### 2. 充提币能力检查
使用各交易所的公开 API 查询：
- Binance: `/api/v3/capital/config/getall`
- OKX: `/api/v5/asset/currencies`
- Gate.io: `/api/v4/wallet/currency_chains`
- Bybit: `/v5/asset/coin/query-info`

### 3. 实时状态监控
使用定时器模拟实时监控：
- 提币状态每 2-5 秒更新一次
- 充值状态每 3-5 秒更新一次
- 实际实现应使用 WebSocket 或轮询 API

### 4. 安全考虑
- API Key 应加密存储
- 敏感操作需二次确认
- 建议实现交易限额保护
- 建议添加交易记录审计

## 后续开发计划

### 短期
1. 实现真实的 API Key 管理
2. 集成各交易所的认证和交易 API
3. 添加交易历史记录
4. 实现更精确的提币和充值监控

### 中期
1. 添加自动套利功能
2. 实现风险控制系统
3. 添加盈亏统计
4. 支持更多交易所

### 长期
1. 实现智能套利策略
2. 添加机器学习价格预测
3. 支持多币种同时套利
4. 实现高频交易支持

## 注意事项

⚠️ **重要提示**

1. **资金安全**: 请妥善保管 API Key，不要在代码中硬编码
2. **手续费**: 实际套利需要考虑交易手续费和提币手续费
3. **滑点**: 大额交易可能存在滑点，影响实际利润
4. **延迟**: 提币和充值有网络确认时间，可能错过套利机会
5. **测试**: 建议先用小额资金测试整个流程
6. **合规**: 请遵守各交易所的使用条款和当地法律法规

## 故障排查

### 问题: 提示"需要配置 API Key"
**解决**: 这是正常提示，因为当前为占位实现。需要实现 API Key 管理功能后才能实际交易。

### 问题: 交易所能力检查失败
**解决**: 
- 检查网络连接
- 部分交易所 API 可能需要代理访问
- API 可能临时不可用，稍后重试

### 问题: 找不到"交易"按钮
**解决**: 
- 确认价差 > 0.5%
- 确认有有效的买入和卖出交易所信息

## 联系支持

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 项目讨论区

---

**版本**: 1.0.0  
**最后更新**: 2025-10-18
