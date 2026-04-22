function AssumptionsScreen({
  assumptionsForm,
  companies,
  assumptionsLoading,
  assumptionsError,
  assumptionsSuccess,
  valuationLoading,
  valuationError,
  valuationSuccess,
  assumptionsList,
  handleAssumptionChange,
  handleAssumptionsSubmit,
  handleAssumptionsDelete,
  handleRecalculateValuation,
  findCompanyLabel,
  formatRate,
  formatNumber
}) {
  return (
    <section className="company-section">
      <article className="panel assumptions">
        <h2>Projection Assumptions</h2>

        <form className="assumption-list" onSubmit={handleAssumptionsSubmit}>
          <label className="full-width">
            <span>Company</span>
            <select 
              name="companyId"
              value={assumptionsForm.companyId}
              onChange={handleAssumptionChange}
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
          </label>

          <label>
            <span>Projection Years</span>
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
            <span>Discount Rate (0 to 1)</span>
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
            <span>Risk-Free Rate (optional)</span>
            <input
              name="riskFreeRate"
              type="number"
              step="any"
              placeholder="Default: 0.045 (4.5%)"
              value={assumptionsForm.riskFreeRate}
              onChange={handleAssumptionChange}
            />
          </label>

          <label>
            <span>Market Risk Premium (optional)</span>
            <input
              name="marketRiskPremium"
              type="number"
              step="any"
              placeholder="Default: 0.055 (5.5%)"
              value={assumptionsForm.marketRiskPremium}
              onChange={handleAssumptionChange}
            />
          </label>

          <label>
            <span>Working Capital Change (% Revenue)</span>
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
            <span>Terminal Value Method</span>
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
            <span>Projected EBITDA Margin</span>
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
            <span>Revenue Growth by Year</span>
            <input
              name="revenueGrowthByYear"
              placeholder="Example: 0.1,0.08,0.07"
              value={assumptionsForm.revenueGrowthByYear}
              onChange={handleAssumptionChange}
              required
            />
          </label>

          <label>
            <span>Capex (% of Revenue)</span>
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
            <span>Perpetual Growth (g)</span>
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
            <span>Exit Multiple</span>
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

          <div className="inline-actions assumption-actions full-width">
            <button type="submit" disabled={assumptionsLoading || companies.length === 0}>
              {assumptionsLoading ? 'Saving...' : 'Save assumptions'}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={handleRecalculateValuation}
              disabled={valuationLoading || companies.length === 0}
            >
              {valuationLoading ? 'Calculating...' : 'Calculate valuation'}
            </button>
          </div>

          {assumptionsError && <p className="feedback error">{assumptionsError}</p>}
          {assumptionsSuccess && <p className="feedback success">{assumptionsSuccess}</p>}
          {valuationError && <p className="feedback error">{valuationError}</p>}
          {valuationSuccess && <p className="feedback success">{valuationSuccess}</p>}
        </form>
      </article>

      <article className="panel company-panel">
        <h2>Saved Assumptions</h2>

        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Years</th>
              <th>Discount Rate</th>
              <th>Rf</th>
              <th>MRP</th>
              <th>g</th>
              <th>TV Method</th>
              <th>Multiple</th>
              <th className="action-cell"></th>
            </tr>
          </thead>
          <tbody>
            {assumptionsList.length === 0 ? (
              <tr>
                <td colSpan="9">No assumptions saved.</td>
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
                  <td>{entry.exitMultiple === null ? '-' : formatNumber(entry.exitMultiple)}</td>
                  <td className="action-cell">
                    <button
                      type="button"
                      className="delete-company-btn"
                      onClick={() => handleAssumptionsDelete(entry.companyId)}
                      title="Delete assumptions"
                      aria-label={`Delete assumptions for ${findCompanyLabel(entry.companyId)}`}
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

export default AssumptionsScreen;
