import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3004;

const COMPANY_SERVICE_URL = process.env.COMPANY_SERVICE_URL || 'http://localhost:3001';
const MARKET_DATA_SERVICE_URL = process.env.MARKET_DATA_SERVICE_URL || 'http://localhost:3002';
const ASSUMPTIONS_SERVICE_URL = process.env.ASSUMPTIONS_SERVICE_URL || 'http://localhost:3003';
const DEFAULT_RISK_FREE_RATE = Number(process.env.DEFAULT_RISK_FREE_RATE || 0.045);
const DEFAULT_MARKET_RISK_PREMIUM = Number(process.env.DEFAULT_MARKET_RISK_PREMIUM || 0.055);

app.use(cors());
app.use(express.json());

const TERMINAL_VALUE_METHODS = ['GORDON', 'EXIT_MULTIPLE'];
const EVENT_TYPES = [
  'COMPANY_UPSERTED',
  'COMPANY_DELETED',
  'MARKET_DATA_UPSERTED',
  'MARKET_DATA_DELETED',
  'ASSUMPTIONS_UPSERTED',
  'ASSUMPTIONS_DELETED'
];

const MARKET_DATA_REQUIRED_FIELDS = [
  'companyId',
  'currentStockPrice',
  'sharesOutstanding',
  'beta',
  'totalDebt',
  'costOfDebt',
  'effectiveTaxRate',
  'cash',
  'netDebt',
  'revenue',
  'ebitda',
  'ebit',
  'capex',
  'depreciation',
  'workingCapital'
];

const ASSUMPTIONS_REQUIRED_FIELDS = [
  'companyId',
  'projectionYears',
  'discountRate',
  'revenueGrowthByYear',
  'projectedEbitdaMargin',
  'capexPercentOfRevenue',
  'workingCapitalChangePercentOfRevenue',
  'perpetualGrowthRate',
  'terminalValueMethod'
];

let companiesById = {
  1: {
    id: 1,
    name: 'WEG S.A.',
    ticker: 'WEGE3',
    sector: 'Bens Industriais'
  }
};

let marketDataByCompany = {
  1: {
    companyId: 1,
    currentStockPrice: 39.8,
    sharesOutstanding: 13044000000,
    beta: 1.1,
    totalDebt: 307000000000,
    costOfDebt: 0.09,
    effectiveTaxRate: 0.34,
    cash: 93000000000,
    netDebt: 214000000000,
    revenue: 490000000000,
    ebitda: 265000000000,
    ebit: 195000000000,
    capex: 74000000000,
    depreciation: 70000000000,
    workingCapital: -12000000000
  }
};

let assumptionsByCompany = {
  1: {
    companyId: 1,
    projectionYears: 5,
    discountRate: 0.115,
    riskFreeRate: 0.045,
    marketRiskPremium: 0.055,
    revenueGrowthByYear: [0.07, 0.06, 0.055, 0.05, 0.045],
    projectedEbitdaMargin: 0.23,
    capexPercentOfRevenue: 0.06,
    workingCapitalChangePercentOfRevenue: 0.01,
    perpetualGrowthRate: 0.03,
    terminalValueMethod: 'GORDON',
    exitMultiple: null
  }
};

let valuationsByCompany = {};

const SANITIZED_DEFAULT_RISK_FREE_RATE =
  Number.isFinite(DEFAULT_RISK_FREE_RATE) && DEFAULT_RISK_FREE_RATE >= 0 && DEFAULT_RISK_FREE_RATE < 1
    ? DEFAULT_RISK_FREE_RATE
    : 0.045;

const SANITIZED_DEFAULT_MARKET_RISK_PREMIUM =
  Number.isFinite(DEFAULT_MARKET_RISK_PREMIUM)
  && DEFAULT_MARKET_RISK_PREMIUM >= 0
  && DEFAULT_MARKET_RISK_PREMIUM < 1
    ? DEFAULT_MARKET_RISK_PREMIUM
    : 0.055;

function nowIso() {
  return new Date().toISOString();
}

function parseNumericField(value, fieldName) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return { error: `O campo ${fieldName} deve ser um numero valido.` };
  }
  return { value: parsedValue };
}

function requireFields(payload, requiredFields) {
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      return { error: `O campo ${field} e obrigatorio.` };
    }
  }
  return { value: true };
}

function parseCompanyId(value) {
  const companyId = Number(value);
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return { error: 'companyId deve ser um inteiro positivo.' };
  }
  return { value: companyId };
}

function normalizeInput(payload) {
  const normalizedPayload = { ...payload };

  for (const field of Object.keys(normalizedPayload)) {
    if (typeof normalizedPayload[field] === 'string') {
      normalizedPayload[field] = normalizedPayload[field].replace(/,/g, '.');
    }
  }

  if (Array.isArray(normalizedPayload.revenueGrowthByYear)) {
    normalizedPayload.revenueGrowthByYear = normalizedPayload.revenueGrowthByYear.map((value) =>
      typeof value === 'string' ? value.replace(/,/g, '.') : value
    );
  }

  return normalizedPayload;
}

function ensureCompanyStub(companyId) {
  if (!companiesById[companyId]) {
    companiesById[companyId] = {
      id: companyId,
      name: `Empresa #${companyId}`,
      ticker: '-',
      sector: '-'
    };
  }
}

function validateAndNormalizeCompany(payload) {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Payload de company invalido.' };
  }

  const idResult = parseCompanyId(payload.id);
  if (idResult.error) {
    return { error: 'Campo id da empresa invalido.' };
  }

  const name = String(payload.name || '').trim();
  const ticker = String(payload.ticker || '').trim().toUpperCase();
  const sector = String(payload.sector || '').trim();

  if (!name || !ticker || !sector) {
    return { error: 'Campos obrigatorios para empresa: id, name, ticker e sector.' };
  }

  return {
    value: {
      id: idResult.value,
      name,
      ticker,
      sector
    }
  };
}

function validateAndNormalizeMarketData(payload, options = {}) {
  const { forcedCompanyId } = options;
  const normalizedPayload = normalizeInput(payload || {});

  const requiredCheck = requireFields(normalizedPayload, MARKET_DATA_REQUIRED_FIELDS);
  if (requiredCheck.error) {
    return { error: requiredCheck.error };
  }

  if (forcedCompanyId !== undefined && Number(normalizedPayload.companyId) !== forcedCompanyId) {
    return { error: 'O companyId do corpo da requisicao deve ser igual ao da rota.' };
  }

  const companyIdResult = parseCompanyId(forcedCompanyId ?? normalizedPayload.companyId);
  if (companyIdResult.error) {
    return { error: companyIdResult.error };
  }

  const normalized = { companyId: companyIdResult.value };

  for (const field of MARKET_DATA_REQUIRED_FIELDS) {
    if (field === 'companyId') {
      continue;
    }

    const parsed = parseNumericField(normalizedPayload[field], field);
    if (parsed.error) {
      return { error: parsed.error };
    }

    normalized[field] = parsed.value;
  }

  if (normalized.currentStockPrice <= 0) {
    return { error: 'currentStockPrice deve ser maior que 0.' };
  }

  if (normalized.sharesOutstanding <= 0) {
    return { error: 'sharesOutstanding deve ser maior que 0.' };
  }

  if (normalized.revenue <= 0) {
    return { error: 'revenue deve ser maior que 0.' };
  }

  if (normalized.beta <= 0) {
    return { error: 'beta deve ser maior que 0.' };
  }

  if (normalized.depreciation < 0) {
    return { error: 'depreciation deve ser maior ou igual a 0.' };
  }

  if (normalized.capex < 0) {
    return { error: 'capex deve ser maior ou igual a 0.' };
  }

  if (normalized.costOfDebt < 0 || normalized.costOfDebt > 1) {
    return { error: 'costOfDebt deve estar entre 0 e 1.' };
  }

  if (normalized.effectiveTaxRate < 0 || normalized.effectiveTaxRate > 1) {
    return { error: 'effectiveTaxRate deve estar entre 0 e 1.' };
  }

  return { value: normalized };
}

function validateAndNormalizeAssumptions(payload, options = {}) {
  const { forcedCompanyId } = options;
  const normalizedPayload = normalizeInput(payload || {});

  const requiredCheck = requireFields(normalizedPayload, ASSUMPTIONS_REQUIRED_FIELDS);
  if (requiredCheck.error) {
    return { error: requiredCheck.error };
  }

  if (forcedCompanyId !== undefined && Number(normalizedPayload.companyId) !== forcedCompanyId) {
    return { error: 'O companyId do corpo da requisicao deve ser igual ao da rota.' };
  }

  const companyIdResult = parseCompanyId(forcedCompanyId ?? normalizedPayload.companyId);
  if (companyIdResult.error) {
    return { error: companyIdResult.error };
  }

  const projectionYearsNumber = Number(normalizedPayload.projectionYears);
  if (!Number.isInteger(projectionYearsNumber) || projectionYearsNumber <= 0) {
    return { error: 'projectionYears deve ser um inteiro positivo.' };
  }

  if (projectionYearsNumber > 20) {
    return { error: 'projectionYears nao pode ser maior que 20.' };
  }

  if (!Array.isArray(normalizedPayload.revenueGrowthByYear)) {
    return { error: 'revenueGrowthByYear deve ser um array.' };
  }

  if (normalizedPayload.revenueGrowthByYear.length !== projectionYearsNumber) {
    return { error: 'revenueGrowthByYear deve ter exatamente projectionYears elementos.' };
  }

  const normalizedRevenueGrowth = [];

  for (const growth of normalizedPayload.revenueGrowthByYear) {
    const growthResult = parseNumericField(growth, 'revenueGrowthByYear');
    if (growthResult.error) {
      return { error: growthResult.error };
    }

    if (growthResult.value <= -1) {
      return { error: 'Cada crescimento de receita deve ser maior que -1.' };
    }

    normalizedRevenueGrowth.push(growthResult.value);
  }

  const discountRateResult = parseNumericField(normalizedPayload.discountRate, 'discountRate');
  if (discountRateResult.error) {
    return { error: discountRateResult.error };
  }

  if (discountRateResult.value <= 0 || discountRateResult.value >= 1) {
    return { error: 'discountRate deve ser maior que 0 e menor que 1.' };
  }

  const riskFreeRateResult = parseNumericField(
    normalizedPayload.riskFreeRate ?? SANITIZED_DEFAULT_RISK_FREE_RATE,
    'riskFreeRate'
  );
  if (riskFreeRateResult.error) {
    return { error: riskFreeRateResult.error };
  }

  if (riskFreeRateResult.value < 0 || riskFreeRateResult.value >= 1) {
    return { error: 'riskFreeRate deve ser maior ou igual a 0 e menor que 1.' };
  }

  const marketRiskPremiumResult = parseNumericField(
    normalizedPayload.marketRiskPremium ?? SANITIZED_DEFAULT_MARKET_RISK_PREMIUM,
    'marketRiskPremium'
  );
  if (marketRiskPremiumResult.error) {
    return { error: marketRiskPremiumResult.error };
  }

  if (marketRiskPremiumResult.value < 0 || marketRiskPremiumResult.value >= 1) {
    return { error: 'marketRiskPremium deve ser maior ou igual a 0 e menor que 1.' };
  }

  const ebitdaMarginResult = parseNumericField(normalizedPayload.projectedEbitdaMargin, 'projectedEbitdaMargin');
  if (ebitdaMarginResult.error) {
    return { error: ebitdaMarginResult.error };
  }

  if (ebitdaMarginResult.value < 0 || ebitdaMarginResult.value > 1) {
    return { error: 'projectedEbitdaMargin deve estar entre 0 e 1.' };
  }

  const capexPercentResult = parseNumericField(normalizedPayload.capexPercentOfRevenue, 'capexPercentOfRevenue');
  if (capexPercentResult.error) {
    return { error: capexPercentResult.error };
  }

  if (capexPercentResult.value < 0 || capexPercentResult.value > 1) {
    return { error: 'capexPercentOfRevenue deve estar entre 0 e 1.' };
  }

  const workingCapitalResult = parseNumericField(
    normalizedPayload.workingCapitalChangePercentOfRevenue,
    'workingCapitalChangePercentOfRevenue'
  );
  if (workingCapitalResult.error) {
    return { error: workingCapitalResult.error };
  }

  if (workingCapitalResult.value <= -1 || workingCapitalResult.value >= 1) {
    return { error: 'workingCapitalChangePercentOfRevenue deve estar entre -1 e 1.' };
  }

  const perpetualGrowthRateResult = parseNumericField(normalizedPayload.perpetualGrowthRate, 'perpetualGrowthRate');
  if (perpetualGrowthRateResult.error) {
    return { error: perpetualGrowthRateResult.error };
  }

  if (perpetualGrowthRateResult.value < 0 || perpetualGrowthRateResult.value >= discountRateResult.value) {
    return { error: 'perpetualGrowthRate deve ser maior ou igual a 0 e menor que discountRate.' };
  }

  const method = String(normalizedPayload.terminalValueMethod).trim().toUpperCase();
  if (!TERMINAL_VALUE_METHODS.includes(method)) {
    return { error: 'terminalValueMethod deve ser GORDON ou EXIT_MULTIPLE.' };
  }

  let normalizedExitMultiple = null;
  if (method === 'EXIT_MULTIPLE') {
    const exitMultipleResult = parseNumericField(normalizedPayload.exitMultiple, 'exitMultiple');
    if (exitMultipleResult.error) {
      return { error: 'exitMultiple e obrigatorio quando terminalValueMethod for EXIT_MULTIPLE.' };
    }

    if (exitMultipleResult.value <= 0) {
      return { error: 'exitMultiple deve ser maior que 0.' };
    }

    normalizedExitMultiple = exitMultipleResult.value;
  }

  return {
    value: {
      companyId: companyIdResult.value,
      projectionYears: projectionYearsNumber,
      discountRate: discountRateResult.value,
      riskFreeRate: riskFreeRateResult.value,
      marketRiskPremium: marketRiskPremiumResult.value,
      revenueGrowthByYear: normalizedRevenueGrowth,
      projectedEbitdaMargin: ebitdaMarginResult.value,
      capexPercentOfRevenue: capexPercentResult.value,
      workingCapitalChangePercentOfRevenue: workingCapitalResult.value,
      perpetualGrowthRate: perpetualGrowthRateResult.value,
      terminalValueMethod: method,
      exitMultiple: normalizedExitMultiple
    }
  };
}

function applyEvent(event) {
  if (!event || typeof event !== 'object') {
    return { error: 'Evento invalido.' };
  }

  const eventType = String(event.eventType || '').trim().toUpperCase();
  if (!EVENT_TYPES.includes(eventType)) {
    return { error: `eventType invalido. Tipos permitidos: ${EVENT_TYPES.join(', ')}` };
  }

  if (eventType === 'COMPANY_UPSERTED') {
    const normalized = validateAndNormalizeCompany(event.payload);
    if (normalized.error) {
      return { error: normalized.error };
    }

    companiesById[normalized.value.id] = normalized.value;
    return { value: { eventType, companyId: normalized.value.id } };
  }

  if (eventType === 'COMPANY_DELETED') {
    const idResult = parseCompanyId(event.companyId);
    if (idResult.error) {
      return { error: idResult.error };
    }

    const companyId = idResult.value;
    delete companiesById[companyId];
    delete marketDataByCompany[companyId];
    delete assumptionsByCompany[companyId];
    delete valuationsByCompany[companyId];

    return { value: { eventType, companyId } };
  }

  if (eventType === 'MARKET_DATA_UPSERTED') {
    const normalized = validateAndNormalizeMarketData(event.payload);
    if (normalized.error) {
      return { error: normalized.error };
    }

    const { companyId } = normalized.value;
    ensureCompanyStub(companyId);
    marketDataByCompany[companyId] = normalized.value;
    delete valuationsByCompany[companyId];

    return { value: { eventType, companyId } };
  }

  if (eventType === 'MARKET_DATA_DELETED') {
    const idResult = parseCompanyId(event.companyId);
    if (idResult.error) {
      return { error: idResult.error };
    }

    const companyId = idResult.value;
    delete marketDataByCompany[companyId];
    delete valuationsByCompany[companyId];

    return { value: { eventType, companyId } };
  }

  if (eventType === 'ASSUMPTIONS_UPSERTED') {
    const normalized = validateAndNormalizeAssumptions(event.payload);
    if (normalized.error) {
      return { error: normalized.error };
    }

    const { companyId } = normalized.value;
    ensureCompanyStub(companyId);
    assumptionsByCompany[companyId] = normalized.value;
    delete valuationsByCompany[companyId];

    return { value: { eventType, companyId } };
  }

  if (eventType === 'ASSUMPTIONS_DELETED') {
    const idResult = parseCompanyId(event.companyId);
    if (idResult.error) {
      return { error: idResult.error };
    }

    const companyId = idResult.value;
    delete assumptionsByCompany[companyId];
    delete valuationsByCompany[companyId];

    return { value: { eventType, companyId } };
  }

  return { error: 'Evento nao tratado.' };
}

function calculateValuation(companyId) {
  const marketData = marketDataByCompany[companyId];
  const assumptions = assumptionsByCompany[companyId];

  if (!marketData) {
    return { error: 'Market Data nao encontrado para esta empresa.' };
  }

  if (!assumptions) {
    return { error: 'Premissas de projecao nao encontradas para esta empresa.' };
  }

  const projectedCashFlows = [];

  const manualDiscountRate = assumptions.discountRate;
  const riskFreeRate = Number.isFinite(Number(assumptions.riskFreeRate))
    ? Number(assumptions.riskFreeRate)
    : SANITIZED_DEFAULT_RISK_FREE_RATE;
  const marketRiskPremium = Number.isFinite(Number(assumptions.marketRiskPremium))
    ? Number(assumptions.marketRiskPremium)
    : SANITIZED_DEFAULT_MARKET_RISK_PREMIUM;

  const costOfEquity = riskFreeRate + (marketData.beta * marketRiskPremium);
  const costOfDebtAfterTax = marketData.costOfDebt * (1 - marketData.effectiveTaxRate);
  const marketValueEquity = marketData.currentStockPrice * marketData.sharesOutstanding;
  const marketValueDebt = marketData.totalDebt;
  const capitalBase = marketValueEquity + marketValueDebt;

  if (capitalBase <= 0) {
    return { error: 'Nao foi possivel calcular WACC de referencia: estrutura de capital invalida.' };
  }

  const waccReference = (
    (costOfEquity * marketValueEquity) + (costOfDebtAfterTax * marketValueDebt)
  ) / capitalBase;

  const depreciationRate = marketData.revenue > 0
    ? marketData.depreciation / marketData.revenue
    : 0;

  let previousRevenue = marketData.revenue;

  for (let i = 0; i < assumptions.projectionYears; i += 1) {
    const year = i + 1;
    const growthRate = assumptions.revenueGrowthByYear[i];

    const revenue = previousRevenue * (1 + growthRate);
    const ebitda = revenue * assumptions.projectedEbitdaMargin;
    const depreciation = revenue * depreciationRate;
    const ebit = ebitda - depreciation;
    const nopat = ebit * (1 - marketData.effectiveTaxRate);
    const capex = revenue * assumptions.capexPercentOfRevenue;
    const workingCapitalVariation = revenue * assumptions.workingCapitalChangePercentOfRevenue;
    const fcff = nopat + depreciation - capex - workingCapitalVariation;

    const discountFactor = (1 + manualDiscountRate) ** year;
    const presentValueFcff = fcff / discountFactor;

    projectedCashFlows.push({
      year,
      growthRate,
      revenue,
      ebitda,
      depreciation,
      ebit,
      nopat,
      capex,
      workingCapitalVariation,
      fcff,
      discountFactor,
      presentValueFcff
    });

    previousRevenue = revenue;
  }

  const discountedCashFlows = projectedCashFlows.reduce(
    (accumulator, yearData) => accumulator + yearData.presentValueFcff,
    0
  );

  const lastYear = projectedCashFlows[projectedCashFlows.length - 1];
  if (!lastYear) {
    return { error: 'Nao foi possivel calcular fluxo de caixa projetado.' };
  }

  let terminalValue = 0;
  let terminalValueDetails = {};

  if (assumptions.terminalValueMethod === 'GORDON') {
    const nextYearFcff = lastYear.fcff * (1 + assumptions.perpetualGrowthRate);
    const denominator = manualDiscountRate - assumptions.perpetualGrowthRate;

    if (denominator <= 0) {
      return { error: 'discountRate deve ser maior que perpetualGrowthRate no metodo GORDON.' };
    }

    terminalValue = nextYearFcff / denominator;
    terminalValueDetails = {
      method: 'GORDON',
      nextYearFcff,
      denominator
    };
  } else {
    terminalValue = lastYear.ebitda * assumptions.exitMultiple;
    terminalValueDetails = {
      method: 'EXIT_MULTIPLE',
      finalYearEbitda: lastYear.ebitda,
      exitMultiple: assumptions.exitMultiple
    };
  }

  const presentValueTerminalValue = terminalValue / ((1 + manualDiscountRate) ** assumptions.projectionYears);
  const enterpriseValue = discountedCashFlows + presentValueTerminalValue;
  const equityValue = enterpriseValue - marketData.netDebt;

  const fairValuePerShare = marketData.sharesOutstanding > 0
    ? equityValue / marketData.sharesOutstanding
    : null;

  const marketCapitalization = marketData.currentStockPrice * marketData.sharesOutstanding;
  const upsidePercent = fairValuePerShare !== null && marketData.currentStockPrice > 0
    ? (fairValuePerShare / marketData.currentStockPrice) - 1
    : null;

  const response = {
    companyId,
    company: companiesById[companyId] || null,
    assumptions,
    marketData,
    projectedCashFlows,
    terminalValue: {
      ...terminalValueDetails,
      terminalValue,
      presentValueTerminalValue
    },
    rates: {
      manualDiscountRate,
      riskFreeRate,
      marketRiskPremium,
      costOfEquity,
      costOfDebtAfterTax,
      marketValueEquity,
      marketValueDebt,
      waccReference,
      discountRateMinusWaccReference: manualDiscountRate - waccReference
    },
    valuation: {
      discountedCashFlows,
      enterpriseValue,
      equityValue,
      marketCapitalization,
      currentStockPrice: marketData.currentStockPrice,
      fairValuePerShare,
      upsidePercent
    },
    calculatedAt: nowIso()
  };

  valuationsByCompany[companyId] = response;
  return { value: response };
}

async function fetchJsonOrFail(url, sourceName) {
  if (typeof fetch !== 'function') {
    throw new Error('Runtime sem suporte ao fetch nativo do Node.js.');
  }

  const response = await fetch(url);

  if (!response.ok) {
    let message = '';

    try {
      const body = await response.json();
      message = body?.message ? `: ${body.message}` : '';
    } catch {
      message = '';
    }

    throw new Error(`${sourceName} retornou status ${response.status}${message}`);
  }

  return response.json();
}

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'ms-valuation-engine',
    status: 'ok',
    counters: {
      companies: Object.keys(companiesById).length,
      marketData: Object.keys(marketDataByCompany).length,
      assumptions: Object.keys(assumptionsByCompany).length,
      valuations: Object.keys(valuationsByCompany).length
    }
  });
});

app.get('/events/types', (req, res) => {
  res.status(200).json({ eventTypes: EVENT_TYPES });
});

app.post('/events', (req, res) => {
  const events = Array.isArray(req.body) ? req.body : [req.body];

  if (events.length === 0) {
    return res.status(400).json({ message: 'Nenhum evento enviado.' });
  }

  const applied = [];

  for (let index = 0; index < events.length; index += 1) {
    const result = applyEvent(events[index]);

    if (result.error) {
      return res.status(400).json({
        message: result.error,
        failedAtIndex: index,
        appliedCount: applied.length
      });
    }

    applied.push(result.value);
  }

  return res.status(202).json({
    message: 'Eventos processados com sucesso.',
    applied
  });
});

app.get('/state', (req, res) => {
  const companyIds = Array.from(
    new Set([
      ...Object.keys(companiesById),
      ...Object.keys(marketDataByCompany),
      ...Object.keys(assumptionsByCompany)
    ])
  )
    .map(Number)
    .sort((a, b) => a - b);

  const state = companyIds.map((companyId) => ({
    companyId,
    company: companiesById[companyId] || null,
    hasMarketData: Boolean(marketDataByCompany[companyId]),
    hasAssumptions: Boolean(assumptionsByCompany[companyId]),
    hasCachedValuation: Boolean(valuationsByCompany[companyId])
  }));

  return res.status(200).json(state);
});

app.get('/valuations', (req, res) => {
  const list = Object.values(valuationsByCompany).sort((a, b) => a.companyId - b.companyId);
  return res.status(200).json(list);
});

app.get('/valuation/:companyId', (req, res) => {
  const companyIdResult = parseCompanyId(req.params.companyId);
  if (companyIdResult.error) {
    return res.status(400).json({ message: companyIdResult.error });
  }

  const cached = valuationsByCompany[companyIdResult.value];

  if (!cached) {
    return res.status(404).json({
      message: 'Valuation ainda nao calculado para esta empresa. Use /valuation/:companyId/recalculate ou /valuation/:companyId/sync-from-services.'
    });
  }

  return res.status(200).json(cached);
});

app.post('/valuation/:companyId/recalculate', (req, res) => {
  const companyIdResult = parseCompanyId(req.params.companyId);
  if (companyIdResult.error) {
    return res.status(400).json({ message: companyIdResult.error });
  }

  const result = calculateValuation(companyIdResult.value);
  if (result.error) {
    return res.status(404).json({ message: result.error });
  }

  return res.status(200).json(result.value);
});

app.post('/valuation/recalculate-all', (req, res) => {
  const companyIds = Object.keys(companiesById).map(Number).sort((a, b) => a - b);
  const computed = [];
  const skipped = [];

  for (const companyId of companyIds) {
    const result = calculateValuation(companyId);

    if (result.error) {
      skipped.push({ companyId, reason: result.error });
      continue;
    }

    computed.push({
      companyId,
      enterpriseValue: result.value.valuation.enterpriseValue,
      equityValue: result.value.valuation.equityValue,
      fairValuePerShare: result.value.valuation.fairValuePerShare
    });
  }

  return res.status(200).json({
    computedCount: computed.length,
    skippedCount: skipped.length,
    computed,
    skipped
  });
});

app.post('/valuation/:companyId/sync-from-services', async (req, res) => {
  const companyIdResult = parseCompanyId(req.params.companyId);
  if (companyIdResult.error) {
    return res.status(400).json({ message: companyIdResult.error });
  }

  const companyId = companyIdResult.value;

  try {
    const [marketData, assumptions] = await Promise.all([
      fetchJsonOrFail(`${MARKET_DATA_SERVICE_URL}/market-data/${companyId}`, 'ms-market-data'),
      fetchJsonOrFail(`${ASSUMPTIONS_SERVICE_URL}/assumptions/${companyId}`, 'ms-premissas-projecao')
    ]);

    const marketDataNormalized = validateAndNormalizeMarketData(marketData, { forcedCompanyId: companyId });
    if (marketDataNormalized.error) {
      return res.status(400).json({ message: marketDataNormalized.error });
    }

    const assumptionsNormalized = validateAndNormalizeAssumptions(assumptions, { forcedCompanyId: companyId });
    if (assumptionsNormalized.error) {
      return res.status(400).json({ message: assumptionsNormalized.error });
    }

    marketDataByCompany[companyId] = marketDataNormalized.value;
    assumptionsByCompany[companyId] = assumptionsNormalized.value;

    try {
      const companies = await fetchJsonOrFail(`${COMPANY_SERVICE_URL}/empresas`, 'ms-gestao-empresas');
      const company = Array.isArray(companies)
        ? companies.find((entry) => Number(entry.id) === companyId)
        : null;

      if (company) {
        const companyNormalized = validateAndNormalizeCompany(company);
        if (!companyNormalized.error) {
          companiesById[companyId] = companyNormalized.value;
        } else {
          ensureCompanyStub(companyId);
        }
      } else {
        ensureCompanyStub(companyId);
      }
    } catch {
      ensureCompanyStub(companyId);
    }

    const valuation = calculateValuation(companyId);
    if (valuation.error) {
      return res.status(400).json({ message: valuation.error });
    }

    return res.status(200).json({
      message: 'Sincronizacao concluida e valuation calculado com sucesso.',
      valuation: valuation.value
    });
  } catch (error) {
    return res.status(502).json({
      message: `Falha ao sincronizar dados com os outros microsservicos: ${error.message}`
    });
  }
});

app.listen(PORT, () => {
  console.log(`Microsservico Valuation Engine ativo na porta ${PORT}`);
});
