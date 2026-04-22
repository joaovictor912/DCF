# Decision DCF — Valuation Platform

A web application for intrinsic value estimation of publicly traded companies using the Discounted Cash Flow (DCF) methodology — the standard valuation framework used by investment banks, equity research analysts, and asset managers.

---

## Author

João Victor Pessoa de Lima dos Anjos - 2026

---

## What it does

Decision DCF allows a user to input real financial data for any publicly traded company and receive a complete DCF valuation, including projected free cash flows, terminal value, enterprise value, equity value, and intrinsic value per share — benchmarked against the current market price with an implied Buy / Hold / Sell signal.

---

## The Financial Model

The application implements a standard FCFF-based DCF model, consistent with the methodology used in professional investment banking practice.

**Free Cash Flow to the Firm (FCFF)**

Starting from projected revenue, the model builds down to FCFF year by year:

```
EBITDA = Revenue x EBITDA Margin
EBIT = EBITDA - D&A
NOPAT = EBIT x (1 - Effective Tax Rate)
FCFF = NOPAT + D&A - Capex - Change in NWC
```

**Discount Rate (WACC)**

The cost of capital is calculated via the CAPM framework:

```
Ke = Rf + Beta x Equity Risk Premium
Kd = Cost of Debt x (1 - Tax Rate)
WACC = (E/V) x Ke + (D/V) x Kd
```

**Terminal Value**

The model supports two terminal value methods:

- Gordon Growth Model: TV = FCFF_last x (1 + g) / (WACC - g)
- Exit Multiple: TV = EBITDA_last x Multiple

**From Enterprise Value to Equity Value**

```
Enterprise Value (EV) = Sum of discounted FCFFs + PV of Terminal Value
Equity Value = Enterprise Value (EV) - Net Debt
Intrinsic Value per Share = Equity Value / Shares Outstanding
```

---

## Sensitivity Analysis

Beyond the base case, the platform generates three sensitivity matrices showing how the intrinsic value per share changes across combinations of key assumptions:

- WACC vs. Perpetual Growth Rate (g)
- WACC vs. EBITDA Margin
- Perpetual Growth Rate (g) vs. EBITDA Margin

This is standard practice in professional valuation to stress-test assumptions and understand the range of plausible outcomes rather than relying on a single point estimate.

---

## Pre-loaded Company — Meta Platforms (META), FY2024

The application comes pre-loaded with a complete, ready-to-run DCF valuation for Meta Platforms, Inc. (Nasdaq: META), using audited FY2024 financial data sourced directly from Meta's official earnings release and SEC 10-K filing.

No setup is required. Open the app, select Meta Platforms from the company dropdown, navigate to the Valuation tab, and click Calculate Valuation to see the full model in action.

**Why Meta?**

Meta's 2023–2024 turnaround — from the "Year of Efficiency" cost restructuring to explosive margin expansion and AI-driven revenue acceleration — makes it one of the most discussed valuation cases in current investment banking and equity research. Revenue grew 22% in FY2024, operating margin expanded to 42%, and free cash flow reached approximately $52 billion. The company also holds a net cash position, meaning it has more cash on hand than gross debt outstanding.

**Pre-loaded Market Data (FY2024)**

| Field | Value |
|-------|-------|
| Current Stock Price | $589.00 |
| Shares Outstanding | 2,540,000,000 |
| Beta | 1.31 |
| Total Gross Debt | $28,830,000,000 |
| Net Debt | -$14,170,000,000 (net cash position) |
| Cash and Equivalents | $43,000,000,000 |
| Net Revenue | $164,501,000,000 |
| EBITDA | $84,253,000,000 |
| EBIT | $69,380,000,000 |
| Capex | $37,725,000,000 |
| D&A | $14,873,000,000 |
| Effective Tax Rate | 15% |
| Cost of Debt | 4.0% |

**Pre-loaded Projection Assumptions**

| Field | Value |
|-------|-------|
| Projection Years | 5 |
| Revenue Growth (Years 1–3) | 15%, 13%, 11% p.a. |
| Revenue Growth (Years 4–5) | 9%, 8% p.a. |
| EBITDA Margin | 51.2% |
| Capex (% of Revenue) | 20.0% |
| Working Capital Change (% of Revenue) | 0.5% |
| Risk-Free Rate | 4.5% |
| Equity Risk Premium | 5.5% |
| WACC | 10.0% |
| Perpetual Growth Rate (g) | 3.0% |
| Terminal Value Method | Gordon Growth |

**Expected Output**

| Metric | Value |
|--------|-------|
| Intrinsic Value per Share | ~$350–380 |
| Enterprise Value | ~$850–950 billion |
| Market Price | $589.00 |
| Upside / Downside | ~-40% (SELL signal under conservative assumptions) |

The gap between the model's intrinsic value and the current market price reflects conservative growth assumptions relative to market consensus. Meta's stock is priced for continued AI monetization, sustained margin expansion, and growth in Reels and WhatsApp Business. The sensitivity analysis demonstrates that under a WACC of 8.5% and perpetual growth of 3.5% — closer to sell-side consensus — the model converges toward the $550–600 range, narrowing the discount to market significantly.

---

## Where to Find Input Data

All financial inputs used in this application are publicly available at no cost:

- **Yahoo Finance** (finance.yahoo.com): stock price, beta, shares outstanding, revenue, EBITDA, capex, D&A, net debt
- **SEC EDGAR** (edgar.sec.gov): official 10-K and 10-Q filings — primary source for all income statement and balance sheet data
- **Macrotrends** (macrotrends.net): historical financials and margin trends

---

## Tech Stack

- Front-end: React
- Back-end: Node.js / Express, microservices architecture with manual event bus
- Language: JavaScript / TypeScript
- Storage: In-memory
