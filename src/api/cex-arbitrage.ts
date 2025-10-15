import axios from 'axios';

// CEX API endpoints
const BINANCE_API = 'https://api.binance.com/api/v3';
const OKX_API = 'https://www.okx.com/api/v5';
const GATE_API = 'https://api.gateio.ws/api/v4';
const BITGET_API = 'https://api.bitget.com/api/v2';
const MEXC_API = 'https://api.mexc.com/api/v3';
const HUOBI_API = 'https://api.huobi.pro';
const BYBIT_API = 'https://api.bybit.com/v5';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface ExchangePrice {
  exchange: string;
  price: number;
}

export interface TradingPairArbitrage {
  symbol: string;
  prices: {
    binance?: number;
    okx?: number;
    gate?: number;
    bitget?: number;
    mexc?: number;
    huobi?: number;
    bybit?: number;
  };
  highestPrice?: number;
  lowestPrice?: number;
  highestExchange?: string;
  lowestExchange?: string;
  priceDiff?: number;
  priceDiffPercent?: number;
  exchangeCount?: number; // Number of exchanges where this pair is available
  marketCapRank?: number; // Market cap ranking from CoinGecko
}

/**
 * Get all trading pairs from Binance
 */
const getBinancePairs = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${BINANCE_API}/exchangeInfo`, { timeout: 10000 });
    return response.data.symbols
      .filter((s: any) => s.status === 'TRADING' && s.symbol.endsWith('USDT'))
      .map((s: any) => s.symbol);
  } catch (error) {
    console.error('Failed to fetch Binance pairs:', error);
    return [];
  }
};

/**
 * Get Binance 24hr ticker data and rank by volume
 * Returns a map of symbol -> volume rank
 */
const getBinance24hrTicker = async (): Promise<Map<string, number>> => {
  try {
    const response = await axios.get(`${BINANCE_API}/ticker/24hr`, { timeout: 15000 });
    
    // Filter USDT pairs and sort by volume
    const usdtPairs = response.data
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));
    
    // Create rank map
    const volumeRankMap = new Map<string, number>();
    usdtPairs.forEach((ticker: any, index: number) => {
      volumeRankMap.set(ticker.symbol, index + 1);
    });
    
    return volumeRankMap;
  } catch (error) {
    console.error('Failed to fetch Binance 24hr ticker:', error);
    return new Map();
  }
};

/**
 * Get top tokens by market cap from CoinGecko
 * Returns a map of symbol -> market cap rank
 * Falls back to static list if API fails
 */
const getTopTokensByMarketCap = async (limit: number = 1000): Promise<Map<string, number>> => {
  try {
    const tokenRankMap = new Map<string, number>();
    const perPage = 250; // CoinGecko API limit per page
    const pages = Math.ceil(limit / perPage);
    
    // Fetch multiple pages in parallel
    const pagePromises = [];
    for (let page = 1; page <= pages; page++) {
      pagePromises.push(
        axios.get(`${COINGECKO_API}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: perPage,
            page: page,
            sparkline: false,
          },
          timeout: 15000,
        }).catch(err => {
          console.error(`Failed to fetch page ${page} from CoinGecko:`, err.message);
          return null;
        })
      );
    }
    
    const responses = await Promise.all(pagePromises);
    
    // Process all responses
    let successCount = 0;
    responses.forEach((response, pageIndex) => {
      if (response && response.data) {
        successCount++;
        response.data.forEach((coin: any, index: number) => {
          const rank = pageIndex * perPage + index + 1;
          if (rank <= limit) {
            // Store both the symbol and common variations
            const symbol = coin.symbol.toUpperCase();
            tokenRankMap.set(symbol, rank);
            
            // Some tokens use different symbols on exchanges
            // Map common variations
            if (symbol === 'BTC') {
              tokenRankMap.set('BTC', rank);
            } else if (symbol === 'ETH') {
              tokenRankMap.set('ETH', rank);
            } else if (symbol === 'BNB') {
              tokenRankMap.set('BNB', rank);
            }
          }
        });
      }
    });
    
    if (successCount === 0) {
      console.warn('CoinGecko API failed, using static ranking');
      return getStaticMarketCapRanking();
    }
    
    return tokenRankMap;
  } catch (error) {
    console.error('Failed to fetch top tokens from CoinGecko:', error);
    return getStaticMarketCapRanking();
  }
};

/**
 * Static market cap ranking based on well-known cryptocurrency rankings
 * This serves as a fallback when CoinGecko API is unavailable
 */
const getStaticMarketCapRanking = (): Map<string, number> => {
  const rankings = [
    'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'STETH', 'ADA', 'AVAX',
    'DOGE', 'TRX', 'LINK', 'DOT', 'MATIC', 'SHIB', 'TON', 'DAI', 'LTC', 'BCH',
    'WBTC', 'UNI', 'ATOM', 'LEO', 'XLM', 'ICP', 'ETC', 'OKB', 'FIL', 'APT',
    'NEAR', 'ARB', 'IMX', 'OP', 'MKR', 'VET', 'HBAR', 'INJ', 'RNDR', 'STX',
    'GRT', 'LDO', 'ALGO', 'QNT', 'SAND', 'MANA', 'AAVE', 'CRO', 'FTM', 'RUNE',
    'XMR', 'THETA', 'AXS', 'EGLD', 'XTZ', 'FLOW', 'EOS', 'KAVA', 'MINA', 'CHZ',
    'APE', 'ZEC', 'NEO', 'KCS', 'GALA', 'CFX', 'MASK', 'COMP', 'DASH', 'ENJ',
    'ONE', 'ZIL', 'WAVES', 'CELO', 'BAT', 'LRC', 'DYDX', 'ROSE', 'GMT', 'SKL',
    'SXP', 'AUDIO', 'HNT', 'YFI', 'SUSHI', 'SNX', '1INCH', 'ANT', 'CRV', 'BAL',
    'REN', 'OMG', 'ZRX', 'BNT', 'KNC', 'OCEAN', 'IOTX', 'RSR', 'ALPHA', 'CTSI',
    // Extended top 200
    'PEPE', 'FLOKI', 'WLD', 'FET', 'AGIX', 'RNDR', 'BLUR', 'SEI', 'TIA', 'SUI',
    'ORDI', 'BONK', 'WIF', 'SATS', 'JUP', 'PYTH', 'DYM', 'STRK', 'MEME', 'W',
    'ENA', 'ETHFI', 'PENDLE', 'JTO', 'METIS', 'ONDO', 'ALT', 'PORTAL', 'PIXEL', 'AEVO',
    'XAI', 'MANTA', 'ACE', 'NFP', 'AI', 'XAI', 'RDNT', 'MAGIC', 'CYBER', 'HOOK',
    'ARKM', 'GNS', 'JOE', 'ID', 'COMBO', 'MAV', 'PENDLE', 'ARB', 'SUI', 'CELO',
    'LQTY', 'RPL', 'GMX', 'PERP', 'FXS', 'STG', 'SWEAT', 'APE', 'OP', 'GLMR',
    'MOVR', 'STRAX', 'POLS', 'MDT', 'TLM', 'ACH', 'BADGER', 'FIS', 'SFP', 'LIT',
    'VOXEL', 'HIGH', 'CVX', 'PEOPLE', 'OOKI', 'SPELL', 'UST', 'LUNA', 'LUNC', 'USTC',
    'GAL', 'LDO', 'EPX', 'APT', 'BSW', 'OSMO', 'HFT', 'PHB', 'HOOK', 'MAGIC',
    'HIFI', 'RPL', 'PROS', 'AGLD', 'NMR', 'GFT', 'POLYX', 'FOR', 'JASMY', 'AMP',
    // Extended beyond 200 - adding more popular tokens
    'LOOKS', 'VINU', 'T', 'SNT', 'REQ', 'TRIBE', 'ILV', 'RAD', 'RARE', 'LOKA',
    'PYR', 'BICO', 'SCRT', 'QI', 'PUNDIX', 'NULS', 'NKN', 'WAN', 'ELF', 'GTC',
    'C98', 'CLV', 'TRU', 'QUICK', 'PLA', 'FORTH', 'EZ', 'GHST', 'BOND', 'MLN',
    'FARM', 'DEP', 'TVK', 'BADGER', 'FIS', 'OM', 'POND', 'DEGO', 'RARI', 'CVP',
    'STRP', 'PNT', 'MIR', 'ACA', 'ANC', 'AUTO', 'BTCST', 'TKO', 'HARD', 'BETA',
    'VITE', 'DATA', 'XVS', 'VIDT', 'CHESS', 'ADX', 'AUCTION', 'IQ', 'PHA', 'FIRO',
    'ORN', 'UTK', 'ASR', 'ATM', 'OG', 'TCT', 'WRX', 'BEL', 'WING', 'CREAM',
    'SUN', 'BURGER', 'SPARTA', 'REEF', 'AKRO', 'UFT', 'OXT', 'COS', 'CTXC', 'BCH',
    'FTT', 'KEY', 'HIVE', 'IRIS', 'DOCK', 'PERL', 'WTC', 'TROY', 'FUN', 'BEAM',
    'VITE', 'WAXP', 'WIN', 'STPT', 'STMX', 'KAVA', 'ARDR', 'BIFI', 'CTK', 'ERN',
  ];
  
  const rankMap = new Map<string, number>();
  rankings.forEach((symbol, index) => {
    rankMap.set(symbol, index + 1);
  });
  
  return rankMap;
};

/**
 * Get all trading pairs from OKX
 */
const getOKXPairs = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${OKX_API}/public/instruments`, {
      params: { instType: 'SPOT' },
      timeout: 10000,
    });
    return response.data.data
      .filter((s: any) => s.instId.endsWith('-USDT'))
      .map((s: any) => s.instId.replace('-', ''));
  } catch (error) {
    console.error('Failed to fetch OKX pairs:', error);
    return [];
  }
};

/**
 * Get all trading pairs from Gate.io
 */
const getGatePairs = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${GATE_API}/spot/currency_pairs`, { timeout: 10000 });
    return response.data
      .filter((s: any) => s.id.endsWith('_USDT'))
      .map((s: any) => s.id.replace('_', ''));
  } catch (error) {
    console.error('Failed to fetch Gate pairs:', error);
    return [];
  }
};

/**
 * Get all trading pairs from Bitget
 */
const getBitgetPairs = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${BITGET_API}/spot/public/symbols`, { timeout: 10000 });
    return response.data.data
      .filter((s: any) => s.symbolName.endsWith('USDT'))
      .map((s: any) => s.symbolName);
  } catch (error) {
    console.error('Failed to fetch Bitget pairs:', error);
    return [];
  }
};

/**
 * Get all trading pairs from MEXC
 */
const getMEXCPairs = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${MEXC_API}/exchangeInfo`, { timeout: 10000 });
    return response.data.symbols
      .filter((s: any) => s.status === 'ENABLED' && s.symbol.endsWith('USDT'))
      .map((s: any) => s.symbol);
  } catch (error) {
    console.error('Failed to fetch MEXC pairs:', error);
    return [];
  }
};

/**
 * Get all trading pairs from Huobi
 */
const getHuobiPairs = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${HUOBI_API}/v1/common/symbols`, { timeout: 10000 });
    return response.data.data
      .filter((s: any) => s['quote-currency'] === 'usdt' && s.state === 'online')
      .map((s: any) => (s['base-currency'] + s['quote-currency']).toUpperCase());
  } catch (error) {
    console.error('Failed to fetch Huobi pairs:', error);
    return [];
  }
};

/**
 * Get all trading pairs from Bybit
 */
const getBybitPairs = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${BYBIT_API}/market/instruments-info`, {
      params: { category: 'spot' },
      timeout: 10000,
    });
    return response.data.result.list
      .filter((s: any) => s.symbol.endsWith('USDT') && s.status === 'Trading')
      .map((s: any) => s.symbol);
  } catch (error) {
    console.error('Failed to fetch Bybit pairs:', error);
    return [];
  }
};

/**
 * Get trading pairs from Binance as baseline and check availability on other exchanges
 * This follows the requirement: "以币安的所有代币为基准，获取其他交易所所有代币交易对"
 * Now enhanced to prioritize top 1000 tokens by market cap
 */
export const getCommonTradingPairs = async (): Promise<Array<{symbol: string; marketCapRank?: number}>> => {
  // Get top 1000 tokens by market cap (from CoinGecko or static list)
  const marketCapMap = await getTopTokensByMarketCap(1000);
  
  // Get Binance pairs as the baseline
  const binancePairs = await getBinancePairs();
  
  if (binancePairs.length === 0) {
    console.error('Failed to fetch Binance pairs, using default pairs');
    const defaultPairs = getDefaultPriorityPairs();
    return defaultPairs.map(symbol => ({ symbol, marketCapRank: undefined }));
  }

  // Fetch pairs from other exchanges in parallel
  const [okx, gate, bitget, mexc, huobi, bybit] = await Promise.all([
    getOKXPairs(),
    getGatePairs(),
    getBitgetPairs(),
    getMEXCPairs(),
    getHuobiPairs(),
    getBybitPairs(),
  ]);

  // Get Binance 24hr ticker data for volume-based ranking as fallback
  const binanceTickerData = await getBinance24hrTicker();

  // Count how many exchanges support each Binance pair and get market cap rank
  const pairAvailability = binancePairs.map(pair => {
    const exchanges = [okx, gate, bitget, mexc, huobi, bybit];
    const availableCount = exchanges.filter(exchangePairs => exchangePairs.includes(pair)).length;
    
    // Extract base symbol from pair (e.g., "BTCUSDT" -> "BTC")
    const baseSymbol = pair.replace('USDT', '');
    let marketCapRank = marketCapMap.get(baseSymbol);
    
    // If no market cap rank, use volume rank from Binance as fallback
    if (!marketCapRank && binanceTickerData.has(pair)) {
      const volumeRank = binanceTickerData.get(pair);
      // Add 1000 to volume rank to distinguish from market cap rank
      marketCapRank = 1000 + (volumeRank || 999);
    }
    
    return { pair, availableCount, marketCapRank };
  });

  // Sort by market cap rank (lower rank = higher market cap = higher priority)
  // Then by availability on other exchanges
  pairAvailability.sort((a, b) => {
    // Prioritize tokens with market cap ranking
    if (a.marketCapRank !== undefined && b.marketCapRank !== undefined) {
      return a.marketCapRank - b.marketCapRank;
    }
    if (a.marketCapRank !== undefined) return -1;
    if (b.marketCapRank !== undefined) return 1;
    
    // If no market cap data, sort by availability
    return b.availableCount - a.availableCount;
  });

  // Filter to include:
  // 1. Top 1000 market cap tokens that are available on at least 2 exchanges
  // 2. Other tokens available on at least 3 exchanges
  const filteredPairs = pairAvailability.filter(item => {
    if (item.marketCapRank !== undefined && item.marketCapRank <= 1000) {
      // Top 1000 tokens need to be on at least 2 exchanges (including Binance)
      return item.availableCount >= 2;
    }
    // Other tokens need to be on at least 3 exchanges
    return item.availableCount >= 3;
  });

  // Return up to 1000 pairs with their market cap ranking
  return filteredPairs.slice(0, 1000).map(item => ({
    symbol: item.pair,
    marketCapRank: item.marketCapRank,
  }));
};

/**
 * Get default priority pairs - expanded list of popular cryptocurrencies
 */
const getDefaultPriorityPairs = (): string[] => {
  return [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'SOLUSDT', 'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'LTCUSDT',
    'TRXUSDT', 'AVAXUSDT', 'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'ETCUSDT', 'XLMUSDT', 'NEARUSDT', 'APTUSDT', 'FILUSDT',
    'ALGOUSDT', 'VETUSDT', 'ICPUSDT', 'ARBUSDT', 'OPUSDT', 'INJUSDT', 'MKRUSDT', 'AAVEUSDT', 'GRTUSDT', 'SHIBUSDT',
    'PEPEUSDT', 'FLOKIUSDT', 'LDOUSDT', 'RNDRUSDT', 'FTMUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'THETAUSDT', 'IMXUSDT'
  ];
};

/**
 * Get price for a specific pair from Binance
 */
const getBinancePairPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${BINANCE_API}/ticker/price`, {
      params: { symbol: symbol.toUpperCase() },
      timeout: 5000,
    });
    return parseFloat(response.data.price);
  } catch (error) {
    return null;
  }
};

/**
 * Get price for a specific pair from OKX
 */
const getOKXPairPrice = async (symbol: string): Promise<number | null> => {
  try {
    const instId = symbol.replace('USDT', '-USDT');
    const response = await axios.get(`${OKX_API}/market/ticker`, {
      params: { instId: instId.toUpperCase() },
      timeout: 5000,
    });
    if (response.data.data && response.data.data.length > 0) {
      return parseFloat(response.data.data[0].last);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get price for a specific pair from Gate.io
 */
const getGatePairPrice = async (symbol: string): Promise<number | null> => {
  try {
    const currencyPair = symbol.replace('USDT', '_USDT');
    const response = await axios.get(`${GATE_API}/spot/tickers`, {
      params: { currency_pair: currencyPair.toUpperCase() },
      timeout: 5000,
    });
    if (response.data && response.data.length > 0) {
      return parseFloat(response.data[0].last);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get price for a specific pair from Bitget
 */
const getBitgetPairPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${BITGET_API}/spot/market/tickers`, {
      params: { symbol: symbol.toUpperCase() },
      timeout: 5000,
    });
    if (response.data.data && response.data.data.length > 0) {
      return parseFloat(response.data.data[0].lastPr);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get price for a specific pair from MEXC
 */
const getMEXCPairPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${MEXC_API}/ticker/price`, {
      params: { symbol: symbol.toUpperCase() },
      timeout: 5000,
    });
    return parseFloat(response.data.price);
  } catch (error) {
    return null;
  }
};

/**
 * Get price for a specific pair from Huobi
 */
const getHuobiPairPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${HUOBI_API}/market/detail/merged`, {
      params: { symbol: symbol.toLowerCase() },
      timeout: 5000,
    });
    if (response.data.tick) {
      return parseFloat(response.data.tick.close);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get price for a specific pair from Bybit
 */
const getBybitPairPrice = async (symbol: string): Promise<number | null> => {
  try {
    const response = await axios.get(`${BYBIT_API}/market/tickers`, {
      params: { category: 'spot', symbol: symbol.toUpperCase() },
      timeout: 5000,
    });
    if (response.data.result && response.data.result.list && response.data.result.list.length > 0) {
      return parseFloat(response.data.result.list[0].lastPrice);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get arbitrage data for a specific trading pair
 * Fetches prices from all exchanges and calculates arbitrage opportunities
 */
export const getArbitrageForPair = async (symbol: string, marketCapRank?: number): Promise<TradingPairArbitrage> => {
  const [binance, okx, gate, bitget, mexc, huobi, bybit] = await Promise.all([
    getBinancePairPrice(symbol),
    getOKXPairPrice(symbol),
    getGatePairPrice(symbol),
    getBitgetPairPrice(symbol),
    getMEXCPairPrice(symbol),
    getHuobiPairPrice(symbol),
    getBybitPairPrice(symbol),
  ]);

  const prices = {
    binance: binance ?? undefined,
    okx: okx ?? undefined,
    gate: gate ?? undefined,
    bitget: bitget ?? undefined,
    mexc: mexc ?? undefined,
    huobi: huobi ?? undefined,
    bybit: bybit ?? undefined,
  };

  // Find highest and lowest prices among valid prices
  const validPrices = Object.entries(prices)
    .filter(([_, price]) => price !== undefined)
    .map(([exchange, price]) => ({ exchange, price: price as number }));

  const exchangeCount = validPrices.length;

  // Need at least 2 exchanges with valid prices to calculate arbitrage
  if (exchangeCount < 2) {
    return { symbol, prices, exchangeCount, marketCapRank };
  }

  const highest = validPrices.reduce((max, curr) => curr.price > max.price ? curr : max);
  const lowest = validPrices.reduce((min, curr) => curr.price < min.price ? curr : min);

  const priceDiff = highest.price - lowest.price;
  const priceDiffPercent = (priceDiff / lowest.price) * 100;

  return {
    symbol,
    prices,
    highestPrice: highest.price,
    lowestPrice: lowest.price,
    highestExchange: highest.exchange,
    lowestExchange: lowest.exchange,
    priceDiff,
    priceDiffPercent,
    exchangeCount,
    marketCapRank,
  };
};

/**
 * Get arbitrage data for multiple trading pairs
 */
export const getArbitrageForPairs = async (symbolsWithRanks: Array<{symbol: string; marketCapRank?: number}>): Promise<TradingPairArbitrage[]> => {
  const results = await Promise.all(
    symbolsWithRanks.map(({ symbol, marketCapRank }) => getArbitrageForPair(symbol, marketCapRank))
  );
  return results;
};
