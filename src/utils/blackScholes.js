const SQRT_2PI = Math.sqrt(2 * Math.PI);

function assertPositive(value, label) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite number greater than 0`);
  }
}

function standardNormalPdf(x) {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

function erf(x) {
  const sign = x >= 0 ? 1 : -1;
  const ax = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax));

  return sign * y;
}

function standardNormalCdf(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

export function blackScholes({
  underlyingPrice,
  strikePrice,
  timeToExpiry,
  volatility,
  riskFreeRate,
}) {
  assertPositive(underlyingPrice, 'underlyingPrice');
  assertPositive(strikePrice, 'strikePrice');
  assertPositive(timeToExpiry, 'timeToExpiry');
  assertPositive(volatility, 'volatility');

  if (!Number.isFinite(riskFreeRate)) {
    throw new Error('riskFreeRate must be a finite number');
  }

  const sigmaSqrtT = volatility * Math.sqrt(timeToExpiry);
  const d1 =
    (Math.log(underlyingPrice / strikePrice) +
      (riskFreeRate + (volatility * volatility) / 2) * timeToExpiry) /
    sigmaSqrtT;
  const d2 = d1 - sigmaSqrtT;

  const discountFactor = Math.exp(-riskFreeRate * timeToExpiry);
  const nd1 = standardNormalCdf(d1);
  const nd2 = standardNormalCdf(d2);
  const nMinusD1 = standardNormalCdf(-d1);
  const nMinusD2 = standardNormalCdf(-d2);
  const pdfD1 = standardNormalPdf(d1);

  const callPrice = underlyingPrice * nd1 - strikePrice * discountFactor * nd2;
  const putPrice = strikePrice * discountFactor * nMinusD2 - underlyingPrice * nMinusD1;

  const gamma = pdfD1 / (underlyingPrice * sigmaSqrtT);
  const vega = (underlyingPrice * pdfD1 * Math.sqrt(timeToExpiry)) / 100;

  const callTheta =
    (-underlyingPrice * pdfD1 * volatility) / (2 * Math.sqrt(timeToExpiry)) -
    riskFreeRate * strikePrice * discountFactor * nd2;
  const putTheta =
    (-underlyingPrice * pdfD1 * volatility) / (2 * Math.sqrt(timeToExpiry)) +
    riskFreeRate * strikePrice * discountFactor * nMinusD2;

  const callRho = (strikePrice * timeToExpiry * discountFactor * nd2) / 100;
  const putRho = (-strikePrice * timeToExpiry * discountFactor * nMinusD2) / 100;

  return {
    inputs: {
      underlyingPrice,
      strikePrice,
      timeToExpiry,
      volatility,
      riskFreeRate,
    },
    d1,
    d2,
    call: {
      price: callPrice,
      delta: nd1,
      gamma,
      theta: callTheta / 365,
      vega,
      rho: callRho,
    },
    put: {
      price: putPrice,
      delta: nd1 - 1,
      gamma,
      theta: putTheta / 365,
      vega,
      rho: putRho,
    },
  };
}

export default blackScholes;
