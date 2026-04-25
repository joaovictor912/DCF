function InstructiveScreen() {
  return (
    <section className="instructive-screen">
      <article className="instructive-content">
        <h1>DCF — Valuation Platform</h1>
        
        <p className="subtitle">
          A web application for intrinsic value estimation of publicly traded companies using the Discounted Cash Flow (DCF) methodology — the standard valuation framework used by investment banks, equity research analysts, and asset managers.
        </p>

        <hr />

        <h2>What it does</h2>
        <p>
          DCF allows a user to input real financial data for any publicly traded company and receive a complete DCF valuation, including projected free cash flows, terminal value, enterprise value, equity value, and intrinsic value per share — benchmarked against the current market price with an implied Buy / Hold / Sell signal.
        </p>

        <hr />

        <h2>The Financial Model</h2>
        <p>
          The application implements a standard FCFF-based DCF model, consistent with the methodology used in professional investment banking practice.
        </p>

        <h3>Free Cash Flow to the Firm (FCFF)</h3>
        <p>Starting from projected revenue, the model builds down to FCFF year by year:</p>
        <pre className="code-block">
{`EBITDA = Revenue x EBITDA Margin
EBIT = EBITDA - D&A
NOPAT = EBIT x (1 - Effective Tax Rate)
FCFF = NOPAT + D&A - Capex - Change in NWC`}
        </pre>

        <h3>Discount Rate (WACC)</h3>
        <p>
          The cost of capital is calculated via CAPM. The valuation engine uses this WACC as the default
          discount rate and accepts a manual discount rate as an override when available.
        </p>
        <pre className="code-block">
{`Ke = Rf + Beta x Equity Risk Premium
Kd = Cost of Debt x (1 - Tax Rate)
WACC = (E/V) x Ke + (D/V) x Kd`}
        </pre>

        <h3>Terminal Value</h3>
        <p>The model supports two terminal value methods:</p>
        <ul>
          <li><strong>Gordon Growth Model:</strong> TV = FCFF_last x (1 + g) / (WACC - g)</li>
          <li><strong>Exit Multiple:</strong> TV = EBITDA_last x Multiple</li>
        </ul>

        <h3>From Enterprise Value to Equity Value</h3>
        <pre className="code-block">  
{`Enterprise Value (EV) = Sum of discounted FCFFs + PV of Terminal Value
Net Debt (derived) = Total Debt - Cash
Equity Value = Enterprise Value (EV) - Net Debt (derived)
Intrinsic Value per Share = Equity Value / Shares Outstanding`}
        </pre>

        <h3>Depreciation Projection Logic</h3>
        <p>The platform supports two depreciation projection modes:</p>
        <ul>
          <li><strong>PPE-based mode:</strong> If <strong>ppe</strong> is provided in market data, projected Capex is added to prior PPE and depreciation is applied over the accumulated asset base.</li>
          <li><strong>Revenue-based fallback:</strong> If PPE is not provided, depreciation is projected as a fixed ratio of revenue to preserve backward compatibility.</li>
        </ul>

        <hr />

        <h2>Sensitivity Analysis</h2>
        <p>
          Beyond the base case, the platform generates three sensitivity matrices showing how the intrinsic value per share changes across combinations of key assumptions:
        </p>
        <ul>
          <li>WACC vs. Perpetual Growth Rate (g)</li>
          <li>WACC vs. EBITDA Margin</li>
          <li>Perpetual Growth Rate (g) vs. EBITDA Margin</li>
        </ul>
        <p>
          This is standard practice in professional valuation to stress-test assumptions and understand the range of plausible outcomes rather than relying on a single point estimate.
        </p>

        <hr />

        <h2>Getting Started</h2>
        <p>
          The application comes pre-loaded with a complete, ready-to-run DCF valuation for <strong>Meta Platforms (META)</strong>, using audited FY2024 financial data sourced directly from Meta's official earnings release and SEC 10-K filing.
        </p>
        <p>
          <strong>No setup is required.</strong> All inputs and valuation outputs are pre-loaded in this static demo, so users can open the site and immediately review the full model.
        </p>

        <h3>Why Meta?</h3>
        <p>
          Meta's 2023–2024 turnaround — from the "Year of Efficiency" cost restructuring to explosive margin expansion and AI-driven revenue acceleration — makes it one of the most discussed valuation cases in current investment banking and equity research. Revenue grew 22% in FY2024, operating margin expanded to 42%, and free cash flow reached approximately $52 billion. The company also holds a net cash position, meaning it has more cash on hand than gross debt outstanding.
        </p>

        <h3>Platform Navigation</h3>
        <dl className="nav-guide">
          <dt><strong>Home</strong></dt>
          <dd>Overview of registered companies, market data, and current valuation summary for the selected company.</dd>

          <dt><strong>Company Management</strong></dt>
          <dd>Add, view, and manage the list of companies available in the platform.</dd>

          <dt><strong>Market Data</strong></dt>
          <dd>Input current market prices, shares outstanding, debt levels, and audited financial data for each company.</dd>

          <dt><strong>Assumptions & Projections</strong></dt>
          <dd>Define revenue growth rates, EBITDA margins, capital expenditure assumptions, tax rates, discount rates, and terminal value methodology for the DCF model.</dd>

          <dt><strong>Valuation</strong></dt>
          <dd>Execute the DCF calculation and view detailed outputs including projected cash flows, discount factors, present values, terminal value, enterprise value, and per-share intrinsic value.</dd>

          <dt><strong>Sensitivity</strong></dt>
          <dd>Explore sensitivity matrices to understand how the intrinsic valuation changes across ranges of key assumptions (WACC, growth, margin).</dd>
        </dl>

        <hr />

        <h2>Quick Workflow</h2>
        <ol className="workflow">
          <li>Select or create a company from the Company Management screen.</li>
          <li>Input or update market data from the Market Data screen.</li>
          <li>Set assumptions and projections from the Assumptions & Projections screen.</li>
          <li>Navigate to the Valuation screen to review the pre-calculated base case or recalculate with edited assumptions.</li>
          <li>Review the results and explore Sensitivity matrices to stress-test assumptions.</li>
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
