# Decision DCF — Valuation Platform

A web application for intrinsic value estimation of publicly traded companies using the Discounted Cash Flow (DCF) methodology — the standard valuation framework used by investment banks, equity research analysts, and asset managers.

---

## Author

João Victor Pessoa de Lima dos Anjos

---

## What it does

Decision DCF allows a user to input real financial data for any publicly traded company and receive a complete DCF valuation, including projected free cash flows, terminal value, enterprise value, equity value, and intrinsic value per share — benchmarked against the current market price with an implied Buy / Hold / Sell signal.

---

## The Financial Model

The application implements a standard FCFF-based DCF model, consistent with the methodology used in professional investment banking practice.

**Free Cash Flow to the Firm (FCFF)**

Starting from projected revenue, the model builds down to FCFF year by year:

```
Revenue x EBITDA Margin              = EBITDA
EBITDA - D&A                         = EBIT
EBIT x (1 - Effective Tax Rate)      = NOPAT
NOPAT + D&A - Capex - Change in NWC  = FCFF
```

**Discount Rate (WACC)**

The cost of capital is calculated via the CAPM framework:

```
Ke   = Rf + Beta x Equity Risk Premium
Kd   = Cost of Debt x (1 - Tax Rate)
WACC = (E/V) x Ke + (D/V) x Kd
```

**Terminal Value**

The model supports two terminal value methods:

- Gordon Growth Model: TV = FCFF_last x (1 + g) / (WACC - g)
- Exit Multiple: TV = EBITDA_last x Multiple

**From Enterprise Value to Equity Value**

```
Sum of discounted FCFFs + PV of Terminal Value  =  Enterprise Value (EV)
EV - Net Debt                                   =  Equity Value
Equity Value / Shares Outstanding               =  Intrinsic Value per Share
```

---

## Sensitivity Analysis

Beyond the base case, the platform generates three sensitivity matrices showing how the intrinsic value per share changes across combinations of key assumptions:

- WACC vs. Perpetual Growth Rate (g)
- WACC vs. EBITDA Margin
- Perpetual Growth Rate (g) vs. EBITDA Margin

This is standard practice in professional valuation to stress-test assumptions and understand the range of plausible outcomes rather than relying on a single point estimate.

---

## Sample Valuation — Apple Inc. (AAPL), FY2023

The following inputs and outputs can be used to validate the full application end-to-end.

**Inputs — Market Data**

| Field | Value |
|-------|-------|
| Current Stock Price | $189.95 |
| Shares Outstanding | 15,550,000,000 |
| Beta | 1.24 |
| Net Debt | $49,000,000,000 |
| Net Revenue | $383,285,000,000 |
| EBITDA | $126,456,000,000 |
| EBIT | $114,301,000,000 |
| Capex | $11,499,000,000 |
| D&A | $12,155,000,000 |
| Effective Tax Rate | 15% |
| Cost of Debt | 3.0% |

**Inputs — Projection Assumptions**

| Field | Value |
|-------|-------|
| Projection Years | 5 |
| Revenue Growth (Years 1–3) | 6.0% p.a. |
| Revenue Growth (Years 4–5) | 5.0% p.a. |
| EBITDA Margin | 33.0% |
| Capex (% of Revenue) | 3.0% |
| Working Capital Change (% of Revenue) | 0.5% |
| Risk-Free Rate | 4.5% |
| Equity Risk Premium | 5.5% |
| WACC | 10.0% |
| Perpetual Growth Rate (g) | 2.5% |
| Terminal Value Method | Gordon Growth |

**Expected Output**

| Metric | Value |
|--------|-------|
| Intrinsic Value per Share | ~$93.07 |
| Enterprise Value | ~$1.5 trillion |
| Equity Value | ~$1.4 trillion |
| Market Price | $189.95 |
| Upside / Downside | -51.0% (SELL) |

The discount between intrinsic value and market price reflects the conservative growth assumptions used. The sensitivity matrix shows the model converges toward the market price under a WACC of approximately 8% or a perpetual growth rate above 3.5%, consistent with market consensus pricing on Apple's services segment and ecosystem durability.

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
