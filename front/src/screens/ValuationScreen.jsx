function ValuationScreen({
  projectedCashFlows,
  valuationResult,
  summary,
  rateComparison,
  upsidePercent,
  upsideRecommendation,
  valuationLoading,
  valuationError,
  valuationSuccess,
  handleRecalculateValuation,
  formatNumber,
  formatMoney,
  formatRate
}) {
  const totalNominalFcff = projectedCashFlows.reduce(
    (accumulator, yearData) => accumulator + Number(yearData.fcff || 0),
    0
  );

  return (
    <>
      <section className="valuation-actions-section">
        <div className="inline-actions">
          <button
            type="button"
            onClick={handleRecalculateValuation}
            disabled={valuationLoading}
          >
            {valuationLoading ? 'Calculating...' : 'Recalculate valuation'}
          </button>
        </div>
        {valuationError && <p className="feedback error">{valuationError}</p>}
        {valuationSuccess && <p className="feedback success">{valuationSuccess}</p>}
      </section>

      <section className="table-section">
        <h2>Discounted Cash Flow</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              {projectedCashFlows.map((yearData) => (
                <th key={`header-year-${yearData.year}`}>Year {yearData.year}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {projectedCashFlows.length === 0 ? (
              <tr>
                <td colSpan="2">No cash flow data loaded.</td>
              </tr>
            ) : (
              <>
                <tr>
                  <td>Revenue</td>
                  {projectedCashFlows.map((yearData) => (
                    <td key={`revenue-${yearData.year}`}>{formatMoney(yearData.revenue)}</td>
                  ))}
                  <td>-</td>
                </tr>
                <tr>
                  <td>EBITDA</td>
                  {projectedCashFlows.map((yearData) => (
                    <td key={`ebitda-${yearData.year}`}>{formatMoney(yearData.ebitda)}</td>
                  ))}
                  <td>-</td>
                </tr>
                <tr>
                  <td>FCFF</td>
                  {projectedCashFlows.map((yearData) => (
                    <td key={`fcff-${yearData.year}`}>{formatMoney(yearData.fcff)}</td>
                  ))}
                  <td>{formatMoney(totalNominalFcff)}</td>
                </tr>
                <tr>
                  <td>FCFF at Present Value</td>
                  {projectedCashFlows.map((yearData) => (
                    <td key={`pv-fcff-${yearData.year}`}>{formatMoney(yearData.presentValueFcff)}</td>
                  ))}
                  <td>{formatMoney(valuationResult?.valuation?.discountedCashFlows)}</td>
                </tr>
                <tr>
                  <td>Terminal Value at PV</td>
                  <td colSpan={projectedCashFlows.length}>
                    Method: {valuationResult?.terminalValue?.method || '-'}
                  </td>
                  <td>{formatMoney(valuationResult?.terminalValue?.presentValueTerminalValue)}</td>
                </tr>
                <tr>
                  <td>Enterprise Value</td>
                  <td colSpan={projectedCashFlows.length}>Sum of FCFF PV + Terminal Value PV</td>
                  <td>{formatMoney(summary.exitValue)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      <section className="valuation-box-wrap">
        <article className="panel valuation-box">
          <h3>Valuation Path</h3>

          <div className="valuation-row">
            <span>Enterprise Value:</span>
            <strong>{formatMoney(summary.exitValue)}</strong>
          </div>
          <div className="valuation-row">
            <span>Discount Rate (manual):</span>
            <strong>{formatRate(rateComparison.manualDiscountRate)}</strong>
          </div>
          <div className="valuation-row">
            <span>Reference WACC (CAPM):</span>
            <strong>{formatRate(rateComparison.waccReference)}</strong>
          </div>
          <div className="valuation-row">
            <span>Spread (manual - WACC):</span>
            <strong>{formatRate(rateComparison.spread)}</strong>
          </div>
          <div className="valuation-row">
            <span>Net Debt:</span>
            <strong>{formatMoney(summary.netDebt)}</strong>
          </div>
          <div className="valuation-row">
            <span>Equity Value:</span>
            <strong>{formatMoney(summary.equityValue)}</strong>
          </div>
          <div className="valuation-row">
            <span>Shares:</span>
            <strong>{formatNumber(summary.sharesOutstanding)}</strong>
          </div>
          <div className="valuation-row">
            <span>Fair Price:</span>
            <strong>{formatMoney(summary.intrinsicPerShare)}</strong>
          </div>
        </article>

        <div className="summary-grid">
          <article className="panel mini">
            <h3>Intrinsic Value</h3>
            <p>Equity value/share</p>
            <div className="mini-main">
              <strong>{formatMoney(summary.intrinsicPerShare)}</strong>
            </div>
          </article>

          <article className="panel mini">
            <h3>Market Value</h3>
            <p>Equity value/share</p>
            <div className="mini-main">
              <strong>{formatMoney(summary.marketPerShare)}</strong>
            </div>
          </article>

          <article className="panel mini">
            <h3>Return Rate - Upside (%)</h3>
            <p>Target price upside potential</p>
            <div className="mini-main">
              <strong>{formatRate(upsidePercent)} ({upsideRecommendation})</strong>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}

export default ValuationScreen;
