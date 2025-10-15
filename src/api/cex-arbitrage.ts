import axios from 'axios';

// CEX API endpoints
const BINANCE_API = 'https://api.binance.com/api/v3';
const OKX_API = 'https://www.okx.com/api/v5';
const GATE_API = 'https://api.gateio.ws/api/v4';
const BITGET_API = 'https://api.bitget.com/api/v2';
const MEXC_API = 'https://api.mexc.com/api/v3';
const HUOBI_API = 'https://api.huobi.pro';
const BYBIT_API = 'https://api.bybit.com/v5';

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
 */
export const getCommonTradingPairs = async (): Promise<string[]> => {
  // Get Binance pairs as the baseline
  const binancePairs = await getBinancePairs();
  
  if (binancePairs.length === 0) {
    console.error('Failed to fetch Binance pairs, using default pairs');
    return getDefaultPriorityPairs();
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

  // Count how many exchanges support each Binance pair
  const pairAvailability = binancePairs.map(pair => {
    const exchanges = [okx, gate, bitget, mexc, huobi, bybit];
    const availableCount = exchanges.filter(exchangePairs => exchangePairs.includes(pair)).length;
    return { pair, availableCount };
  });

  // Sort by availability (pairs available on more exchanges have higher priority)
  pairAvailability.sort((a, b) => b.availableCount - a.availableCount);

  // Get priority pairs based on popularity
  const priorityPairs = getDefaultPriorityPairs();
  
  // Filter to include priority pairs that are available on at least 2 exchanges
  const highPriorityPairs = pairAvailability
    .filter(item => priorityPairs.includes(item.pair) && item.availableCount >= 2)
    .map(item => item.pair);
  
  // If we have enough high priority pairs, return them
  if (highPriorityPairs.length >= 30) {
    return highPriorityPairs.slice(0, 50);
  }
  
  // Otherwise, include other pairs available on at least 3 exchanges
  const additionalPairs = pairAvailability
    .filter(item => !priorityPairs.includes(item.pair) && item.availableCount >= 3)
    .map(item => item.pair)
    .slice(0, 50 - highPriorityPairs.length);
  
  return [...highPriorityPairs, ...additionalPairs];
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
export const getArbitrageForPair = async (symbol: string): Promise<TradingPairArbitrage> => {
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
    return { symbol, prices, exchangeCount };
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
  };
};

/**
 * Get arbitrage data for multiple trading pairs
 */
export const getArbitrageForPairs = async (symbols: string[]): Promise<TradingPairArbitrage[]> => {
  const results = await Promise.all(symbols.map(symbol => getArbitrageForPair(symbol)));
  return results;
};
