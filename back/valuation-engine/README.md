# Microservice 4 - Valuation Engine

Service responsible for processing financial data and calculating DCF valuation.

## Purpose

- Receive events from other microservices
- Keep an internal per-company state
- Calculate future cash flows and discount them to present value
- Determine Enterprise Value, Equity Value, and fair value per share

## How to run

1. Install dependencies:

```bash
npm install
```

2. Start the service:

```bash
npm run dev
```

Default port: `3004`

## Endpoints

- `GET /health` - service status
- `GET /events/types` - list supported event types
- `POST /events` - process a single event or an array of events
- `GET /state` - show which companies have market data/assumptions/valuation
- `GET /valuations` - list cached valuations
- `GET /valuation/:companyId` - return cached valuation (does not recalculate)
- `POST /valuation/:companyId/recalculate` - explicit recalculation
- `POST /valuation/recalculate-all` - recalculate all companies with complete data
- `POST /valuation/:companyId/sync-from-services` - fetch data from microservices 1, 2, and 3 and calculate valuation

## Event types

- `COMPANY_UPSERTED`
- `COMPANY_DELETED`
- `MARKET_DATA_UPSERTED`
- `MARKET_DATA_DELETED`
- `ASSUMPTIONS_UPSERTED`
- `ASSUMPTIONS_DELETED`

## Single event example

```json
{
  "eventType": "ASSUMPTIONS_UPSERTED",
  "payload": {
    "companyId": 3,
    "projectionYears": 5,
    "discountRate": 0.105,
    "riskFreeRate": 0.045,
    "marketRiskPremium": 0.055,
    "revenueGrowthByYear": [0.08, 0.07, 0.06, 0.05, 0.045],
    "projectedEbitdaMargin": 0.31,
    "capexPercentOfRevenue": 0.03,
    "workingCapitalChangePercentOfRevenue": 0.005,
    "perpetualGrowthRate": 0.03,
    "terminalValueMethod": "EXIT_MULTIPLE",
    "exitMultiple": 11
  }
}
```

## Event batch example

```json
[
  {
    "eventType": "COMPANY_UPSERTED",
    "payload": {
      "id": 3,
      "name": "Apple Inc.",
      "ticker": "AAPL",
      "sector": "Technology"
    }
  },
  {
    "eventType": "MARKET_DATA_UPSERTED",
    "payload": {
      "companyId": 3,
      "currentStockPrice": 175.4,
      "sharesOutstanding": 15500000000,
      "beta": 1.28,
      "totalDebt": 123000000000,
      "costOfDebt": 0.045,
      "effectiveTaxRate": 0.16,
      "cash": 67000000000,
      "netDebt": 56000000000,
      "revenue": 383000000000,
      "ebitda": 131000000000,
      "ebit": 119000000000,
      "capex": 11000000000,
      "depreciation": 12000000000,
      "workingCapital": 35000000000
    }
  }
]
```

## Financial model used

1. Revenue projection by year:

`revenue_t = revenue_(t-1) * (1 + growth_t)`

2. FCFF by year:

`FCFF = NOPAT + Depreciation - Capex - WorkingCapitalChange`

3. Present value of FCFF:

By default, FCFF is discounted using CAPM-based WACC reference. If a manual `discountRate` is provided, it is used as an override.

`PV(FCFF_t) = FCFF_t / (1 + effectiveDiscountRate)^t`

4. Terminal value:

- Gordon:
  `TV = FCFF_(N+1) / (effectiveDiscountRate - g)`
- Exit Multiple:
  `TV = EBITDA_N * ExitMultiple`

5. Firm value and equity value:

- `EnterpriseValue = SumPV(FCFF) + PV(TV)`
- `NetDebt (derived) = totalDebt - cash`
- `EquityValue = EnterpriseValue - NetDebt (derived)`
- `FairValue = EquityValue / SharesOutstanding`

## Reference WACC (CAPM)

The engine also calculates a reference WACC for comparison:

- `Ke = Rf + beta * (Rm - Rf)`
- `Kd = costOfDebt * (1 - effectiveTaxRate)`
- `E = currentStockPrice * sharesOutstanding`
- `D = totalDebt`
- `WACC_ref = Ke * E/(E + D) + Kd * D/(E + D)`

Fields returned in `rates`:

- `manualDiscountRate`
- `riskFreeRate`
- `marketRiskPremium`
- `costOfEquity`
- `costOfDebtAfterTax`
- `waccReference`
- `discountRateMinusWaccReference`

## Synchronization with services 1, 2, and 3

The endpoint `POST /valuation/:companyId/sync-from-services` automatically fetches from:

- `ms-gestao-empresas` (port 3001)
- `ms-market-data` (port 3002)
- `ms-premissas-projecao` (port 3003)

You can customize URLs with environment variables:

- `COMPANY_SERVICE_URL`
- `MARKET_DATA_SERVICE_URL`
- `ASSUMPTIONS_SERVICE_URL`
