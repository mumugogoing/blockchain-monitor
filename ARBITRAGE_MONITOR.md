# DEX/CEX Arbitrage Monitoring System

## Overview

This document explains the arbitrage monitoring system for Stacks blockchain tokens, comparing DEX (Decentralized Exchange) prices with CEX (Centralized Exchange) prices to identify trading opportunities.

## Architecture

### Price Fetching Flow

```
┌─────────────────┐
│  User Interface │
│ (PriceMonitor)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   getTokenPriceData()           │
│   - Fetches CEX & DEX prices    │
│   - Calculates arbitrage        │
└─────┬───────────────────┬───────┘
      │                   │
      ▼                   ▼
┌─────────────┐   ┌──────────────┐
│  CEX APIs   │   │   DEX APIs   │
│  (7 sources)│   │ (3 sources)  │
└─────────────┘   └──────────────┘
```

## DEX Price Sources

### 1. Bitflow Quote API (Primary)
**Endpoint**: `https://app.bitflow.finance/api/sdk/quote-for-route`

**Parameters**:
- `tokenXId`: Source token (e.g., "token-stx")
- `tokenYId`: Destination token (e.g., "token-aeusdc")
- `amount`: Amount in smallest unit (e.g., 1000000 = 1 STX)
- `timestamp`: Current timestamp

**Example**:
```javascript
// Get price for 1 STX in aeUSDC
const price = await getBitflowQuotePrice('token-stx', 'token-aeusdc', 1000000);
// Returns: amount of aeUSDC received for 1 STX
```

**Supported Pairs**:
- STX → aeUSDC
- STX → sBTC
- USDA → aeUSDC
- DOG → STX
- DOG → sBTC

### 2. Alex Pools API (Fallback)
**Endpoint**: `https://api.alexgo.io/v2/public/pools`

**Method**: Pool balance ratios
```javascript
price = pool.balance_y / pool.balance_x
```

### 3. Bitflow Pool API (Last Resort)
**Endpoint**: `https://app.bitflow.finance/api/sdk/get-pool-by-contract`

**Method**: Direct pool contract data

## CEX Price Sources

The system queries 7 major exchanges in parallel:

1. **Binance** - `https://api.binance.com/api/v3/ticker/price`
2. **OKX** - `https://www.okx.com/api/v5/market/ticker`
3. **Gate.io** - `https://api.gateio.ws/api/v4/spot/tickers`
4. **Bitget** - `https://api.bitget.com/api/v2/spot/market/tickers`
5. **MEXC** - `https://api.mexc.com/api/v3/ticker/price`
6. **Huobi** - `https://api.huobi.pro/market/detail/merged`
7. **Bybit** - `https://api.bybit.com/v5/market/tickers`

### Average Calculation

```javascript
averagePrice = sum(validPrices) / count(validPrices)
```

Only successful responses are included in the average.

## Token Equivalences

### Stablecoins
All these tokens are considered equivalent to ~$1 USD:
- aeUSDC
- USDA
- USDC
- sUSDT
- USDT

**CEX Mapping**: All map to `USDTUSDT` for comparison

### Bitcoin Equivalents
All these tokens represent Bitcoin:
- sBTC (Stacks wrapped Bitcoin)
- xBTC
- aBTC

**CEX Mapping**: All map to `BTCUSDT` for comparison

## Arbitrage Detection

### Calculation

```javascript
priceDiff = dexPrice - averageCexPrice
priceDiffPercent = (priceDiff / averageCexPrice) * 100
```

### Display Logic

- **Threshold**: Only show if `|priceDiffPercent| > 0.5%`
- **Color Coding**:
  - Gold: `|priceDiffPercent| > 2%` (High opportunity)
  - Blue: `0.5% < |priceDiffPercent| ≤ 2%` (Normal opportunity)

### Direction Indicators

- **Positive** (`priceDiff > 0`): `DEX买入 → CEX卖出` (Buy on DEX, Sell on CEX)
- **Negative** (`priceDiff < 0`): `CEX买入 → DEX卖出` (Buy on CEX, Sell on DEX)

## Monitored Token Pairs

| Token | DEX Pair | CEX Symbol | Description |
|-------|----------|------------|-------------|
| STX | STX-AEUSDC | STXUSDT | Stacks native token |
| sBTC | STX-SBTC | BTCUSDT | Wrapped Bitcoin on Stacks |
| aeUSDC | STX-AEUSDC | USDTUSDT | USD Coin (Bridged) |
| USDA | USDA-AEUSDC | USDTUSDT | USDA Stablecoin |

## Configuration

### Auto-Refresh Settings

Users can configure automatic price updates:
- **Intervals**: 1s, 3s, 5s, 10s, 30s, 1m, 10m, 30m, 1h, 12h, 24h
- **Default**: 30 seconds
- **Control**: Toggle switch + interval selector

### API Timeouts

- **Bitflow Quote API**: 10 seconds
- **Alex API**: 5 seconds
- **Bitflow Pool API**: 5 seconds
- **CEX APIs**: 5 seconds each

## Error Handling

### Fallback Chain

For DEX prices, the system tries multiple sources:

```
Bitflow Quote API
    ↓ (if fails)
Alex Pools API
    ↓ (if fails)
Bitflow Pool API
    ↓ (if fails)
Return null (display "未获取")
```

### CEX Price Resilience

- Queries all exchanges in parallel
- Averages only successful responses
- If no exchanges respond, displays "-"

## Example API Responses

### Bitflow Quote API Response
```json
{
  "amountOut": 1500000,
  "route": [...],
  "priceImpact": 0.05
}
```

### Alex Pools API Response
```json
{
  "pools": [
    {
      "token_x": "token-wstx",
      "token_y": "token-susdt",
      "balance_x": 1000000000000,
      "balance_y": 1500000000000
    }
  ]
}
```

### CEX Price Response (Binance)
```json
{
  "symbol": "STXUSDT",
  "price": "1.523456"
}
```

## Usage Example

```typescript
import { getDEXPrice } from '@/api/dex-prices';
import { getTokenPriceData, getCEXSymbol } from '@/api/cex-prices';

// Fetch prices for STX
const dexPrice = await getDEXPrice('STX-AEUSDC');
const cexSymbol = getCEXSymbol('STX'); // Returns 'STXUSDT'
const priceData = await getTokenPriceData('STX', cexSymbol, dexPrice);

console.log('DEX Price:', priceData.dexPrice);
console.log('CEX Average:', priceData.averageCexPrice);
console.log('Arbitrage:', priceData.priceDiffPercent, '%');
```

## Performance Considerations

### Parallel Requests

All price fetching is done in parallel to minimize latency:

```typescript
const pricePromises = tokensToMonitor.map(async ({ token, dexPair }) => {
  const cexSymbol = getCEXSymbol(token);
  const dexPrice = await getDEXPrice(dexPair);
  return await getTokenPriceData(token, cexSymbol, dexPrice);
});

const prices = await Promise.all(pricePromises);
```

### Caching

- No caching implemented (real-time data)
- Auto-refresh keeps data current
- Manual refresh button available

## Future Enhancements

1. **Historical Data**: Store price history for trend analysis
2. **Alerts**: Push notifications when arbitrage > threshold
3. **Multi-DEX**: Compare prices across multiple DEXes
4. **Gas Estimation**: Factor in transaction costs
5. **Liquidity Check**: Verify sufficient liquidity for arbitrage
6. **Trade Execution**: Optional automatic arbitrage trading

## Troubleshooting

### "未获取" (Not Fetched) Error

**Possible Causes**:
1. All API sources are down or blocked
2. Network connectivity issues
3. Invalid token pair configuration
4. CORS issues in browser

**Solutions**:
1. Check network connectivity
2. Verify API endpoints are accessible
3. Check browser console for specific errors
4. Try manual refresh

### Inaccurate Arbitrage Percentages

**Possible Causes**:
1. Price data from different time periods
2. Insufficient CEX responses
3. Low liquidity affecting DEX quotes

**Solutions**:
1. Enable auto-refresh for real-time data
2. Check which exchanges are responding
3. Consider price impact for large trades

## Security Considerations

- **API Keys**: Not required (all public endpoints)
- **Rate Limiting**: Implemented via timeout settings
- **Data Validation**: All responses checked before use
- **Error Boundaries**: Failed requests don't crash the UI

## License

Part of the blockchain-monitor project. See main repository for license information.
