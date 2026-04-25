# Microservice 1 - Company Management

Companies are registered in the platform by the user to run valuation analysis.

## Purpose

- Register companies (`name`, `ticker`, `sector`)
- TICKER = stock symbol. Example:
  APPLE - AAPL34
- List registered companies

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
- `GET /empresas` - list all companies
- `POST /empresas` - create a new company

### `POST /empresas` example

```json
{
  "name": "Vale",
  "ticker": "VALE3",
  "sector": "Mining"
}
```
