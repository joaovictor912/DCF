# Microservice 3 - Projection Assumptions

Service responsible for storing forward-looking assumptions defined by the user for DCF.

## Stored assumptions

- `companyId` (positive integer)
- `projectionYears` (projection horizon in years)
- `discountRate` (discount rate)
- `riskFreeRate` (optional, risk-free rate for CAPM)
- `marketRiskPremium` (optional, market risk premium for CAPM)
- `revenueGrowthByYear` (year-by-year revenue growth)
- `projectedEbitdaMargin` (projected EBITDA margin)
- `capexPercentOfRevenue` (Capex as a percentage of revenue)
- `workingCapitalChangePercentOfRevenue` (change in working capital as a percentage of revenue)
- `perpetualGrowthRate` (perpetual growth rate, g)
- `terminalValueMethod` (`GORDON` or `EXIT_MULTIPLE`)
- `exitMultiple` (required when `terminalValueMethod = EXIT_MULTIPLE`)

## Important rules

- `revenueGrowthByYear` must contain exactly `projectionYears` elements.
- `perpetualGrowthRate` must be lower than `discountRate`.
- `terminalValueMethod = EXIT_MULTIPLE` requires `exitMultiple > 0`.

## How to run

1. Install dependencies:

```bash
npm install
```

2. Start the service:

```bash
npm run dev
```

## Endpoints

- `GET /health` - microservice status
- `GET /assumptions` - list all assumptions
- `GET /assumptions/:companyId` - get assumptions by company
- `POST /assumptions` - create assumptions for a company
- `PUT /assumptions/:companyId` - update assumptions for a company
- `DELETE /assumptions/:companyId` - remove assumptions for a company

## `POST /assumptions` example

```json
{
  "companyId": 2,
  "projectionYears": 5,
  "discountRate": 0.12,
  "riskFreeRate": 0.045,
  "marketRiskPremium": 0.055,
  "revenueGrowthByYear": [0.08, 0.07, 0.06, 0.05, 0.04],
  "projectedEbitdaMargin": 0.24,
  "capexPercentOfRevenue": 0.05,
  "workingCapitalChangePercentOfRevenue": 0.01,
  "perpetualGrowthRate": 0.03,
  "terminalValueMethod": "EXIT_MULTIPLE",
  "exitMultiple": 7.5
}
```
