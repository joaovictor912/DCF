# Microservice 5 - Sensitivity Matrix

Service responsible for generating DCF sensitivity matrices based on data from `ms-valuation-engine`.

## Purpose

- Consume a base valuation by company from `ms-valuation-engine`
- Recalculate DCF locally per cell (without calling MS4 for each combination)
- Show the impact on fair value per share when varying WACC, perpetual growth (g), and EBITDA margin

## How to run

1. Install dependencies:

```bash
npm install
```

2. Start the service:

```bash
npm run dev
```

Default port: `3005`

## Environment variables

- `PORT` - microservice port (default: 3005)
- `VALUATION_ENGINE_URL` - base URL for ms-valuation-engine (default: `http://localhost:3004`)

## Endpoints

- `GET /health` - service status and default step values
- `POST /sensitivity/:companyId/matrices` - generate sensitivity matrices

## Default steps

If the user does not provide steps in the request body, the service uses:

- `waccSteps`: `[-0.02, -0.01, 0, 0.01, 0.02]`
- `gSteps`: `[-0.01, -0.005, 0, 0.005, 0.01]`
- `ebitdaMarginSteps`: `[-0.03, -0.015, 0, 0.015, 0.03]`

## Per-cell rules

- If `wacc <= g`, the cell returns `fairValuePerShare: null`
- If `fairValuePerShare < 0`, the negative value is preserved
- `fairValuePerShare` is rounded to 2 decimal places

## Request example

```http
POST /sensitivity/1/matrices
Content-Type: application/json
```

```json
{
  "syncFromServices": true,
  "waccSteps": [-0.02, -0.01, 0, 0.01, 0.02],
  "gSteps": [-0.01, -0.005, 0, 0.005, 0.01],
  "ebitdaMarginSteps": [-0.03, -0.015, 0, 0.015, 0.03]
}
```

## Financial formula used per cell

1. Annual FCFF projection
2. FCFF discounting using the cell WACC
3. Terminal value via Gordon:
   `TV = FCF_(N+1) / (wacc - g)`
4. `EnterpriseValue = SumPV(FCFF) + PV(TV)`
5. `EquityValue = EnterpriseValue - NetDebt`
6. `FairValue = EquityValue / SharesOutstanding`
