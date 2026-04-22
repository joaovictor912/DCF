import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';
import HomeScreen from './screens/HomeScreen';
import CompaniesScreen from './screens/CompaniesScreen';
import MarketDataScreen from './screens/MarketDataScreen';
import AssumptionsScreen from './screens/AssumptionsScreen';
import ValuationScreen from './screens/ValuationScreen';
import SensitivityScreen from './screens/SensitivityScreen';

const SCREEN_DEFINITIONS = [
  { id: 'home', label: 'Home' },
  { id: 'companies', label: 'Company Management' },
  { id: 'market-data', label: 'Market Data' },
  { id: 'assumptions', label: 'Assumptions & Projections' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'sensitivity', label: 'Sensitivity' }
];

function App() {
  const API_BASE_URL = '/api';
  const MARKET_DATA_API_BASE_URL = '/api-market-data';
  const ASSUMPTIONS_API_BASE_URL = '/api-assumptions';
  const VALUATION_API_BASE_URL = '/api-valuation';
  const SENSITIVITY_API_BASE_URL = '/api-sensitivity';

  const [assumptionsForm, setAssumptionsForm] = useState({
    companyId: '',
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
  const [assumptionsList, setAssumptionsList] = useState([]);
  const [assumptionsLoading, setAssumptionsLoading] = useState(false);
  const [assumptionsError, setAssumptionsError] = useState('');
  const [assumptionsSuccess, setAssumptionsSuccess] = useState('');

  const [companies, setCompanies] = useState([]);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    ticker: '',
    sector: ''
  });
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [companySuccess, setCompanySuccess] = useState('');
  const [marketDataList, setMarketDataList] = useState([]);
  const [marketDataForm, setMarketDataForm] = useState({
    companyId: '',
    currentStockPrice: '',
    sharesOutstanding: '',
    beta: '',
    totalDebt: '',
    costOfDebt: '',
    effectiveTaxRate: '',
    cash: '',
    netDebt: '',
    revenue: '',
    ebitda: '',
    ebit: '',
    capex: '',
    depreciation: '',
    workingCapital: ''
  });
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [marketDataError, setMarketDataError] = useState('');
  const [marketDataSuccess, setMarketDataSuccess] = useState('');
  const [valuationResult, setValuationResult] = useState(null);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationError, setValuationError] = useState('');
  const [valuationSuccess, setValuationSuccess] = useState('');
  const [sensitivityResult, setSensitivityResult] = useState(null);
  const [sensitivityLoading, setSensitivityLoading] = useState(false);
  const [sensitivityError, setSensitivityError] = useState('');
  const [compactNumberDisplay, setCompactNumberDisplay] = useState(true);
  const [activeScreen, setActiveScreen] = useState('home');

  const selectedCompanyId = Number(assumptionsForm.companyId);

  const selectedMarketData = useMemo(
    () => marketDataList.find((entry) => entry.companyId === selectedCompanyId),
    [marketDataList, selectedCompanyId]
  );

  const summary = useMemo(() => {
    const hasValuationForSelectedCompany = Number(valuationResult?.companyId) === selectedCompanyId;

    if (!hasValuationForSelectedCompany) {
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
    const upside = Number.isFinite(intrinsicPerShare) && Number.isFinite(marketPerShare)
      ? intrinsicPerShare - marketPerShare
      : null;

    return {
      exitValue: Number.isFinite(Number(valuation.enterpriseValue)) ? Number(valuation.enterpriseValue) : null,
      equityValue: Number.isFinite(Number(valuation.equityValue)) ? Number(valuation.equityValue) : null,
      netDebt: Number.isFinite(Number(marketData.netDebt)) ? Number(marketData.netDebt) : null,
      sharesOutstanding: Number.isFinite(Number(marketData.sharesOutstanding)) ? Number(marketData.sharesOutstanding) : null,
      intrinsicPerShare: Number.isFinite(intrinsicPerShare) ? intrinsicPerShare.toFixed(2) : null,
      marketPerShare: Number.isFinite(marketPerShare) ? marketPerShare.toFixed(2) : null,
      upside
    };
  }, [selectedCompanyId, selectedMarketData, valuationResult]);

  const rateComparison = useMemo(() => {
    const hasValuationForSelectedCompany = Number(valuationResult?.companyId) === selectedCompanyId;

    if (!hasValuationForSelectedCompany) {
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
    const hasValuationForSelectedCompany = Number(valuationResult?.companyId) === selectedCompanyId;
    if (!hasValuationForSelectedCompany || !Array.isArray(valuationResult?.projectedCashFlows)) {
      return [];
    }
    return valuationResult.projectedCashFlows;
  }, [selectedCompanyId, valuationResult]);

  const extractApiErrorMessage = (_error, fallbackMessage) => {
    return fallbackMessage;
  };

  const syncAndRecalculateValuation = async (companyId, options = {}) => {
    const { silent = false } = options;

    if (!companyId) {
      if (!silent) {
        setValuationError('Select a company to calculate valuation.');
      }
      return null;
    }

    if (!silent) {
      setValuationError('');
      setValuationSuccess('');
    }

    setValuationLoading(true);

    try {
      const response = await axios.post(
        `${VALUATION_API_BASE_URL}/valuation/${companyId}/sync-from-services`
      );

      setValuationResult(response.data.valuation);

      if (!silent) {
        setValuationSuccess('Valuation recalculated successfully.');
      }

      return response.data.valuation;
    } catch (error) {
      if (!silent) {
        setValuationError(extractApiErrorMessage(error, 'Error calculating valuation.'));
      }
      return null;
    } finally {
      setValuationLoading(false);
    }
  };

  const loadValuation = async (companyId) => {
    if (!companyId) {
      setValuationResult(null);
      return;
    }

    try {
      const response = await axios.get(`${VALUATION_API_BASE_URL}/valuation/${companyId}`);
      setValuationResult(response.data);
      setValuationError('');
    } catch {
      setValuationResult(null);
    }
  };

  const loadSensitivity = async (companyId) => {
    if (!companyId) {
      setSensitivityResult(null);
      setSensitivityError('');
      return;
    }

    setSensitivityLoading(true);
    setSensitivityError('');

    try {
      const response = await axios.post(
        `${SENSITIVITY_API_BASE_URL}/sensitivity/${companyId}/matrices`,
        {}
      );
      setSensitivityResult(response.data);
    } catch (error) {
      setSensitivityResult(null);
      setSensitivityError(extractApiErrorMessage(error, 'Error calculating sensitivity.'));
    } finally {
      setSensitivityLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/empresas`);
      setCompanies(response.data);
    } catch {
      setCompanyError('Could not load companies. Check if the microservice is running.');
    }
  };

  const loadMarketData = async () => {
    try {
      const response = await axios.get(`${MARKET_DATA_API_BASE_URL}/market-data`);
      const sorted = [...response.data].sort((a, b) => a.companyId - b.companyId);
      setMarketDataList(sorted);
    } catch {
      setMarketDataError('Could not load market data. Check if the microservice is running.');
    }
  };

  const loadAssumptions = async () => {
    try {
      const response = await axios.get(`${ASSUMPTIONS_API_BASE_URL}/assumptions`);
      const sorted = [...response.data].sort((a, b) => a.companyId - b.companyId);
      setAssumptionsList(sorted);
    } catch {
      setAssumptionsError('Could not load assumptions. Check if the microservice is running.');
    }
  };

  useEffect(() => {
    loadCompanies();
    loadMarketData();
    loadAssumptions();
  }, []);

  useEffect(() => {
    if (companies.length > 0 && !marketDataForm.companyId) {
      setMarketDataForm((prev) => ({
        ...prev,
        companyId: String(companies[0].id)
      }));
    }
  }, [companies, marketDataForm.companyId]);

  useEffect(() => {
    if (companies.length > 0 && !assumptionsForm.companyId) {
      setAssumptionsForm((prev) => ({
        ...prev,
        companyId: String(companies[0].id)
      }));
    }
  }, [companies, assumptionsForm.companyId]);

  useEffect(() => {
    loadValuation(selectedCompanyId);
    loadSensitivity(selectedCompanyId);
  }, [selectedCompanyId]);

  const handleAssumptionChange = (event) => {
    const { name, value } = event.target;
    setAssumptionsForm((prev) => ({
      ...prev,
      [name]: value
    }));
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

  const handleAssumptionsSubmit = async (event) => {
    event.preventDefault();

    const companyId = Number(assumptionsForm.companyId);
    const discountRate = Number(String(assumptionsForm.discountRate).replace(',', '.'));
    const perpetualGrowthRate = Number(String(assumptionsForm.perpetualGrowthRate).replace(',', '.'));

    if (!companyId) {
      setAssumptionsError('Select a company to save assumptions.');
      return;
    }

    if (
      assumptionsForm.terminalValueMethod === 'GORDON'
      && Number.isFinite(discountRate)
      && Number.isFinite(perpetualGrowthRate)
      && perpetualGrowthRate >= discountRate
    ) {
      setAssumptionsSuccess('');
      setAssumptionsError(
        'In GORDON method, Perpetual Growth (g) must be lower than the Discount Rate.'
      );
      return;
    }

    const revenueGrowthByYear = assumptionsForm.revenueGrowthByYear
      .split(/[;,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map(Number);

    const payload = {
      companyId,
      projectionYears: Number(assumptionsForm.projectionYears),
      discountRate,
      ...(assumptionsForm.riskFreeRate !== ''
        ? { riskFreeRate: Number(assumptionsForm.riskFreeRate) }
        : {}),
      ...(assumptionsForm.marketRiskPremium !== ''
        ? { marketRiskPremium: Number(assumptionsForm.marketRiskPremium) }
        : {}),
      revenueGrowthByYear,
      projectedEbitdaMargin: Number(assumptionsForm.projectedEbitdaMargin),
      capexPercentOfRevenue: Number(assumptionsForm.capexPercentOfRevenue),
      workingCapitalChangePercentOfRevenue: Number(assumptionsForm.workingCapitalChangePercentOfRevenue),
      perpetualGrowthRate,
      terminalValueMethod: assumptionsForm.terminalValueMethod,
      ...(assumptionsForm.terminalValueMethod === 'EXIT_MULTIPLE'
        ? { exitMultiple: Number(assumptionsForm.exitMultiple) }
        : {})
    };

    setAssumptionsLoading(true);
    setAssumptionsError('');
    setAssumptionsSuccess('');

    try {
      const existing = assumptionsList.some((entry) => entry.companyId === companyId);
      const response = existing
        ? await axios.put(`${ASSUMPTIONS_API_BASE_URL}/assumptions/${companyId}`, payload)
        : await axios.post(`${ASSUMPTIONS_API_BASE_URL}/assumptions`, payload);

      setAssumptionsList((prev) => {
        const withoutCurrent = prev.filter((entry) => entry.companyId !== response.data.companyId);
        return [...withoutCurrent, response.data].sort((a, b) => a.companyId - b.companyId);
      });

      await syncAndRecalculateValuation(companyId, { silent: true });

      setAssumptionsSuccess(existing ? 'Assumptions updated successfully.' : 'Assumptions saved successfully.');
      resetAssumptionsForm();
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Error saving assumptions.');
      setAssumptionsError(message);
    } finally {
      setAssumptionsLoading(false);
    }
  };

  const handleAssumptionsDelete = async (companyId) => {
    setAssumptionsError('');
    setAssumptionsSuccess('');

    try {
      await axios.delete(`${ASSUMPTIONS_API_BASE_URL}/assumptions/${companyId}`);
      setAssumptionsList((prev) => prev.filter((entry) => entry.companyId !== companyId));

      if (selectedCompanyId === companyId) {
        setValuationResult(null);
      }

      setAssumptionsSuccess('Assumptions deleted successfully.');
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Error deleting assumptions.');
      setAssumptionsError(message);
    }
  };

  const handleRecalculateValuation = async () => {
    await syncAndRecalculateValuation(selectedCompanyId);
  };

  const handleCompanyChange = (event) => {
    const { name, value } = event.target;
    setCompanyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanySubmit = async (event) => {
    event.preventDefault();
    setCompanyLoading(true);
    setCompanyError('');
    setCompanySuccess('');

    try {
      const payload = {
        name: companyForm.name.trim(),
        ticker: companyForm.ticker.trim().toUpperCase(),
        sector: companyForm.sector.trim()
      };

      const response = await axios.post(`${API_BASE_URL}/empresas`, payload);
      setCompanies((prev) => [...prev, response.data]);
      setCompanyForm({ name: '', ticker: '', sector: '' });
      setCompanySuccess('Company created successfully.');
    } catch (error) {
      const message = extractApiErrorMessage(
        error,
        'Error creating company. Check if the microservice is running.'
      );
      setCompanyError(message);
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleCompanyDelete = async (id) => {
    setCompanyError('');
    setCompanySuccess('');

    try {
      await axios.delete(`${API_BASE_URL}/empresas/${id}`);
      setCompanies((prev) => prev.filter((company) => company.id !== id));

      if (selectedCompanyId === id) {
        setValuationResult(null);
      }

      setCompanySuccess('Company deleted successfully.');
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Error deleting company.');
      setCompanyError(message);
    }
  };

  const handleMarketDataChange = (event) => {
    const { name, value } = event.target;
    setMarketDataForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetMarketDataForm = () => {
    setMarketDataForm({
      companyId: companies.length > 0 ? String(companies[0].id) : '',
      currentStockPrice: '',
      sharesOutstanding: '',
      beta: '',
      totalDebt: '',
      costOfDebt: '',
      effectiveTaxRate: '',
      cash: '',
      netDebt: '',
      revenue: '',
      ebitda: '',
      ebit: '',
      capex: '',
      depreciation: '',
      workingCapital: ''
    });
  };

  const handleMarketDataSubmit = async (event) => {
    event.preventDefault();

    const companyId = Number(marketDataForm.companyId);
    const payload = {
      companyId,
      currentStockPrice: Number(marketDataForm.currentStockPrice),
      sharesOutstanding: Number(marketDataForm.sharesOutstanding),
      beta: Number(marketDataForm.beta),
      totalDebt: Number(marketDataForm.totalDebt),
      costOfDebt: Number(marketDataForm.costOfDebt),
      effectiveTaxRate: Number(marketDataForm.effectiveTaxRate),
      cash: Number(marketDataForm.cash),
      netDebt: Number(marketDataForm.netDebt),
      revenue: Number(marketDataForm.revenue),
      ebitda: Number(marketDataForm.ebitda),
      ebit: Number(marketDataForm.ebit),
      capex: Number(marketDataForm.capex),
      depreciation: Number(marketDataForm.depreciation),
      workingCapital: Number(marketDataForm.workingCapital)
    };

    if (!companyId) {
      setMarketDataError('Select a company to save market data.');
      return;
    }

    setMarketDataLoading(true);
    setMarketDataError('');
    setMarketDataSuccess('');

    try {
      const response = await axios.post(`${MARKET_DATA_API_BASE_URL}/market-data`, payload);

      setMarketDataList((prev) => {
        const withoutCurrent = prev.filter((entry) => entry.companyId !== response.data.companyId);
        return [...withoutCurrent, response.data].sort((a, b) => a.companyId - b.companyId);
      });

      await syncAndRecalculateValuation(companyId, { silent: true });

      setMarketDataSuccess('Market data saved successfully.');
      resetMarketDataForm();
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Error saving market data.');
      setMarketDataError(message);
    } finally {
      setMarketDataLoading(false);
    }
  };

  const handleMarketDataDelete = async (companyId) => {
    setMarketDataError('');
    setMarketDataSuccess('');

    try {
      await axios.delete(`${MARKET_DATA_API_BASE_URL}/market-data/${companyId}`);
      setMarketDataList((prev) => prev.filter((entry) => entry.companyId !== companyId));

      if (selectedCompanyId === companyId) {
        setValuationResult(null);
      }

      setMarketDataSuccess('Market data deleted successfully.');
    } catch (error) {
      const message = extractApiErrorMessage(error, 'Error deleting market data.');
      setMarketDataError(message);
    }
  };

  const findCompanyLabel = (companyId) => {
    const company = companies.find((item) => item.id === companyId);
    if (!company) {
      return `Company #${companyId}`;
    }
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

    return values.map((value, index) => ({
      label: `Year ${index + 1}`,
      value
    }));
  }, [assumptionsForm.projectionYears, assumptionsForm.revenueGrowthByYear, projectedCashFlows]);

  const marketComparisonData = useMemo(() => {
    const values = [
      { label: 'Market Value', value: Number(summary.marketPerShare) },
      { label: 'Upside Potential', value: Number(summary.upside) },
      { label: 'Intrinsic Value', value: Number(summary.intrinsicPerShare) }
    ];

    return values.filter((item) => Number.isFinite(item.value));
  }, [summary.intrinsicPerShare, summary.marketPerShare, summary.upside]);

  // Keeps chart bars within a minimum and maximum visual size.
  const getNormalizedBarHeight = (value, maxAbsValue) => {
    const MIN_HEIGHT = 20;
    const MAX_HEIGHT = 160;
    const safeMaxAbs = maxAbsValue > 0 ? maxAbsValue : 1;
    const ratio = Math.abs(value) / safeMaxAbs;
    const normalized = MIN_HEIGHT + ratio * (MAX_HEIGHT - MIN_HEIGHT);
    return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, normalized));
  };

  const formatRate = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return '-';
    }
    return `${(parsedValue * 100).toFixed(2)}%`;
  };

  const maxProjectionGrowthAbs = projectionGrowthData.length > 0
    ? Math.max(...projectionGrowthData.map((item) => Math.abs(item.value)))
    : 1;

  const maxMarketComparisonAbs = marketComparisonData.length > 0
    ? Math.max(...marketComparisonData.map((item) => Math.abs(item.value)))
    : 1;

  // Derives SELL, HOLD, or BUY from upside percentage.
  const marketPerShareForUpside = Number(summary.marketPerShare);
  const upsideValue = Number(summary.upside);

  const upsidePercent = Number.isFinite(marketPerShareForUpside)
    && marketPerShareForUpside > 0
    && Number.isFinite(upsideValue)
    ? upsideValue / marketPerShareForUpside
    : null;

  const upsideRecommendation = (() => {
    if (!Number.isFinite(upsidePercent)) {
      return '-';
    }

    if (upsidePercent < -0.1) {
      return 'SELL';
    }

    if (upsidePercent > 0.1) {
      return 'BUY';
    }

    return 'HOLD';
  })();

  const formatCompactUnit = (value, unitLabel) => {
    const rounded = Number(value.toFixed(1));

    return `${rounded.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} ${unitLabel}`;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return '-';
    }

    if (compactNumberDisplay) {
      const absValue = Math.abs(parsedValue);

      if (absValue >= 1e12) {
        return formatCompactUnit(parsedValue / 1e12, 'trillion');
      }

      if (absValue >= 1e9) {
        return formatCompactUnit(parsedValue / 1e9, 'billion');
      }

      if (absValue >= 1e6) {
        return formatCompactUnit(parsedValue / 1e6, 'million');
      }
    }

    return parsedValue.toLocaleString('en-US');
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return '-';
    }

    const sign = parsedValue < 0 ? '-' : '';
    const absValue = Math.abs(parsedValue);

    if (compactNumberDisplay) {
      if (absValue >= 1e12) {
        return `${sign}$${formatCompactUnit(absValue / 1e12, 'trillion')}`;
      }

      if (absValue >= 1e9) {
        return `${sign}$${formatCompactUnit(absValue / 1e9, 'billion')}`;
      }

      if (absValue >= 1e6) {
        return `${sign}$${formatCompactUnit(absValue / 1e6, 'million')}`;
      }
    }

    const absoluteFormatted = absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return `${sign}$${absoluteFormatted}`;
  };

  const handleSelectedCompanyChange = (event) => {
    const { value } = event.target;
    setAssumptionsForm((prev) => ({
      ...prev,
      companyId: value
    }));
  };

  const getActiveScreenTitle = () => {
    const currentScreen = SCREEN_DEFINITIONS.find((item) => item.id === activeScreen);
    return currentScreen ? currentScreen.label : 'Home';
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
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

      <section className="screen-content">
        {renderActiveScreen()}
      </section>
    </main>
  );
}

export default App;