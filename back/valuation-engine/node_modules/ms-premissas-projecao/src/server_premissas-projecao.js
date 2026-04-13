import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3003;
const DEFAULT_RISK_FREE_RATE = Number(process.env.DEFAULT_RISK_FREE_RATE || 0.045);
const DEFAULT_MARKET_RISK_PREMIUM = Number(process.env.DEFAULT_MARKET_RISK_PREMIUM || 0.055);
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

app.use(cors());
app.use(express.json());

const TERMINAL_VALUE_METHODS = ['GORDON', 'EXIT_MULTIPLE'];
const REQUIRED_FIELDS = [
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

let assumptionsByCompany = {
  1: {
    companyId: 1,
    projectionYears: 5,
    discountRate: 0.115,
    riskFreeRate: SANITIZED_DEFAULT_RISK_FREE_RATE,
    marketRiskPremium: SANITIZED_DEFAULT_MARKET_RISK_PREMIUM,
    revenueGrowthByYear: [0.07, 0.06, 0.055, 0.05, 0.045],
    projectedEbitdaMargin: 0.23,
    capexPercentOfRevenue: 0.06,
    workingCapitalChangePercentOfRevenue: 0.01,
    perpetualGrowthRate: 0.03,
    terminalValueMethod: 'GORDON',
    exitMultiple: null
  }
};

function parseNumericField(value, fieldName) {
  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue)) {
    return { error: `O campo ${fieldName} deve ser um numero valido.` };
  }
  return { value: parsedValue };
}

function parseCompanyId(value) {
  const companyId = Number(value);
  if (!Number.isInteger(companyId) || companyId <= 0) {
    return { error: 'companyId deve ser um inteiro positivo.' };
  }
  return { value: companyId };
}

function requireFields(payload, requiredFields) {
  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      return { error: `O campo ${field} e obrigatorio.` };
    }
  }
  return { value: true };
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

function validateAndNormalizeAssumptions(payload, options = {}) {
  const { forcedCompanyId } = options;
  const normalizedPayload = normalizeInput(payload);

  const requiredCheck = requireFields(normalizedPayload, REQUIRED_FIELDS);
  if (requiredCheck.error) {
    return { error: requiredCheck.error };
  }

  const companyIdResult = parseCompanyId(forcedCompanyId ?? normalizedPayload.companyId);
  if (companyIdResult.error) {
    return { error: companyIdResult.error };
  }

  if (forcedCompanyId !== undefined && Number(normalizedPayload.companyId) !== forcedCompanyId) {
    return { error: 'O companyId do corpo da requisicao deve ser igual ao da rota.' };
  }

  const projectionYearsNumber = Number(normalizedPayload.projectionYears);
  if (!Number.isInteger(projectionYearsNumber) || projectionYearsNumber <= 0) {
    return { error: 'projectionYears deve ser um inteiro positivo.' };
  }

  if (projectionYearsNumber > 20) {
    return { error: 'projectionYears nao pode ser maior que 20.' };
  }

  if (!Array.isArray(normalizedPayload.revenueGrowthByYear)) {
    return { error: 'revenueGrowthByYear deve ser um array de taxas por ano.' };
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

  const perpetualGrowthRateResult = parseNumericField(
    normalizedPayload.perpetualGrowthRate,
    'perpetualGrowthRate'
  );
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

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'ms-premissas-projecao',
    status: 'ok'
  });
});

app.get('/assumptions', (req, res) => {
  const list = Object.values(assumptionsByCompany).sort((a, b) => a.companyId - b.companyId);
  return res.status(200).json(list);
});

app.get('/assumptions/:companyId', (req, res) => {
  const companyIdResult = parseCompanyId(req.params.companyId);
  if (companyIdResult.error) {
    return res.status(400).json({ message: companyIdResult.error });
  }

  const assumptions = assumptionsByCompany[companyIdResult.value];
  if (!assumptions) {
    return res.status(404).json({ message: 'Premissas nao encontradas para esta empresa.' });
  }

  return res.status(200).json(assumptions);
});

app.post('/assumptions', (req, res) => {
  const normalized = validateAndNormalizeAssumptions(req.body);
  if (normalized.error) {
    return res.status(400).json({ message: normalized.error });
  }

  const { companyId } = normalized.value;
  if (assumptionsByCompany[companyId]) {
    return res.status(409).json({
      message: 'Ja existem premissas cadastradas para esta empresa. Use PUT para atualizar.'
    });
  }

  assumptionsByCompany[companyId] = normalized.value;
  return res.status(201).json(normalized.value);
});

app.put('/assumptions/:companyId', (req, res) => {
  const companyIdResult = parseCompanyId(req.params.companyId);
  if (companyIdResult.error) {
    return res.status(400).json({ message: companyIdResult.error });
  }

  const companyId = companyIdResult.value;
  if (!assumptionsByCompany[companyId]) {
    return res.status(404).json({ message: 'Premissas nao encontradas para esta empresa.' });
  }

  const normalized = validateAndNormalizeAssumptions(req.body, { forcedCompanyId: companyId });
  if (normalized.error) {
    return res.status(400).json({ message: normalized.error });
  }

  assumptionsByCompany[companyId] = normalized.value;
  return res.status(200).json(normalized.value);
});

app.delete('/assumptions/:companyId', (req, res) => {
  const companyIdResult = parseCompanyId(req.params.companyId);
  if (companyIdResult.error) {
    return res.status(400).json({ message: companyIdResult.error });
  }

  const companyId = companyIdResult.value;
  if (!assumptionsByCompany[companyId]) {
    return res.status(404).json({ message: 'Premissas nao encontradas para esta empresa.' });
  }

  delete assumptionsByCompany[companyId];
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Microsservico Premissas de Projecao ativo na porta ${PORT}`);
});
