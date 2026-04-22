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
          <h3>Registered Companies</h3>
          <p>Company Management microservice</p>
          <div className="mini-main">
            <strong>{companies.length}</strong>
          </div>
        </article>

        <article className="panel mini">
          <h3>Market Data</h3>
          <p>Records available for valuation</p>
          <div className="mini-main">
            <strong>{marketDataList.length}</strong>
          </div>
        </article>

        <article className="panel mini">
          <h3>Saved Assumptions</h3>
          <p>Assumptions configured by company</p>
          <div className="mini-main">
            <strong>{assumptionsList.length}</strong>
          </div>
        </article>
      </section>

      <section className="top-grid">
        <article className="panel chart-panel">
          <h2>Selected Company Summary</h2>
          <div className="valuation-row">
            <span>Company:</span>
            <strong>{selectedCompanyId ? findCompanyLabel(selectedCompanyId) : '-'}</strong>
          </div>
          <div className="valuation-row">
            <span>Intrinsic Value/share:</span>
            <strong>{formatMoney(summary.intrinsicPerShare)}</strong>
          </div>
          <div className="valuation-row">
            <span>Market Value/share:</span>
            <strong>{formatMoney(summary.marketPerShare)}</strong>
          </div>
          <div className="valuation-row">
            <span>Upside:</span>
            <strong>{formatRate(upsidePercent)}{upsideRecommendation !== '-' ? ` (${upsideRecommendation})` : ''}</strong>
          </div>
        </article>

        <article className="panel chart-panel">
          <h2>Revenue Growth</h2>
          <div className="bar-chart">
            {projectionGrowthData.length === 0 ? (
              <div className="bar-empty">Fill Revenue Growth by Year to display the chart.</div>
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
          <h2>Market vs Intrinsic</h2>
          <div className="bar-chart small market-comparison-chart">
            {marketComparisonData.length === 0 ? (
              <div className="bar-empty">No calculated values available for comparison.</div>
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
