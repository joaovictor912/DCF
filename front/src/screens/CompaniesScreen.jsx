function CompaniesScreen({
  companyForm,
  companyLoading,
  companyError,
  companySuccess,
  companies,
  handleCompanyChange,
  handleCompanySubmit,
  handleCompanyDelete
}) {
  return (
    <section className="company-section">
      <article className="panel company-panel">
        <h2>Company Catalog</h2>

        <form className="company-form" onSubmit={handleCompanySubmit}>
          <input
            name="name"
            placeholder="Company name"
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
            placeholder="Sector"
            value={companyForm.sector}
            onChange={handleCompanyChange}
            required
          />
          <button type="submit" disabled={companyLoading}>
            {companyLoading ? 'Saving...' : 'Create company'}
          </button>
        </form>

        {companyError && <p className="feedback error">{companyError}</p>}
        {companySuccess && <p className="feedback success">{companySuccess}</p>}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Ticker</th>
              <th>Sector</th>
              <th className="action-cell"></th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan="5">No companies saved.</td>
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
                      title="Delete company"
                      aria-label={`Delete ${company.name}`}
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

export default CompaniesScreen;
