const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const yahooFinance = require('yahoo-finance2').default;
const cors = require('cors')({ origin: true });

const VALID_INTERVALS = new Set(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']);

function getRangeForInterval(interval) {
  if (['1m', '2m', '5m'].includes(interval)) return '1d';
  if (['15m', '30m', '60m', '90m', '1h'].includes(interval)) return '5d';
  if (interval === '1d') return '1mo';
  return '6mo';
}

function normalizeSymbol(raw) {
  return String(raw || '').trim().toUpperCase();
}

exports.getMarketData = onRequest({ region: 'us-central1' }, (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: 'Method not allowed. Use GET.',
      });
    }

    const symbol = normalizeSymbol(req.query.symbol || req.query.ticker);
    const interval = String(req.query.interval || '1m');

    if (!symbol) {
      return res.status(400).json({
        error: 'Missing required query parameter: symbol (or ticker)',
      });
    }

    if (!VALID_INTERVALS.has(interval)) {
      return res.status(400).json({
        error: `Invalid interval '${interval}'.`,
        validIntervals: Array.from(VALID_INTERVALS),
      });
    }

    try {
      const range = getRangeForInterval(interval);
      const chartOptions = { interval, range };

      const [chartData, quoteData] = await Promise.all([
        yahooFinance.chart(symbol, chartOptions),
        yahooFinance.quote(symbol),
      ]);

      const points = (chartData?.quotes || []).map((q) => ({
        timestamp: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      }));

      return res.status(200).json({
        symbol,
        interval,
        range,
        meta: chartData?.meta || null,
        quote: {
          regularMarketPrice: quoteData?.regularMarketPrice ?? null,
          regularMarketChange: quoteData?.regularMarketChange ?? null,
          regularMarketChangePercent: quoteData?.regularMarketChangePercent ?? null,
          regularMarketTime: quoteData?.regularMarketTime ?? null,
          currency: quoteData?.currency ?? null,
          exchange: quoteData?.fullExchangeName ?? quoteData?.exchange ?? null,
          shortName: quoteData?.shortName ?? quoteData?.longName ?? symbol,
        },
        points,
      });
    } catch (error) {
      const message = String(error?.message || 'Unable to fetch market data from Yahoo Finance');
      const lower = message.toLowerCase();
      const isRateLimited =
        error?.statusCode === 429 ||
        error?.response?.status === 429 ||
        lower.includes('too many requests') ||
        lower.includes('rate limit') ||
        lower.includes('429');

      logger.error('getMarketData error', {
        symbol,
        interval,
        statusCode: error?.statusCode,
        message,
      });

      if (isRateLimited) {
        return res.status(429).json({
          error: 'Upstream Yahoo Finance rate limit reached. Please retry shortly.',
          code: 'UPSTREAM_RATE_LIMIT',
        });
      }

      return res.status(502).json({
        error: 'Failed to fetch market data from upstream provider.',
        code: 'UPSTREAM_FETCH_FAILED',
        details: message,
      });
    }
  });
});
