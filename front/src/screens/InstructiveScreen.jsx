function InstructiveScreen() {
  return (
    <section className="instructive-screen">
      <article className="instructive-content">
        <h1>DCF — Valuation Platform</h1>

        <p className="subtitle">
          A simplified web-based representation of a full Excel DCF model built for Meta Platforms (META). 
          The application is designed to make the valuation logic easier to visualize, while the complete 
          model, detailed assumptions, scenario analysis, and audit trail remain in Excel.
        </p>

        <hr />

        <h2>Purpose of the Platform</h2>
        <p>
          This application serves as an interactive front-end for a simplified Discounted Cash Flow (DCF) 
          valuation. It presents the core mechanics of the Excel model in a cleaner web interface, including 
          projected free cash flows, terminal value, enterprise value, equity value, intrinsic value per share, 
          and implied upside or downside versus the current market price.
        </p>

        <p>
          The site is not intended to replace the full Excel model. Instead, it acts as a visual summary of the 
          base case valuation, allowing users to quickly understand the main valuation drivers and outputs.
        </p>

        <hr />

        <h2>Model Scope</h2>
        <p>
          The web app uses a simplified FCFF-based DCF structure. The Excel model contains the more detailed 
          version, including full financial statement projections, scenario assumptions, sensitivity analysis, 
          and supporting schedules.
        </p>

        <p>
          In the web version, certain assumptions are simplified into high-level inputs such as revenue growth, 
          EBITDA margin, CapEx as a percentage of revenue, working capital change, discount rate, and perpetual 
          growth rate.
        </p>

        <hr />

        <h2>DCF Methodology</h2>
        <p>
          The valuation follows a standard unlevered DCF framework based on Free Cash Flow to the Firm (FCFF).
        </p>

        <h3>Free Cash Flow to the Firm (FCFF)</h3>
        <p>
          The model starts with projected revenue and builds down to FCFF using a simplified operating structure:
        </p>

        <pre className="code-block">
{`EBITDA = Revenue x EBITDA Margin
EBIT = EBITDA - D&A
NOPAT = EBIT x (1 - Effective Tax Rate)
FCFF = NOPAT + D&A - CapEx - Change in NWC`}
        </pre>

        <h3>Discount Rate</h3>
        <p>
          The model uses a WACC-based discount rate. In the base case, the manual discount rate is aligned with 
          the WACC used in the Excel valuation model.
        </p>

        <pre className="code-block">
{`Ke = Rf + Beta x Equity Risk Premium
Kd = Cost of Debt x (1 - Tax Rate)
WACC = (E/V) x Ke + (D/V) x Kd`}
        </pre>

        <h3>Terminal Value</h3>
        <p>
          The current version uses the Gordon Growth Method, also commonly referred to as the perpetuity growth 
          method in DCF valuation.
        </p>

        <pre className="code-block">
{`Terminal Value = FCFF_last x (1 + g) / (WACC - g)`}
        </pre>

        <h3>From Enterprise Value to Intrinsic Value</h3>

        <pre className="code-block">
{`Enterprise Value = Sum of discounted FCFFs + PV of Terminal Value
Net Debt = Total Debt - Cash
Equity Value = Enterprise Value - Net Debt
Intrinsic Value per Share = Equity Value / Shares Outstanding`}
        </pre>

        <hr />

        <h2>Relationship with the Excel Model</h2>
        <p>
          The Excel model is the primary valuation file. It includes the full set of assumptions, scenario 
          analysis, projected financial statements, cash flow statement, DCF schedule, WACC calculation, and 
          sensitivity tables.
        </p>

        <p>
          This web platform reflects the Excel model's base case in a simplified format. Some items are 
          aggregated in the web version to keep the interface clear and focused on the main valuation drivers.
        </p>

        <ul>
          <li><strong>Excel model:</strong> complete, auditable, and detailed valuation model.</li>
          <li><strong>Web app:</strong> simplified visual representation of the base case DCF.</li>
        </ul>

        <hr />

        <h2>Sensitivity Analysis</h2>
        <p>
          The platform includes sensitivity matrices to show how the intrinsic value per share changes when key 
          valuation assumptions move. These tables are intended to help users understand the impact of WACC, 
          perpetual growth, and margin assumptions on the final valuation.
        </p>

        <ul>
          <li>WACC vs. Perpetual Growth Rate</li>
          <li>WACC vs. EBITDA Margin</li>
          <li>Perpetual Growth Rate vs. EBITDA Margin</li>
        </ul>

        <p>
          The full Excel model contains the more complete version of the sensitivity analysis and scenario 
          framework.
        </p>

        <hr />

        <h2>Getting Started</h2>
        <p>
          The application comes pre-loaded with a simplified base case DCF valuation for 
          <strong> Meta Platforms (META)</strong>. No server setup is required in this static demo.
        </p>

        <p>
          Users can review the pre-loaded market data, assumptions, valuation output, and sensitivity tables 
          directly in the browser.
        </p>

        <h3>Platform Navigation</h3>
        <dl className="nav-guide">
          <dt><strong>Home</strong></dt>
          <dd>Provides a high-level overview of the selected company, valuation output, and key charts.</dd>

          <dt><strong>Company Management</strong></dt>
          <dd>Allows users to view and manage companies available in the platform.</dd>

          <dt><strong>Market Data</strong></dt>
          <dd>Contains the market and financial inputs used in the simplified DCF model, including current share price, shares outstanding, debt, cash, revenue, EBITDA, EBIT, CapEx, and D&A.</dd>

          <dt><strong>Assumptions & Projections</strong></dt>
          <dd>Contains the main operating and valuation assumptions, including revenue growth, EBITDA margin, CapEx intensity, working capital change, discount rate, and perpetual growth rate.</dd>

          <dt><strong>Valuation</strong></dt>
          <dd>Shows the DCF output, including projected cash flows, present value of cash flows, terminal value, enterprise value, equity value, and intrinsic value per share.</dd>

          <dt><strong>Sensitivity</strong></dt>
          <dd>Displays sensitivity tables that stress-test the valuation across key assumptions.</dd>
        </dl>

        <hr />

        <h2>Quick Workflow</h2>
        <ol className="workflow">
          <li>Review the selected company and current valuation summary on the Home screen.</li>
          <li>Check the market data inputs on the Market Data screen.</li>
          <li>Review or adjust the assumptions on the Assumptions & Projections screen.</li>
          <li>Open the Valuation screen to view the simplified DCF output.</li>
          <li>Use the Sensitivity screen to understand how changes in key assumptions affect intrinsic value.</li>
        </ol>

        <hr />

        <p className="footer-note">
          <strong>Author:</strong> João Victor Pessoa de Lima dos Anjos - 2026<br />
          <strong>Version:</strong> Decision DCF - Valuation Platform v1.0
        </p>
      </article>
    </section>
  );
}

export default InstructiveScreen;