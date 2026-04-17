function HomeScreen({
  companies,
  marketDataList,
  assumptionsList,
  summary,
  projectionGrowthData,
  marketComparisonData,
  maxProjectionGrowthAbs,
  maxMarketComparisonAbs,
  getNormalizedBarHeight,
  formatRate,
  formatMoney,
  findCompanyLabel,
  selectedCompanyId,
  upsidePercent,
  upsideRecommendation
}) {
  const getMarketComparisonBarHeight = (value) => {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return 0;
    }

    const absValue = Math.abs(parsedValue);
    if (absValue === 0) {
      return 0;
    }

    const MIN_HEIGHT = 10;
    const MAX_HEIGHT = 78;
    const safeMaxAbs = maxMarketComparisonAbs > 0 ? maxMarketComparisonAbs : 1;
    const ratio = absValue / safeMaxAbs;
    const normalized = MIN_HEIGHT + ratio * (MAX_HEIGHT - MIN_HEIGHT);

    return Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, normalized));
  };

  return (
    <>
      <section className="home-overview-grid">
        <article className="panel mini">
          <h3>Empresas Cadastradas</h3>
          <p>Microsserviço Gestão de Empresas</p>
          <div className="mini-main">
            <strong>{companies.length}</strong>
          </div>
        </article>

        <article className="panel mini">
          <h3>Dados de Mercado</h3>
          <p>Registros disponíveis para valuation</p>
          <div className="mini-main">
            <strong>{marketDataList.length}</strong>
          </div>
        </article>

        <article className="panel mini">
          <h3>Premissas Salvas</h3>
          <p>Premissas configuradas por empresa</p>
          <div className="mini-main">
            <strong>{assumptionsList.length}</strong>
          </div>
        </article>
      </section>

      <section className="top-grid">
        <article className="panel chart-panel">
          <h2>Resumo da Empresa Selecionada</h2>
          <div className="valuation-row">
            <span>Empresa:</span>
            <strong>{selectedCompanyId ? findCompanyLabel(selectedCompanyId) : '-'}</strong>
          </div>
          <div className="valuation-row">
            <span>Valor Intrínseco/ação:</span>
            <strong>{formatMoney(summary.intrinsicPerShare)}</strong>
          </div>
          <div className="valuation-row">
            <span>Valor de Mercado/ação:</span>
            <strong>{formatMoney(summary.marketPerShare)}</strong>
          </div>
          <div className="valuation-row">
            <span>Upside:</span>
            <strong>{formatRate(upsidePercent)} ({upsideRecommendation})</strong>
          </div>
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
          <h2>Mercado vs Intrínseco</h2>
          <div className="bar-chart small market-comparison-chart">
            {marketComparisonData.length === 0 ? (
              <div className="bar-empty">Sem valores calculados para comparação.</div>
            ) : marketComparisonData.map((item) => {
              const parsedValue = Number(item.value);
              const isNegative = Number.isFinite(parsedValue) && parsedValue < 0;
              const directionClass = isNegative ? 'negative' : 'positive';
              const barHeight = getMarketComparisonBarHeight(parsedValue);

              return (
                <div className="bar-item" key={item.label}>
                  <div className="bar-value">{formatMoney(item.value)}</div>
                  <div className="market-bar-area" aria-hidden="true">
                    <div
                      className={`bar market-comparison-bar ${directionClass}`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <div className="bar-label">{item.label}</div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </>
  );
}

export default HomeScreen;
