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
                  placeholder="Preço atual da ação (R$)"
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
                  placeholder="Dívida bruta total (R$)"
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
                  placeholder="Caixa e equivalentes (R$)"
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
                  placeholder="Dívida líquida (R$)"
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
                  placeholder="Receita líquida (R$)"
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
                  placeholder="EBITDA (R$)"
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
                  placeholder="EBIT (R$)"
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
                  placeholder="Capex do exercício (R$)"
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
                  placeholder="Depreciação e amortização (R$)"
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
                  placeholder="Capital de giro líquido (R$)"
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
                  <td>{formatMoney(entry.revenue)}</td>
                  <td>{formatMoney(entry.ebitda)}</td>
                  <td>{formatMoney(entry.netDebt)}</td>
                  <td>{Number(entry.beta).toFixed(2)}</td>
                  <td>{formatMoney(entry.currentStockPrice)}</td>
                  <td>{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString('pt-BR') : '-'}</td>
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
    </section>
  );
}

export default MarketDataScreen;
