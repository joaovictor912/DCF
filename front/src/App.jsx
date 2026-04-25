import { useEffect, useMemo, useState } from 'react';
import './App.css';
import InstructiveScreen from './screens/InstructiveScreen';
import HomeScreen from './screens/HomeScreen';
import CompaniesScreen from './screens/CompaniesScreen';
import MarketDataScreen from './screens/MarketDataScreen';
import AssumptionsScreen from './screens/AssumptionsScreen';
import ValuationScreen from './screens/ValuationScreen';
import SensitivityScreen from './screens/SensitivityScreen';

// ---------------------------------------------------------------------------
// OFFLINE SEED — Meta Platforms FY2024 (audited, sourced from SEC 10-K)
// ---------------------------------------------------------------------------
const META_COMPANY = { id: 1, name: 'Meta Platforms', ticker: 'META', sector: 'Technology' };

const META_MARKET_DATA = {
  companyId: 1,
  currentStockPrice: 589.00,
  sharesOutstanding: 2540000000,
  beta: 1.31,
  totalDebt: 28830000000,
  costOfDebt: 0.04,
  effectiveTaxRate: 0.15,
  cash: 43000000000,
  netDebt: -14170000000,
  revenue: 164501000000,
  ebitda: 84253000000,
  ebit: 69380000000,
  capex: 37725000000,
  depreciation: 14873000000,
  workingCapital: 0
};

const META_ASSUMPTIONS = {
  companyId: 1,
  projectionYears: 5,
  discountRate: 0.10,
  riskFreeRate: 0.045,
  marketRiskPremium: 0.055,
  revenueGrowthByYear: [0.15, 0.13, 0.11, 0.09, 0.08],
  projectedEbitdaMargin: 0.512,
  capexPercentOfRevenue: 0.20,
  workingCapitalChangePercentOfRevenue: 0.005,
  perpetualGrowthRate: 0.03,
  terminalValueMethod: 'GORDON',
  exitMultiple: null
};

// ---------------------------------------------------------------------------
// OFFLINE DCF ENGINE — mirrors server_valuation-engine.js logic exactly
// ---------------------------------------------------------------------------
function calculateValuationOffline(marketData, assumptions) {
  const DEFAULT_RISK_FREE_RATE = 0.045;
  const DEFAULT_MARKET_RISK_PREMIUM = 0.055;

  const riskFreeRate = Number.isFinite(Number(assumptions.riskFreeRate))
    ? Number(assumptions.riskFreeRate)
    : DEFAULT_RISK_FREE_RATE;
  const marketRiskPremium = Number.isFinite(Number(assumptions.marketRiskPremium))
    ? Number(assumptions.marketRiskPremium)
    : DEFAULT_MARKET_RISK_PREMIUM;

  const hasManualDiscountRate =
    assumptions.discountRate !== null && assumptions.discountRate !== undefined && assumptions.discountRate !== '';
  const manualDiscountRate = hasManualDiscountRate
    ? Number(assumptions.discountRate)
    : null;

  const costOfEquity = riskFreeRate + marketData.beta * marketRiskPremium;
  const costOfDebtAfterTax = marketData.costOfDebt * (1 - marketData.effectiveTaxRate);
  const marketValueEquity = marketData.currentStockPrice * marketData.sharesOutstanding;
  const marketValueDebt = marketData.totalDebt;
  const capitalBase = marketValueEquity + marketValueDebt;

  if (capitalBase <= 0) return null;

  const waccReference =
    (costOfEquity * marketValueEquity + costOfDebtAfterTax * marketValueDebt) / capitalBase;

  const effectiveDiscountRate = manualDiscountRate ?? waccReference;
  if (effectiveDiscountRate <= 0 || effectiveDiscountRate >= 1) return null;

  const depreciationRate =
    marketData.revenue > 0 ? marketData.depreciation / marketData.revenue : 0;

  const projectedCashFlows = [];
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
    const discountFactor = (1 + effectiveDiscountRate) ** year;
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
    (acc, y) => acc + y.presentValueFcff,
    0
  );

  const lastYear = projectedCashFlows[projectedCashFlows.length - 1];
  if (!lastYear) return null;

  let terminalValue = 0;
  let terminalValueDetails = {};

  if (assumptions.terminalValueMethod === 'GORDON') {
    const nextYearFcff = lastYear.fcff * (1 + assumptions.perpetualGrowthRate);
    const denominator = effectiveDiscountRate - assumptions.perpetualGrowthRate;
    if (denominator <= 0) return null;
    terminalValue = nextYearFcff / denominator;
    terminalValueDetails = { method: 'GORDON', nextYearFcff, denominator };
  } else {
    terminalValue = lastYear.ebitda * assumptions.exitMultiple;
    terminalValueDetails = {
      method: 'EXIT_MULTIPLE',
      finalYearEbitda: lastYear.ebitda,
      exitMultiple: assumptions.exitMultiple
    };
  }

  const presentValueTerminalValue =
    terminalValue / (1 + effectiveDiscountRate) ** assumptions.projectionYears;
  const enterpriseValue = discountedCashFlows + presentValueTerminalValue;
  const derivedNetDebt = marketData.totalDebt - marketData.cash;
  const equityValue = enterpriseValue - derivedNetDebt;
  const fairValuePerShare =
    marketData.sharesOutstanding > 0 ? equityValue / marketData.sharesOutstanding : null;
  const marketCapitalization = marketData.currentStockPrice * marketData.sharesOutstanding;
  const upsidePercent =
    fairValuePerShare !== null && marketData.currentStockPrice > 0
      ? fairValuePerShare / marketData.currentStockPrice - 1
      : null;

  return {
    companyId: marketData.companyId,
    company: META_COMPANY,
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
      discountRateMinusWaccReference: effectiveDiscountRate - waccReference
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
    calculatedAt: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// OFFLINE SENSITIVITY ENGINE — mirrors server_sensitivity-matrix.js exactly
// ---------------------------------------------------------------------------
function buildSensitivityMatrices(marketData, assumptions) {
  const DEFAULT_WACC_STEPS = [-0.02, -0.01, 0, 0.01, 0.02];
  const DEFAULT_G_STEPS = [-0.01, -0.005, 0, 0.005, 0.01];
  const DEFAULT_EBITDA_MARGIN_STEPS = [-0.03, -0.015, 0, 0.015, 0.03];

  // Derive effective WACC the same way the valuation engine does
  const riskFreeRate = assumptions.riskFreeRate ?? 0.045;
  const marketRiskPremium = assumptions.marketRiskPremium ?? 0.055;
  const costOfEquity = riskFreeRate + marketData.beta * marketRiskPremium;
  const costOfDebtAfterTax = marketData.costOfDebt * (1 - marketData.effectiveTaxRate);
  const marketValueEquity = marketData.currentStockPrice * marketData.sharesOutstanding;
  const marketValueDebt = marketData.totalDebt;
  const capitalBase = marketValueEquity + marketValueDebt;
  const waccReference = (costOfEquity * marketValueEquity + costOfDebtAfterTax * marketValueDebt) / capitalBase;
  const baseWacc = assumptions.discountRate ?? waccReference;
  const baseG = assumptions.perpetualGrowthRate;
  const baseEbitdaMargin = assumptions.projectedEbitdaMargin;
  const depreciationRate = marketData.revenue > 0 ? marketData.depreciation / marketData.revenue : 0;
  const derivedNetDebt = marketData.totalDebt - marketData.cash;

  const commonInputs = {
    baseRevenue: marketData.revenue,
    projectionYears: assumptions.projectionYears,
    revenueGrowthByYear: assumptions.revenueGrowthByYear,
    projectedEbitdaMargin: baseEbitdaMargin,
    capexPercentOfRevenue: assumptions.capexPercentOfRevenue,
    workingCapitalChangePercentOfRevenue: assumptions.workingCapitalChangePercentOfRevenue,
    effectiveTaxRate: marketData.effectiveTaxRate,
    depreciationRate,
    discountRate: baseWacc,
    perpetualGrowthRate: baseG,
    netDebt: derivedNetDebt,
    sharesOutstanding: marketData.sharesOutstanding
  };

  function calculateFairValue(params) {
    const {
      baseRevenue, projectionYears, revenueGrowthByYear,
      projectedEbitdaMargin, capexPercentOfRevenue,
      workingCapitalChangePercentOfRevenue, effectiveTaxRate,
      depreciationRate: dr, discountRate, perpetualGrowthRate,
      netDebt: nd, sharesOutstanding: shares
    } = params;

    if (!Number.isFinite(discountRate) || !Number.isFinite(perpetualGrowthRate)) return null;
    if (discountRate <= perpetualGrowthRate) return null;
    if (!Number.isFinite(baseRevenue) || baseRevenue <= 0) return null;

    let previousRevenue = baseRevenue;
    let discountedCashFlows = 0;
    let lastYearFcff = null;

    for (let i = 0; i < projectionYears; i += 1) {
      const year = i + 1;
      const growthRate = Number.isFinite(Number(revenueGrowthByYear[i])) ? Number(revenueGrowthByYear[i]) : 0;
      const revenue = previousRevenue * (1 + growthRate);
      const ebitda = revenue * projectedEbitdaMargin;
      const depreciation = revenue * dr;
      const ebit = ebitda - depreciation;
      const nopat = ebit * (1 - effectiveTaxRate);
      const capex = revenue * capexPercentOfRevenue;
      const wcVariation = revenue * workingCapitalChangePercentOfRevenue;
      const fcff = nopat + depreciation - capex - wcVariation;
      discountedCashFlows += fcff / (1 + discountRate) ** year;
      lastYearFcff = fcff;
      previousRevenue = revenue;
    }

    if (!Number.isFinite(lastYearFcff)) return null;

    const nextYearFcff = lastYearFcff * (1 + perpetualGrowthRate);
    const tv = nextYearFcff / (discountRate - perpetualGrowthRate);
    const pvTv = tv / (1 + discountRate) ** projectionYears;
    const ev = discountedCashFlows + pvTv;
    const eq = ev - nd;
    if (!Number.isFinite(eq) || shares <= 0) return null;
    const fvps = eq / shares;
    return Number.isFinite(fvps) ? Math.round((fvps + Number.EPSILON) * 100) / 100 : null;
  }

  // Matrix 1: WACC vs g
  const waccVsG = {
    rowAxis: 'discountRate',
    columnAxis: 'perpetualGrowthRate',
    rows: DEFAULT_WACC_STEPS.map((waccStep) => ({
      waccStep,
      discountRate: baseWacc + waccStep,
      cells: DEFAULT_G_STEPS.map((gStep) => {
        const g = baseG + gStep;
        const wacc = baseWacc + waccStep;
        return {
          gStep,
          perpetualGrowthRate: g,
          fairValuePerShare: calculateFairValue({ ...commonInputs, discountRate: wacc, perpetualGrowthRate: g })
        };
      })
    }))
  };

  // Matrix 2: WACC vs EBITDA Margin
  const waccVsEbitdaMargin = {
    rowAxis: 'discountRate',
    columnAxis: 'projectedEbitdaMargin',
    rows: DEFAULT_WACC_STEPS.map((waccStep) => ({
      waccStep,
      discountRate: baseWacc + waccStep,
      cells: DEFAULT_EBITDA_MARGIN_STEPS.map((marginStep) => {
        const margin = baseEbitdaMargin + marginStep;
        const wacc = baseWacc + waccStep;
        return {
          ebitdaMarginStep: marginStep,
          projectedEbitdaMargin: margin,
          fairValuePerShare: calculateFairValue({ ...commonInputs, discountRate: wacc, projectedEbitdaMargin: margin })
        };
      })
    }))
  };

  // Matrix 3: g vs EBITDA Margin
  const gVsEbitdaMargin = {
    rowAxis: 'perpetualGrowthRate',
    columnAxis: 'projectedEbitdaMargin',
    rows: DEFAULT_G_STEPS.map((gStep) => ({
      gStep,
      perpetualGrowthRate: baseG + gStep,
      cells: DEFAULT_EBITDA_MARGIN_STEPS.map((marginStep) => {
        const g = baseG + gStep;
        const margin = baseEbitdaMargin + marginStep;
        return {
          ebitdaMarginStep: marginStep,
          projectedEbitdaMargin: margin,
          fairValuePerShare: calculateFairValue({ ...commonInputs, perpetualGrowthRate: g, projectedEbitdaMargin: margin })
        };
      })
    }))
  };

  return {
    companyId: marketData.companyId,
    company: META_COMPANY,
    baseAssumptions: {
      discountRate: baseWacc,
      perpetualGrowthRate: baseG,
      projectedEbitdaMargin: baseEbitdaMargin
    },
    baseFairValuePerShare: calculateFairValue(commonInputs),
    stepsUsed: {
      waccSteps: DEFAULT_WACC_STEPS,
      gSteps: DEFAULT_G_STEPS,
      ebitdaMarginSteps: DEFAULT_EBITDA_MARGIN_STEPS
    },
    matrices: { waccVsG, waccVsEbitdaMargin, gVsEbitdaMargin },
    calculatedAt: new Date().toISOString()
  };
}

// ---------------------------------------------------------------------------
// SCREEN DEFINITIONS
// ---------------------------------------------------------------------------
const SCREEN_DEFINITIONS = [
  { id: 'instructive', label: 'About' },
  { id: 'home', label: 'Home' },
  { id: 'companies', label: 'Company Management' },
  { id: 'market-data', label: 'Market Data' },
  { id: 'assumptions', label: 'Assumptions & Projections' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'sensitivity', label: 'Sensitivity' }
];

// ---------------------------------------------------------------------------
// APP
// ---------------------------------------------------------------------------
function App() {
  const [assumptionsForm, setAssumptionsForm] = useState({
    companyId: '1',
    projectionYears: '5',
    discountRate: '0.10',
    riskFreeRate: '0.045',
    marketRiskPremium: '0.055',
    revenueGrowthByYear: '0.15,0.13,0.11,0.09,0.08',
    projectedEbitdaMargin: '0.512',
    capexPercentOfRevenue: '0.20',
    workingCapitalChangePercentOfRevenue: '0.005',
    perpetualGrowthRate: '0.03',
    terminalValueMethod: 'GORDON',
    exitMultiple: ''
  });
  const [assumptionsList, setAssumptionsList] = useState([META_ASSUMPTIONS]);
  const [assumptionsLoading, setAssumptionsLoading] = useState(false);
  const [assumptionsError, setAssumptionsError] = useState('');
  const [assumptionsSuccess, setAssumptionsSuccess] = useState('');

  const [companies, setCompanies] = useState([META_COMPANY]);
  const [companyForm, setCompanyForm] = useState({ name: '', ticker: '', sector: '' });
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');

  const [marketDataList, setMarketDataList] = useState([META_MARKET_DATA]);
  const [marketDataForm, setMarketDataForm] = useState({
    companyId: '1',
    currentStockPrice: '589.00',
    sharesOutstanding: '2,540,000,000',
    beta: '1.31',
    totalDebt: '28,830,000,000',
    costOfDebt: '0.04',
    effectiveTaxRate: '0.15',
    cash: '43,000,000,000',
    netDebt: '-14,170,000,000',
    revenue: '164,501,000,000',
    ebitda: '84,253,000,000',
    ebit: '69,380,000,000',
    capex: '37,725,000,000',
    depreciation: '14,873,000,000',
    workingCapital: '0'
  });
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [marketDataError, setMarketDataError] = useState('');
  const [marketDataSuccess, setMarketDataSuccess] = useState('');

  const [valuationResult, setValuationResult] = useState(
    () => calculateValuationOffline(META_MARKET_DATA, META_ASSUMPTIONS)
  );
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationError, setValuationError] = useState('');
  const [valuationSuccess, setValuationSuccess] = useState('');

  const [sensitivityResult, setSensitivityResult] = useState(
    () => buildSensitivityMatrices(META_MARKET_DATA, META_ASSUMPTIONS)
  );
  const [sensitivityLoading, setSensitivityLoading] = useState(false);
  const [sensitivityError, setSensitivityError] = useState('');

  const [compactNumberDisplay, setCompactNumberDisplay] = useState(false);
  const [activeScreen, setActiveScreen] = useState('home');

  const selectedCompanyId = Number(assumptionsForm.companyId);

  const selectedMarketData = useMemo(
    () => marketDataList.find((entry) => entry.companyId === selectedCompanyId),
    [marketDataList, selectedCompanyId]
  );

  // Recalculate whenever selected company changes
  useEffect(() => {
    if (!selectedCompanyId) return;
    const md = marketDataList.find((e) => e.companyId === selectedCompanyId);
    const as = assumptionsList.find((e) => e.companyId === selectedCompanyId);
    if (md && as) {
      const result = calculateValuationOffline(md, as);
      setValuationResult(result);
      const sensitivity = buildSensitivityMatrices(md, as);
      setSensitivityResult(sensitivity);
    } else if (!md && !as) {
      setValuationResult(null);
      setSensitivityResult(null);
    }
  }, [selectedCompanyId, marketDataList, assumptionsList]);

  const summary = useMemo(() => {

    if (!valuationResult) {
      const marketPerShare = Number(selectedMarketData?.currentStockPrice);
      const netDebt = Number(selectedMarketData?.netDebt);
      const sharesOutstanding = Number(selectedMarketData?.sharesOutstanding);

      return {
        exitValue: null,
        equityValue: null,
        netDebt: Number.isFinite(netDebt) ? netDebt : null,
        sharesOutstanding: Number.isFinite(sharesOutstanding) ? sharesOutstanding : null,
        intrinsicPerShare: null,
        marketPerShare: Number.isFinite(marketPerShare) ? marketPerShare.toFixed(2) : null,
        upside: null
      };
    }

    const valuation = valuationResult.valuation || {};
    const marketData = valuationResult.marketData || {};

    const fairValuePerShare = Number(valuation.fairValuePerShare);
    const currentStockPrice = Number(valuation.currentStockPrice);

    const intrinsicPerShare = Number.isFinite(fairValuePerShare) ? fairValuePerShare : null;
    const marketPerShare = Number.isFinite(currentStockPrice) ? currentStockPrice : null;
    const upside =
      Number.isFinite(intrinsicPerShare) && Number.isFinite(marketPerShare)
        ? intrinsicPerShare - marketPerShare
        : null;

    return {
      exitValue: Number.isFinite(Number(valuation.enterpriseValue))
        ? Number(valuation.enterpriseValue)
        : null,
      equityValue: Number.isFinite(Number(valuation.equityValue))
        ? Number(valuation.equityValue)
        : null,
      netDebt: Number.isFinite(Number(marketData.netDebt)) ? Number(marketData.netDebt) : null,
      sharesOutstanding: Number.isFinite(Number(marketData.sharesOutstanding))
        ? Number(marketData.sharesOutstanding)
        : null,
      intrinsicPerShare: Number.isFinite(intrinsicPerShare) ? intrinsicPerShare.toFixed(2) : null,
      marketPerShare: Number.isFinite(marketPerShare) ? marketPerShare.toFixed(2) : null,
      upside
    };
  }, [selectedCompanyId, selectedMarketData, valuationResult]);

  const rateComparison = useMemo(() => {

    if (!valuationResult) {
      const manualDiscountRate = Number(assumptionsForm.discountRate);
      const riskFreeRate = Number(assumptionsForm.riskFreeRate);
      const marketRiskPremium = Number(assumptionsForm.marketRiskPremium);

      return {
        manualDiscountRate: Number.isFinite(manualDiscountRate) ? manualDiscountRate : null,
        riskFreeRate: Number.isFinite(riskFreeRate) ? riskFreeRate : null,
        marketRiskPremium: Number.isFinite(marketRiskPremium) ? marketRiskPremium : null,
        waccReference: null,
        spread: null
      };
    }

    const rates = valuationResult.rates || {};

    const manualDiscountRate = Number(rates.manualDiscountRate);
    const riskFreeRate = Number(rates.riskFreeRate);
    const marketRiskPremium = Number(rates.marketRiskPremium);
    const waccReference = Number(rates.waccReference);
    const spread = Number(rates.discountRateMinusWaccReference);

    return {
      manualDiscountRate: Number.isFinite(manualDiscountRate) ? manualDiscountRate : null,
      riskFreeRate: Number.isFinite(riskFreeRate) ? riskFreeRate : null,
      marketRiskPremium: Number.isFinite(marketRiskPremium) ? marketRiskPremium : null,
      waccReference: Number.isFinite(waccReference) ? waccReference : null,
      spread: Number.isFinite(spread) ? spread : null
    };
  }, [
    assumptionsForm.discountRate,
    assumptionsForm.marketRiskPremium,
    assumptionsForm.riskFreeRate,
    selectedCompanyId,
    valuationResult
  ]);

  const projectedCashFlows = useMemo(() => {
    if (!valuationResult || !Array.isArray(valuationResult.projectedCashFlows)) return [];
    return valuationResult.projectedCashFlows;
  }, [valuationResult]);

  const extractApiErrorMessage = (_error, fallbackMessage) => fallbackMessage;

  // ---------------------------------------------------------------------------
  // OFFLINE RECALCULATE — replaces axios calls
  // ---------------------------------------------------------------------------
  const syncAndRecalculateValuation = (companyId, options = {}) => {
    const { silent = false } = options;

    if (!companyId) {
      if (!silent) setValuationError('Select a company to calculate valuation.');
      return null;
    }

    if (!silent) {
      setValuationError('');
      setValuationSuccess('');
    }

    setValuationLoading(true);

    const md = marketDataList.find((e) => e.companyId === companyId);
    const as = assumptionsList.find((e) => e.companyId === companyId);

    setTimeout(() => {
      if (!md || !as) {
        if (!silent) setValuationError('Missing market data or assumptions for this company.');
        setValuationLoading(false);
        return;
      }

      const result = calculateValuationOffline(md, as);

      if (!result) {
        if (!silent) setValuationError('Error calculating valuation. Check your inputs.');
        setValuationLoading(false);
        return;
      }

      setValuationResult(result);
      const sensitivity = buildSensitivityMatrices(md, as);
      setSensitivityResult(sensitivity);

      if (!silent) setValuationSuccess('Valuation recalculated successfully.');
      setValuationLoading(false);
    }, 300);

    return null;
  };

  // ---------------------------------------------------------------------------
  // HANDLERS — now operate on local state instead of API
  // ---------------------------------------------------------------------------
  const handleAssumptionChange = (event) => {
    const { name, value } = event.target;
    setAssumptionsForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetAssumptionsForm = () => {
    setAssumptionsForm({
      companyId: companies.length > 0 ? String(companies[0].id) : '',
      projectionYears: '5',
      discountRate: '',
      riskFreeRate: '',
      marketRiskPremium: '',
      revenueGrowthByYear: '',
      projectedEbitdaMargin: '',
      capexPercentOfRevenue: '',
      workingCapitalChangePercentOfRevenue: '',
      perpetualGrowthRate: '',
      terminalValueMethod: 'GORDON',
      exitMultiple: ''
    });
  };

  const handleAssumptionsSubmit = (event) => {
    event.preventDefault();

    const companyId = Number(assumptionsForm.companyId);
    const discountRateRaw = assumptionsForm.discountRate !== ''
      ? Number(String(assumptionsForm.discountRate).replace(',', '.'))
      : null;
    const perpetualGrowthRate = Number(
      String(assumptionsForm.perpetualGrowthRate).replace(',', '.')
    );

    if (!companyId) {
      setAssumptionsError('Select a company to save assumptions.');
      return;
    }

    const revenueGrowthByYear = assumptionsForm.revenueGrowthByYear
      .split(/[;,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map(Number);

    const newAssumptions = {
      companyId,
      projectionYears: Number(assumptionsForm.projectionYears),
      discountRate: discountRateRaw,
      riskFreeRate: assumptionsForm.riskFreeRate !== ''
        ? Number(assumptionsForm.riskFreeRate)
        : 0.045,
      marketRiskPremium: assumptionsForm.marketRiskPremium !== ''
        ? Number(assumptionsForm.marketRiskPremium)
        : 0.055,
      revenueGrowthByYear,
      projectedEbitdaMargin: Number(assumptionsForm.projectedEbitdaMargin),
      capexPercentOfRevenue: Number(assumptionsForm.capexPercentOfRevenue),
      workingCapitalChangePercentOfRevenue: Number(
        assumptionsForm.workingCapitalChangePercentOfRevenue
      ),
      perpetualGrowthRate,
      terminalValueMethod: assumptionsForm.terminalValueMethod,
      exitMultiple:
        assumptionsForm.terminalValueMethod === 'EXIT_MULTIPLE'
          ? Number(assumptionsForm.exitMultiple)
          : null
    };

    setAssumptionsLoading(true);
    setAssumptionsError('');
    setAssumptionsSuccess('');

    setAssumptionsList((prev) => {
      const withoutCurrent = prev.filter((e) => e.companyId !== companyId);
      return [...withoutCurrent, newAssumptions].sort((a, b) => a.companyId - b.companyId);
    });

    syncAndRecalculateValuation(companyId, { silent: true });

    setAssumptionsSuccess('Assumptions saved successfully.');
    setAssumptionsLoading(false);
    resetAssumptionsForm();
  };

  const handleAssumptionsDelete = (companyId) => {
    setAssumptionsError('');
    setAssumptionsSuccess('');
    setAssumptionsList((prev) => prev.filter((e) => e.companyId !== companyId));
    if (selectedCompanyId === companyId) setValuationResult(null);
    setAssumptionsSuccess('Assumptions deleted successfully.');
  };

  const handleRecalculateValuation = () => {
    syncAndRecalculateValuation(selectedCompanyId);
  };

  const handleCompanyChange = (event) => {
    const { name, value } = event.target;
    setCompanyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanySubmit = (event) => {
    event.preventDefault();
    setCompanyLoading(true);
    setCompanyError('');
    setCompanySuccess('');

    const newId = Math.max(0, ...companies.map((c) => c.id)) + 1;
    const newCompany = {
      id: newId,
      name: companyForm.name.trim(),
      ticker: companyForm.ticker.trim().toUpperCase(),
      sector: companyForm.sector.trim()
    };

    setCompanies((prev) => [...prev, newCompany]);
    setCompanyForm({ name: '', ticker: '', sector: '' });
    setCompanySuccess('Company created successfully.');
    setCompanyLoading(false);
  };

  const handleCompanyDelete = (id) => {
    setCompanyError('');
    setCompanySuccess('');
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    if (selectedCompanyId === id) setValuationResult(null);
    setCompanySuccess('Company deleted successfully.');
  };

  const handleMarketDataChange = (event) => {
    const { name, value } = event.target;
    setMarketDataForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetMarketDataForm = () => {
    setMarketDataForm({
      companyId: '1',
      currentStockPrice: '589.00',
      sharesOutstanding: '2,540,000,000',
      beta: '1.31',
      totalDebt: '28,830,000,000',
      costOfDebt: '0.04',
      effectiveTaxRate: '0.15',
      cash: '43,000,000,000',
      netDebt: '-14,170,000,000',
      revenue: '164,501,000,000',
      ebitda: '84,253,000,000',
      ebit: '69,380,000,000',
      capex: '37,725,000,000',
      depreciation: '14,873,000,000',
      workingCapital: '0'
    });
  };

  const parseNormalizedNumber = (value) => {
    if (value === null || value === undefined || value === '') return NaN;
    return Number(String(value).replace(/,/g, '').trim());
  };

  const handleMarketDataSubmit = (event) => {
    event.preventDefault();

    const companyId = Number(marketDataForm.companyId);
    if (!companyId) {
      setMarketDataError('Select a company to save market data.');
      return;
    }

    const newMarketData = {
      companyId,
      currentStockPrice: parseNormalizedNumber(marketDataForm.currentStockPrice),
      sharesOutstanding: parseNormalizedNumber(marketDataForm.sharesOutstanding),
      beta: parseNormalizedNumber(marketDataForm.beta),
      totalDebt: parseNormalizedNumber(marketDataForm.totalDebt),
      costOfDebt: parseNormalizedNumber(marketDataForm.costOfDebt),
      effectiveTaxRate: parseNormalizedNumber(marketDataForm.effectiveTaxRate),
      cash: parseNormalizedNumber(marketDataForm.cash),
      netDebt: parseNormalizedNumber(marketDataForm.netDebt),
      revenue: parseNormalizedNumber(marketDataForm.revenue),
      ebitda: parseNormalizedNumber(marketDataForm.ebitda),
      ebit: parseNormalizedNumber(marketDataForm.ebit),
      capex: parseNormalizedNumber(marketDataForm.capex),
      depreciation: parseNormalizedNumber(marketDataForm.depreciation),
      workingCapital: parseNormalizedNumber(marketDataForm.workingCapital)
    };

    setMarketDataLoading(true);
    setMarketDataError('');
    setMarketDataSuccess('');

    setMarketDataList((prev) => {
      const withoutCurrent = prev.filter((e) => e.companyId !== companyId);
      return [...withoutCurrent, newMarketData].sort((a, b) => a.companyId - b.companyId);
    });

    syncAndRecalculateValuation(companyId, { silent: true });

    setMarketDataSuccess('Market data saved successfully.');
    setMarketDataLoading(false);
    resetMarketDataForm();
  };

  const handleMarketDataDelete = (companyId) => {
    setMarketDataError('');
    setMarketDataSuccess('');
    setMarketDataList((prev) => prev.filter((e) => e.companyId !== companyId));
    if (selectedCompanyId === companyId) setValuationResult(null);
    setMarketDataSuccess('Market data deleted successfully.');
  };

  const handleSelectedCompanyChange = (event) => {
    const { value } = event.target;
    setAssumptionsForm((prev) => ({ ...prev, companyId: value }));
  };

  const findCompanyLabel = (companyId) => {
    const company = companies.find((item) => item.id === companyId);
    if (!company) return `Company #${companyId}`;
    return `${company.name} (${company.ticker})`;
  };

  const projectionGrowthData = useMemo(() => {
    if (projectedCashFlows.length > 0) {
      return projectedCashFlows.map((item) => ({
        label: `Year ${item.year}`,
        value: Number(item.growthRate) || 0
      }));
    }

    const projectionYears = Number(assumptionsForm.projectionYears) || 0;
    const rawValues = assumptionsForm.revenueGrowthByYear
      .split(/[;,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map(Number)
      .filter((value) => Number.isFinite(value));

    const values = rawValues.slice(0, projectionYears > 0 ? projectionYears : rawValues.length);
    return values.map((value, index) => ({ label: `Year ${index + 1}`, value }));
  }, [assumptionsForm.projectionYears, assumptionsForm.revenueGrowthByYear, projectedCashFlows]);

  const marketComparisonData = useMemo(() => {
    const values = [
      { label: 'Market Value', value: Number(summary.marketPerShare) },
      { label: 'Upside Potential', value: Number(summary.upside) },
      { label: 'Intrinsic Value', value: Number(summary.intrinsicPerShare) }
    ];
    return values.filter((item) => Number.isFinite(item.value));
  }, [summary.intrinsicPerShare, summary.marketPerShare, summary.upside]);

  const getNormalizedBarHeight = (value, maxAbsValue) => {
    const MIN_HEIGHT = 20;
    const MAX_HEIGHT = 160;
    const safeMaxAbs = maxAbsValue > 0 ? maxAbsValue : 1;
    const ratio = Math.abs(value) / safeMaxAbs;
    const normalized = MIN_HEIGHT + ratio * (MAX_HEIGHT - MIN_HEIGHT);
    return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, normalized));
  };

  const formatRate = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return '-';
    return `${(parsedValue * 100).toFixed(2)}%`;
  };

  const maxProjectionGrowthAbs =
    projectionGrowthData.length > 0
      ? Math.max(...projectionGrowthData.map((item) => Math.abs(item.value)))
      : 1;

  const maxMarketComparisonAbs =
    marketComparisonData.length > 0
      ? Math.max(...marketComparisonData.map((item) => Math.abs(item.value)))
      : 1;

  const marketPerShareForUpside = Number(summary.marketPerShare);
  const upsideValue = Number(summary.upside);

  const upsidePercent =
    Number.isFinite(marketPerShareForUpside) &&
    marketPerShareForUpside > 0 &&
    Number.isFinite(upsideValue)
      ? upsideValue / marketPerShareForUpside
      : null;

  const upsideRecommendation = (() => {
    if (!Number.isFinite(upsidePercent)) return '-';
    if (upsidePercent < -0.1) return 'SELL';
    if (upsidePercent > 0.1) return 'BUY';
    return 'HOLD';
  })();

  const formatCompactUnit = (value, unitLabel) => {
    const rounded = Number(value.toFixed(1));
    return `${rounded.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} ${unitLabel}`;
  };

  const formatNormalizedValue = (value, options = {}) => {
    const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options;
    return value.toLocaleString('en-US', {
      minimumFractionDigits,
      maximumFractionDigits
    });
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return '-';

    if (compactNumberDisplay) {
      const absValue = Math.abs(parsedValue);
      if (absValue >= 1e12) return formatCompactUnit(parsedValue / 1e12, 'trillion');
      if (absValue >= 1e9) return formatCompactUnit(parsedValue / 1e9, 'billion');
      if (absValue >= 1e6) return formatCompactUnit(parsedValue / 1e6, 'million');
    }

    return formatNormalizedValue(parsedValue, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return '-';

    const sign = parsedValue < 0 ? '-' : '';
    const absValue = Math.abs(parsedValue);

    if (compactNumberDisplay) {
      if (absValue >= 1e12) return `${sign}$${formatCompactUnit(absValue / 1e12, 'trillion')}`;
      if (absValue >= 1e9) return `${sign}$${formatCompactUnit(absValue / 1e9, 'billion')}`;
      if (absValue >= 1e6) return `${sign}$${formatCompactUnit(absValue / 1e6, 'million')}`;
    }

    const absoluteFormatted = formatNormalizedValue(absValue, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    return `${sign}$${absoluteFormatted}`;
  };

  const getActiveScreenTitle = () => {
    const currentScreen = SCREEN_DEFINITIONS.find((item) => item.id === activeScreen);
    return currentScreen ? currentScreen.label : 'Home';
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'instructive':
        return <InstructiveScreen />;
      case 'companies':
        return (
          <CompaniesScreen
            companyForm={companyForm}
            companyLoading={companyLoading}
            companyError={companyError}
            companySuccess={companySuccess}
            companies={companies}
            handleCompanyChange={handleCompanyChange}
            handleCompanySubmit={handleCompanySubmit}
            handleCompanyDelete={handleCompanyDelete}
          />
        );
      case 'market-data':
        return (
          <MarketDataScreen
            companies={companies}
            marketDataForm={marketDataForm}
            marketDataLoading={marketDataLoading}
            marketDataError={marketDataError}
            marketDataSuccess={marketDataSuccess}
            marketDataList={marketDataList}
            handleMarketDataChange={handleMarketDataChange}
            handleMarketDataSubmit={handleMarketDataSubmit}
            handleMarketDataDelete={handleMarketDataDelete}
            findCompanyLabel={findCompanyLabel}
            formatNumber={formatNumber}
            formatMoney={formatMoney}
          />
        );
      case 'assumptions':
        return (
          <AssumptionsScreen
            assumptionsForm={assumptionsForm}
            companies={companies}
            assumptionsLoading={assumptionsLoading}
            assumptionsError={assumptionsError}
            assumptionsSuccess={assumptionsSuccess}
            valuationLoading={valuationLoading}
            valuationError={valuationError}
            valuationSuccess={valuationSuccess}
            assumptionsList={assumptionsList}
            handleAssumptionChange={handleAssumptionChange}
            handleAssumptionsSubmit={handleAssumptionsSubmit}
            handleAssumptionsDelete={handleAssumptionsDelete}
            handleRecalculateValuation={handleRecalculateValuation}
            findCompanyLabel={findCompanyLabel}
            formatRate={formatRate}
            formatNumber={formatNumber}
          />
        );
      case 'valuation':
        return (
          <ValuationScreen
            projectedCashFlows={projectedCashFlows}
            valuationResult={valuationResult}
            summary={summary}
            rateComparison={rateComparison}
            upsidePercent={upsidePercent}
            upsideRecommendation={upsideRecommendation}
            valuationLoading={valuationLoading}
            valuationError={valuationError}
            valuationSuccess={valuationSuccess}
            handleRecalculateValuation={handleRecalculateValuation}
            formatNumber={formatNumber}
            formatMoney={formatMoney}
            formatRate={formatRate}
          />
        );
      case 'sensitivity':
        return (
          <SensitivityScreen
            sensitivityLoading={sensitivityLoading}
            sensitivityError={sensitivityError}
            sensitivityResult={sensitivityResult}
            formatRate={formatRate}
            formatMoney={formatMoney}
          />
        );
      case 'home':
      default:
        return (
          <HomeScreen
            companies={companies}
            marketDataList={marketDataList}
            assumptionsList={assumptionsList}
            summary={summary}
            projectionGrowthData={projectionGrowthData}
            marketComparisonData={marketComparisonData}
            maxProjectionGrowthAbs={maxProjectionGrowthAbs}
            maxMarketComparisonAbs={maxMarketComparisonAbs}
            getNormalizedBarHeight={getNormalizedBarHeight}
            formatRate={formatRate}
            formatMoney={formatMoney}
            findCompanyLabel={findCompanyLabel}
            selectedCompanyId={selectedCompanyId}
            upsidePercent={upsidePercent}
            upsideRecommendation={upsideRecommendation}
          />
        );
    }
  };

  return (
    <main className="dcf-page">
      <header className="top-header">
        <div className="brand">Decision DCF - Valuation Platform</div>
        <div className="top-header-controls">
          <label className="company-selector" htmlFor="global-company-selector">
            Company
            <select
              id="global-company-selector"
              value={assumptionsForm.companyId}
              onChange={handleSelectedCompanyChange}
              disabled={companies.length === 0}
            >
              {companies.length === 0 ? (
                <option value="">No companies</option>
              ) : (
                companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.ticker})
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="compact-toggle" htmlFor="compact-number-display">
            <input
              id="compact-number-display"
              type="checkbox"
              checked={compactNumberDisplay}
              onChange={(event) => setCompactNumberDisplay(event.target.checked)}
            />
            Show compact values
          </label>
          <div className="brand right">2026</div>
        </div>
      </header>

      <div className="title-strip">{getActiveScreenTitle()}</div>

      <nav className="screen-nav" aria-label="Screen navigation">
        {SCREEN_DEFINITIONS.map((screen) => (
          <button
            key={screen.id}
            type="button"
            className={`screen-nav-btn ${activeScreen === screen.id ? 'active' : ''}`}
            onClick={() => setActiveScreen(screen.id)}
          >
            {screen.label}
          </button>
        ))}
      </nav>

      <section className="screen-content">{renderActiveScreen()}</section>
    </main>
  );
}

export default App;