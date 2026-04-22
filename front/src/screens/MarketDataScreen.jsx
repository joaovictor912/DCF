function MarketDataScreen({
  companies,
  marketDataForm,
  marketDataLoading,
  marketDataError,
  marketDataSuccess,
  marketDataList,
  handleMarketDataChange,
  handleMarketDataSubmit,
  handleMarketDataDelete,
  findCompanyLabel,
  formatNumber,
  formatMoney
}) {
  return (
    <section className="company-section">
      <article className="panel company-panel">
        <h2>Market Data</h2>

        <form className="market-form" onSubmit={handleMarketDataSubmit}>
          <div className="market-company-field">
            <label htmlFor="companyId">Company</label>
            <select
              id="companyId"
              name="companyId"
              value={marketDataForm.companyId}
              onChange={handleMarketDataChange}
              required
            >
              {companies.length === 0 ? (
                <option value="">Create a company first</option>
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
              <legend>Pricing & Risk</legend>

              <div className="market-field">
                <label htmlFor="currentStockPrice">Current Stock Price</label>
                <input
                  id="currentStockPrice"
                  name="currentStockPrice"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Current stock price ($)"
                  value={marketDataForm.currentStockPrice}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>

              <div className="market-field">
                <label htmlFor="sharesOutstanding">Shares Outstanding</label>
                <input
                  id="sharesOutstanding"
                  name="sharesOutstanding"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Total shares outstanding"
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
                  placeholder="Company beta"
                  value={marketDataForm.beta}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>

              <div className="market-field">
                <label htmlFor="totalDebt">Total Gross Debt</label>
                <input
                  id="totalDebt"
                  name="totalDebt"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Total gross debt ($)"
                  value={marketDataForm.totalDebt}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>

              <div className="market-field">
                <label htmlFor="costOfDebt">Cost of Debt</label>
                <input
                  id="costOfDebt"
                  name="costOfDebt"
                  type="number"
                  step="any"
                  placeholder="Cost of debt (0 to 1)"
                  value={marketDataForm.costOfDebt}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>

              <div className="market-field">
                <label htmlFor="effectiveTaxRate">Effective Tax Rate</label>
                <input
                  id="effectiveTaxRate"
                  name="effectiveTaxRate"
                  type="number"
                  step="any"
                  placeholder="Effective tax rate (0 to 1)"
                  value={marketDataForm.effectiveTaxRate}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>
            </fieldset>

            <fieldset className="market-fieldset">
              <legend>Income Statement</legend>

              <div className="market-field">
                <label htmlFor="cash">Cash and Equivalents</label>
                <input
                  id="cash"
                  name="cash"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Cash and equivalents ($)"
                  value={marketDataForm.cash}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>

              <div className="market-field">
                <label htmlFor="netDebt">Net Debt</label>
                <input
                  id="netDebt"
                  name="netDebt"
                  type="number"
                  step="any"
                  placeholder="Net debt ($)"
                  value={marketDataForm.netDebt}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>

              <div className="market-field">
                <label htmlFor="revenue">Net Revenue</label>
                <input
                  id="revenue"
                  name="revenue"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Net revenue ($)"
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
                  placeholder="Period capex ($)"
                  value={marketDataForm.capex}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>

              <div className="market-field">
                <label htmlFor="depreciation">Depreciation and Amortization</label>
                <input
                  id="depreciation"
                  name="depreciation"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Depreciation and amortization ($)"
                  value={marketDataForm.depreciation}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>

              <div className="market-field">
                <label htmlFor="workingCapital">Net Working Capital</label>
                <input
                  id="workingCapital"
                  name="workingCapital"
                  type="number"
                  step="any"
                  placeholder="Net working capital ($)"
                  value={marketDataForm.workingCapital}
                  onChange={handleMarketDataChange}
                  required
                />
              </div>
            </fieldset>
          </div>

          <div className="inline-actions market-actions">
            <button type="submit" disabled={marketDataLoading || companies.length === 0}>
              {marketDataLoading ? 'Saving...' : 'Save data'}
            </button>
          </div>
        </form>

        {marketDataError && <p className="feedback error">{marketDataError}</p>}
        {marketDataSuccess && <p className="feedback success">{marketDataSuccess}</p>}

        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Revenue</th>
              <th>EBITDA</th>
              <th>Net Debt</th>
              <th>Beta</th>
              <th>Current Price</th>
              <th>Updated At</th>
              <th className="action-cell"></th>
            </tr>
          </thead>
          <tbody>
            {marketDataList.length === 0 ? (
              <tr>
                <td colSpan="8">No market data saved.</td>
              </tr>
            ) : (
              marketDataList.map((entry) => (
                <tr key={entry.companyId}>
                  <td>{findCompanyLabel(entry.companyId)}</td>
                  <td>{formatMoney(entry.revenue)}</td>
                  <td>{formatMoney(entry.ebitda)}</td>
                  <td>{formatMoney(entry.netDebt)}</td>
                  <td>{Number(entry.beta).toFixed(2)}</td>
                  <td>{formatMoney(entry.currentStockPrice)}</td>
                  <td>{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString('en-US') : '-'}</td>
                  <td className="action-cell">
                    <button
                      type="button"
                      className="delete-company-btn"
                      onClick={() => handleMarketDataDelete(entry.companyId)}
                      title="Delete market data"
                      aria-label={`Delete data for ${findCompanyLabel(entry.companyId)}`}
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
  );
}

export default MarketDataScreen;
