import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const API_BASE_URL = '/api';
  const MARKET_DATA_API_BASE_URL = '/api-market-data';
  const ASSUMPTIONS_API_BASE_URL = '/api-assumptions';
  const VALUATION_API_BASE_URL = '/api-valuation';

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

  const selectedCompanyId = Number(assumptionsForm.companyId);

  // Usa um resumo local quando ainda nao existe valuation calculado.
  const fallbackSummary = useMemo(() => {
    const selectedMarketData = marketDataList.find((entry) => entry.companyId === selectedCompanyId);

    const ebitda = Number(selectedMarketData?.ebitda) || 0;
    const netDebt = Number(selectedMarketData?.netDebt) || 0;
    const sharesOutstanding = Number(selectedMarketData?.sharesOutstanding) || 0;
    const currentPrice = Number(selectedMarketData?.currentStockPrice) || 0;

    const terminalMethod = assumptionsForm.terminalValueMethod;
    const exitMultiple = Number(assumptionsForm.exitMultiple) || 0;

    const exitValue = terminalMethod === 'EXIT_MULTIPLE'
      ? ebitda * exitMultiple
      : 0;

    const equityValue = exitValue - netDebt;
    const intrinsicPerShare = sharesOutstanding > 0
      ? (equityValue / sharesOutstanding).toFixed(2)
      : '0.00';

    const marketPerShare = currentPrice.toFixed(2);
    const upside = (Number(intrinsicPerShare) - Number(marketPerShare)).toFixed(2);

    return {
      exitValue,
      equityValue,
      netDebt,
      sharesOutstanding,
      intrinsicPerShare,
      marketPerShare,
      upside
    };
  }, [assumptionsForm.exitMultiple, assumptionsForm.terminalValueMethod, marketDataList, selectedCompanyId]);

  const summary = useMemo(() => {
    const hasValuationForSelectedCompany = Number(valuationResult?.companyId) === selectedCompanyId;

    if (!hasValuationForSelectedCompany) {
      return fallbackSummary;
    }

    const valuation = valuationResult.valuation || {};
    const marketData = valuationResult.marketData || {};

    const fairValuePerShare = Number(valuation.fairValuePerShare);
    const currentStockPrice = Number(valuation.currentStockPrice);

    const intrinsicPerShare = Number.isFinite(fairValuePerShare) ? fairValuePerShare : 0;
    const marketPerShare = Number.isFinite(currentStockPrice) ? currentStockPrice : 0;

    return {
      exitValue: Number(valuation.enterpriseValue) || 0,
      equityValue: Number(valuation.equityValue) || 0,
      netDebt: Number(marketData.netDebt) || 0,
      sharesOutstanding: Number(marketData.sharesOutstanding) || 0,
      intrinsicPerShare: intrinsicPerShare.toFixed(2),
      marketPerShare: marketPerShare.toFixed(2),
      upside: intrinsicPerShare - marketPerShare
    };
  }, [fallbackSummary, selectedCompanyId, valuationResult]);

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

  const extractApiErrorMessage = (error, fallbackMessage) => {
    return error?.response?.data?.message || fallbackMessage;
  };

  const syncAndRecalculateValuation = async (companyId, options = {}) => {
    const { silent = false } = options;

    if (!companyId) {
      if (!silent) {
        setValuationError('Selecione uma empresa para calcular o valuation.');
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
        setValuationSuccess('Valuation recalculado com sucesso.');
      }

      return response.data.valuation;
    } catch (error) {
      if (!silent) {
        setValuationError(extractApiErrorMessage(error, 'Erro ao calcular valuation.'));
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

  const loadCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/empresas`);
      setCompanies(response.data);
    } catch {
      setCompanyError('Não foi possível carregar as empresas. Verifique se o microsserviço está ativo.');
    }
  };

  const loadMarketData = async () => {
    try {
      const response = await axios.get(`${MARKET_DATA_API_BASE_URL}/market-data`);
      const sorted = [...response.data].sort((a, b) => a.companyId - b.companyId);
      setMarketDataList(sorted);
    } catch {
      setMarketDataError('Não foi possível carregar o Market Data. Verifique se o microsserviço está ativo.');
    }
  };

  const loadAssumptions = async () => {
    try {
      const response = await axios.get(`${ASSUMPTIONS_API_BASE_URL}/assumptions`);
      const sorted = [...response.data].sort((a, b) => a.companyId - b.companyId);
      setAssumptionsList(sorted);
    } catch {
      setAssumptionsError('Não foi possível carregar as premissas. Verifique se o microsserviço está ativo.');
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
    if (!companyId) {
      setAssumptionsError('Selecione uma empresa para salvar as premissas.');
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
      discountRate: Number(assumptionsForm.discountRate),
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
      perpetualGrowthRate: Number(assumptionsForm.perpetualGrowthRate),
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

      setAssumptionsSuccess(existing ? 'Premissas atualizadas com sucesso.' : 'Premissas cadastradas com sucesso.');
      resetAssumptionsForm();
    } catch (error) {
      const message = error?.response?.data?.message || 'Erro ao salvar premissas.';
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

      setAssumptionsSuccess('Premissas removidas com sucesso.');
    } catch (error) {
      const message = error?.response?.data?.message || 'Erro ao remover premissas.';
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
      setCompanySuccess('Empresa cadastrada com sucesso.');
    } catch (error) {
      const message = error?.response?.data?.message
        || 'Erro ao cadastrar empresa. Verifique se o microsserviço está ativo.';
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

      setCompanySuccess('Empresa removida com sucesso.');
    } catch (error) {
      const message = error?.response?.data?.message || 'Erro ao remover empresa.';
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
      setMarketDataError('Selecione uma empresa para salvar o Market Data.');
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

      setMarketDataSuccess('Dados de mercado cadastrados com sucesso.');
      resetMarketDataForm();
    } catch (error) {
      const message = error?.response?.data?.message || 'Erro ao salvar dados de mercado.';
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

      setMarketDataSuccess('Dados de mercado removidos com sucesso.');
    } catch (error) {
      const message = error?.response?.data?.message || 'Erro ao remover dados de mercado.';
      setMarketDataError(message);
    }
  };

  const findCompanyLabel = (companyId) => {
    const company = companies.find((item) => item.id === companyId);
    if (!company) {
      return `Empresa #${companyId}`;
    }
    return `${company.name} (${company.ticker})`;
  };

  const projectionGrowthData = useMemo(() => {
    if (projectedCashFlows.length > 0) {
      return projectedCashFlows.map((item) => ({
        label: `Ano ${item.year}`,
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
      label: `Ano ${index + 1}`,
      value
    }));
  }, [assumptionsForm.projectionYears, assumptionsForm.revenueGrowthByYear, projectedCashFlows]);

  const marketComparisonData = useMemo(() => ([
    { label: 'Valor de Mercado', value: Number(summary.marketPerShare) || 0 },
    { label: 'Potencial de Alta', value: Number(summary.upside) || 0 },
    { label: 'Valor Intrínseco', value: Number(summary.intrinsicPerShare) || 0 }
  ]), [summary.intrinsicPerShare, summary.marketPerShare, summary.upside]);

  // Mantem as barras do grafico dentro de um tamanho minimo e maximo.
  const getNormalizedBarHeight = (value, maxAbsValue) => {
    const MIN_HEIGHT = 20;
    const MAX_HEIGHT = 160;
    const safeMaxAbs = maxAbsValue > 0 ? maxAbsValue : 1;
    const ratio = Math.abs(value) / safeMaxAbs;
    const normalized = MIN_HEIGHT + ratio * (MAX_HEIGHT - MIN_HEIGHT);
    return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, normalized));
  };

  const formatRate = (value) => {
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

  // Define SELL, HOLD ou BUY a partir do upside percentual.
  const upsidePercent = Number(summary.marketPerShare) > 0
    ? Number(summary.upside) / Number(summary.marketPerShare)
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

  const formatNumber = (value) => {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return '-';
    }
    return parsedValue.toLocaleString('en-US');
  };

  const formatMoney = (value) => {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return '-';
    }
    return parsedValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    });
  };

  return (
    <main className="dcf-page">
      <header className="top-header">
        <div className="brand">Decision DCF - Plataforma de Valuation</div>
        <div className="brand right">2026</div>
      </header>

      <div className="title-strip">Modelo FCD</div>

      <section className="top-grid">
        <article className="panel assumptions">
          <h2>Premissas</h2>

          <form className="assumption-list" onSubmit={handleAssumptionsSubmit}>
            <label>
              <span>Empresa</span>
              <select
                name="companyId"
                value={assumptionsForm.companyId}
                onChange={handleAssumptionChange}
                required
              >
                {companies.length === 0 ? (
                  <option value="">Cadastre uma empresa primeiro</option>
                ) : (
                  companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.ticker})
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              <span>Anos de Projeção</span>
              <input
                name="projectionYears"
                type="number"
                min="1"
                max="20"
                value={assumptionsForm.projectionYears}
                onChange={handleAssumptionChange}
                required
              />
            </label>

            <label>
              <span>Taxa de Desconto (0 a 1)</span>
              <input
                name="discountRate"
                type="number"
                step="any"
                value={assumptionsForm.discountRate}
                onChange={handleAssumptionChange}
                required
              />
            </label>

            <label>
              <span>Taxa Livre de Risco (opcional)</span>
              <input
                name="riskFreeRate"
                type="number"
                step="any"
                placeholder="Padrão: 0.045 (4,5%)"
                value={assumptionsForm.riskFreeRate}
                onChange={handleAssumptionChange}
              />
            </label>

            <label>
              <span>Prêmio de Risco de Mercado (opcional)</span>
              <input
                name="marketRiskPremium"
                type="number"
                step="any"
                placeholder="Padrão: 0.055 (5,5%)"
                value={assumptionsForm.marketRiskPremium}
                onChange={handleAssumptionChange}
              />
            </label>

            <label>
              <span>Cresc. Receita por Ano</span>
              <input
                name="revenueGrowthByYear"
                placeholder="Ex: 0.1,0.08,0.07"
                value={assumptionsForm.revenueGrowthByYear}
                onChange={handleAssumptionChange}
                required
              />
            </label>

            <label>
              <span>Margem EBITDA Projetada</span>
              <input
                name="projectedEbitdaMargin"
                type="number"
                step="any"
                value={assumptionsForm.projectedEbitdaMargin}
                onChange={handleAssumptionChange}
                required
              />
            </label>

            <label>
              <span>Capex (% da Receita)</span>
              <input
                name="capexPercentOfRevenue"
                type="number"
                step="any"
                value={assumptionsForm.capexPercentOfRevenue}
                onChange={handleAssumptionChange}
                required
              />
            </label>

            <label>
              <span>Var. Capital de Giro (% Receita)</span>
              <input
                name="workingCapitalChangePercentOfRevenue"
                type="number"
                step="any"
                value={assumptionsForm.workingCapitalChangePercentOfRevenue}
                onChange={handleAssumptionChange}
                required
              />
            </label>

            <label>
              <span>Cresc. Perpetuidade (g)</span>
              <input
                name="perpetualGrowthRate"
                type="number"
                step="any"
                value={assumptionsForm.perpetualGrowthRate}
                onChange={handleAssumptionChange}
                required
              />
            </label>

            <label>
              <span>Método Valor Terminal</span>
              <select
                name="terminalValueMethod"
                value={assumptionsForm.terminalValueMethod}
                onChange={handleAssumptionChange}
                required
              >
                <option value="GORDON">GORDON</option>
                <option value="EXIT_MULTIPLE">EXIT_MULTIPLE</option>
              </select>
            </label>

            <label>
              <span>Múltiplo de Saída</span>
              <input
                name="exitMultiple"
                type="number"
                step="any"
                value={assumptionsForm.exitMultiple}
                onChange={handleAssumptionChange}
                disabled={assumptionsForm.terminalValueMethod !== 'EXIT_MULTIPLE'}
                required={assumptionsForm.terminalValueMethod === 'EXIT_MULTIPLE'}
              />
            </label>

            <div className="inline-actions assumption-actions">
              <button type="submit" disabled={assumptionsLoading || companies.length === 0}>
                {assumptionsLoading ? 'Salvando...' : 'Salvar premissas'}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleRecalculateValuation}
                disabled={valuationLoading || companies.length === 0}
              >
                {valuationLoading ? 'Calculando...' : 'Calcular valuation'}
              </button>
            </div>

            {assumptionsError && <p className="feedback error">{assumptionsError}</p>}
            {assumptionsSuccess && <p className="feedback success">{assumptionsSuccess}</p>}
            {valuationError && <p className="feedback error">{valuationError}</p>}
            {valuationSuccess && <p className="feedback success">{valuationSuccess}</p>}
          </form>
        </article>

        <article className="panel chart-panel">
          <h2>Crescimento de Receita</h2>
          <div className="bar-chart">
            {projectionGrowthData.length === 0 ? (
              <div className="bar-empty">Preencha Cresc. Receita por Ano para exibir o gráfico.</div>
            ) : projectionGrowthData.map((item) => (
              <div className="bar-item" key={item.label}>
                <div className="bar-value">{formatRate(item.value)}</div>
                <div
                  className="bar"
                  style={{ height: `${getNormalizedBarHeight(item.value, maxProjectionGrowthAbs)}px` }}
                />
                <div className="bar-label">{item.label}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel chart-panel">
          <h2>Valor de Mercado vs Valor Intrínseco</h2>
          <div className="bar-chart small">
            {marketComparisonData.map((item) => (
              <div className="bar-item" key={item.label}>
                <div className="bar-value">$ {formatMoney(item.value)}</div>
                <div
                  className="bar"
                  style={{ height: `${getNormalizedBarHeight(item.value, maxMarketComparisonAbs)}px` }}
                />
                <div className="bar-label">{item.label}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="table-section">
        <h2>Fluxo de Caixa Descontado</h2>
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              {projectedCashFlows.map((yearData) => (
                <th key={`header-year-${yearData.year}`}>Ano {yearData.year}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {projectedCashFlows.length === 0 ? (
              <tr>
                <td colSpan="2">Sem dados de fluxo de caixa carregados.</td>
              </tr>
            ) : (
              <>
                <tr>
                  <td>Receita</td>
                  {projectedCashFlows.map((yearData) => (
                    <td key={`revenue-${yearData.year}`}>$ {formatNumber(yearData.revenue)}</td>
                  ))}
                  <td>-</td>
                </tr>
                <tr>
                  <td>EBITDA</td>
                  {projectedCashFlows.map((yearData) => (
                    <td key={`ebitda-${yearData.year}`}>$ {formatNumber(yearData.ebitda)}</td>
                  ))}
                  <td>-</td>
                </tr>
                <tr>
                  <td>FCFF</td>
                  {projectedCashFlows.map((yearData) => (
                    <td key={`fcff-${yearData.year}`}>$ {formatNumber(yearData.fcff)}</td>
                  ))}
                  <td>$ {formatNumber(valuationResult?.valuation?.discountedCashFlows)}</td>
                </tr>
                <tr>
                  <td>FCFF a Valor Presente</td>
                  {projectedCashFlows.map((yearData) => (
                    <td key={`pv-fcff-${yearData.year}`}>$ {formatNumber(yearData.presentValueFcff)}</td>
                  ))}
                  <td>$ {formatNumber(valuationResult?.valuation?.discountedCashFlows)}</td>
                </tr>
                <tr>
                  <td>Valor Terminal a VP</td>
                  <td colSpan={projectedCashFlows.length}>
                    Método: {valuationResult?.terminalValue?.method || '-'}
                  </td>
                  <td>$ {formatNumber(valuationResult?.terminalValue?.presentValueTerminalValue)}</td>
                </tr>
                <tr>
                  <td>Enterprise Value</td>
                  <td colSpan={projectedCashFlows.length}>Soma FCFF VP + Valor Terminal VP</td>
                  <td>$ {formatNumber(summary.exitValue)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      <section className="valuation-box-wrap">
        <article className="panel valuation-box">
          <h3>Caminho do Valuation</h3>

          <div className="valuation-row">
            <span>Enterprise Value:</span>
            <strong>$ {formatNumber(summary.exitValue)}</strong>
          </div>
          <div className="valuation-row">
            <span>Discount Rate (manual):</span>
            <strong>{formatRate(rateComparison.manualDiscountRate)}</strong>
          </div>
          <div className="valuation-row">
            <span>WACC de referência (CAPM):</span>
            <strong>{formatRate(rateComparison.waccReference)}</strong>
          </div>
          <div className="valuation-row">
            <span>Spread (manual - WACC):</span>
            <strong>{formatRate(rateComparison.spread)}</strong>
          </div>
          <div className="valuation-row">
            <span>Dívida Líquida:</span>
            <strong>$ {formatNumber(summary.netDebt)}</strong>
          </div>
          <div className="valuation-row">
            <span>Equity Value:</span>
            <strong>$ {formatNumber(summary.equityValue)}</strong>
          </div>
          <div className="valuation-row">
            <span>Ações:</span>
            <strong>{Number(summary.sharesOutstanding).toLocaleString('en-US')}</strong>
          </div>
          <div className="valuation-row">
            <span>Preço Justo:</span>
            <strong>$ {formatMoney(summary.intrinsicPerShare)}</strong>
          </div>
        </article>

        <div className="summary-grid">
          <article className="panel mini">
            <h3>Valor Intrínseco</h3>
            <p>Valor patrimonial/ação</p>
            <div className="mini-main">
              <strong>$ {formatMoney(summary.intrinsicPerShare)}</strong>
            </div>
          </article>

          <article className="panel mini">
            <h3>Valor de Mercado</h3>
            <p>Valor patrimonial/ação</p>
            <div className="mini-main">
              <strong>$ {formatMoney(summary.marketPerShare)}</strong>
            </div>
          </article>

          <article className="panel mini">
            <h3>Taxa de Retorno - Upside(%)</h3>
            <p>Potencial de Alta do Preço-Alvo</p>
            <div className="mini-main">
              <strong>{formatRate(upsidePercent)} ({upsideRecommendation})</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="company-section">
        <article className="panel company-panel">
          <h2>Catálogo de Empresas</h2>

          <form className="company-form" onSubmit={handleCompanySubmit}>
            <input
              name="name"
              placeholder="Nome da empresa"
              value={companyForm.name}
              onChange={handleCompanyChange}
              required
            />
            <input
              name="ticker"
              placeholder="Ticker"
              value={companyForm.ticker}
              onChange={handleCompanyChange}
              required
            />
            <input
              name="sector"
              placeholder="Setor"
              value={companyForm.sector}
              onChange={handleCompanyChange}
              required
            />
            <button type="submit" disabled={companyLoading}>
              {companyLoading ? 'Salvando...' : 'Cadastrar empresa'}
            </button>
          </form>

          {companyError && <p className="feedback error">{companyError}</p>}
          {companySuccess && <p className="feedback success">{companySuccess}</p>}

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Ticker</th>
                <th>Setor</th>
                <th className="action-cell"></th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="5">Sem empresas cadastradas.</td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id}>
                    <td>{company.id}</td>
                    <td>{company.name}</td>
                    <td>{company.ticker}</td>
                    <td>{company.sector}</td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="delete-company-btn"
                        onClick={() => handleCompanyDelete(company.id)}
                        title="Remover empresa"
                        aria-label={`Remover ${company.name}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>

        <article className="panel company-panel">
          <h2>Dados de Mercado</h2>

          <form className="market-form" onSubmit={handleMarketDataSubmit}>
            <div className="market-company-field">
              <label htmlFor="companyId">Empresa</label>
              <select
                id="companyId"
                name="companyId"
                value={marketDataForm.companyId}
                onChange={handleMarketDataChange}
                required
              >
                {companies.length === 0 ? (
                  <option value="">Cadastre uma empresa primeiro</option>
                ) : (
                  companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.ticker})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="market-fieldset-grid">
              <fieldset className="market-fieldset">
                <legend>Precificação & Risco</legend>

                <div className="market-field">
                  <label htmlFor="currentStockPrice">Preço atual da ação</label>
                  <input
                    id="currentStockPrice"
                    name="currentStockPrice"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Preço atual da ação ($)"
                    value={marketDataForm.currentStockPrice}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="sharesOutstanding">Ações emitidas</label>
                  <input
                    id="sharesOutstanding"
                    name="sharesOutstanding"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Total de ações emitidas"
                    value={marketDataForm.sharesOutstanding}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="beta">Beta</label>
                  <input
                    id="beta"
                    name="beta"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Beta da empresa"
                    value={marketDataForm.beta}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="totalDebt">Dívida bruta total</label>
                  <input
                    id="totalDebt"
                    name="totalDebt"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Dívida bruta total ($)"
                    value={marketDataForm.totalDebt}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="costOfDebt">Custo da dívida</label>
                  <input
                    id="costOfDebt"
                    name="costOfDebt"
                    type="number"
                    step="any"
                    placeholder="Custo da dívida (0 a 1)"
                    value={marketDataForm.costOfDebt}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="effectiveTaxRate">Alíquota efetiva de IR</label>
                  <input
                    id="effectiveTaxRate"
                    name="effectiveTaxRate"
                    type="number"
                    step="any"
                    placeholder="Alíquota efetiva de IR (0 a 1)"
                    value={marketDataForm.effectiveTaxRate}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>
              </fieldset>

              <fieldset className="market-fieldset">
                <legend>Demonstrativo de Resultados</legend>

                <div className="market-field">
                  <label htmlFor="cash">Caixa e equivalentes</label>
                  <input
                    id="cash"
                    name="cash"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Caixa e equivalentes ($)"
                    value={marketDataForm.cash}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="netDebt">Dívida líquida</label>
                  <input
                    id="netDebt"
                    name="netDebt"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Dívida líquida ($)"
                    value={marketDataForm.netDebt}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="revenue">Receita líquida</label>
                  <input
                    id="revenue"
                    name="revenue"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Receita líquida ($)"
                    value={marketDataForm.revenue}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="ebitda">EBITDA</label>
                  <input
                    id="ebitda"
                    name="ebitda"
                    type="number"
                    step="any"
                    placeholder="EBITDA ($)"
                    value={marketDataForm.ebitda}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="ebit">EBIT</label>
                  <input
                    id="ebit"
                    name="ebit"
                    type="number"
                    step="any"
                    placeholder="EBIT ($)"
                    value={marketDataForm.ebit}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="capex">Capex</label>
                  <input
                    id="capex"
                    name="capex"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Capex do exercício ($)"
                    value={marketDataForm.capex}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="depreciation">Depreciação e amortização</label>
                  <input
                    id="depreciation"
                    name="depreciation"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Depreciação e amortização ($)"
                    value={marketDataForm.depreciation}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>

                <div className="market-field">
                  <label htmlFor="workingCapital">Capital de giro líquido</label>
                  <input
                    id="workingCapital"
                    name="workingCapital"
                    type="number"
                    step="any"
                    placeholder="Capital de giro líquido ($)"
                    value={marketDataForm.workingCapital}
                    onChange={handleMarketDataChange}
                    required
                  />
                </div>
              </fieldset>
            </div>

            <div className="inline-actions market-actions">
              <button type="submit" disabled={marketDataLoading || companies.length === 0}>
                {marketDataLoading ? 'Salvando...' : 'Cadastrar dados'}
              </button>
            </div>
          </form>

          {marketDataError && <p className="feedback error">{marketDataError}</p>}
          {marketDataSuccess && <p className="feedback success">{marketDataSuccess}</p>}

          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Receita</th>
                <th>EBITDA</th>
                <th>Dívida Líquida</th>
                <th>Beta</th>
                <th>Preço Atual</th>
                <th>Atualizado em</th>
                <th className="action-cell"></th>
              </tr>
            </thead>
            <tbody>
              {marketDataList.length === 0 ? (
                <tr>
                  <td colSpan="8">Sem dados de mercado cadastrados.</td>
                </tr>
              ) : (
                marketDataList.map((entry) => (
                  <tr key={entry.companyId}>
                    <td>{findCompanyLabel(entry.companyId)}</td>
                    <td>{formatNumber(entry.revenue)}</td>
                    <td>{formatNumber(entry.ebitda)}</td>
                    <td>{formatNumber(entry.netDebt)}</td>
                    <td>{Number(entry.beta).toFixed(2)}</td>
                    <td>$ {formatMoney(entry.currentStockPrice)}</td>
                    <td>{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString('en-US') : '-'}</td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="delete-company-btn"
                        onClick={() => handleMarketDataDelete(entry.companyId)}
                        title="Remover dados de mercado"
                        aria-label={`Remover dados de ${findCompanyLabel(entry.companyId)}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>

        <article className="panel company-panel">
          <h2>Premissas Salvas</h2>

          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Anos</th>
                <th>Discount Rate</th>
                <th>Rf</th>
                <th>MRP</th>
                <th>g</th>
                <th>Método TV</th>
                <th>Múltiplo</th>
                <th className="action-cell"></th>
              </tr>
            </thead>
            <tbody>
              {assumptionsList.length === 0 ? (
                <tr>
                  <td colSpan="9">Sem premissas cadastradas.</td>
                </tr>
              ) : (
                assumptionsList.map((entry) => (
                  <tr key={entry.companyId}>
                    <td>{findCompanyLabel(entry.companyId)}</td>
                    <td>{entry.projectionYears}</td>
                    <td>{formatRate(entry.discountRate)}</td>
                    <td>{formatRate(entry.riskFreeRate)}</td>
                    <td>{formatRate(entry.marketRiskPremium)}</td>
                    <td>{formatRate(entry.perpetualGrowthRate)}</td>
                    <td>{entry.terminalValueMethod}</td>
                    <td>{entry.exitMultiple === null ? '-' : formatMoney(entry.exitMultiple)}</td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="delete-company-btn"
                        onClick={() => handleAssumptionsDelete(entry.companyId)}
                        title="Remover premissas"
                        aria-label={`Remover premissas de ${findCompanyLabel(entry.companyId)}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}

export default App;