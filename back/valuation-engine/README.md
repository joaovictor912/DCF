# Microsservico 4 - Valuation Engine

Servico responsavel por processar os dados financeiros e calcular o valuation por DCF.

## Objetivo

- Receber eventos dos outros microsservicos
- Manter um estado interno por empresa
- Calcular fluxos de caixa futuros e trazer a valor presente
- Determinar Enterprise Value, Equity Value e preco justo por acao

## Como executar

1. Instale as dependencias:

```bash
npm install
```

2. Rode o servico:

```bash
npm run dev
```

Padrao de porta: `3004`

## Endpoints

- `GET /health` - status do servico
- `GET /events/types` - lista de tipos de evento suportados
- `POST /events` - processa um evento ou um array de eventos
- `GET /state` - mostra quais empresas possuem market data/premissas/valuation
- `GET /valuations` - lista valuations em cache
- `GET /valuation/:companyId` - retorna valuation em cache (nao recalcula)
- `POST /valuation/:companyId/recalculate` - recalculo explicito
- `POST /valuation/recalculate-all` - recalculo de todas as empresas com dados completos
- `POST /valuation/:companyId/sync-from-services` - busca dados nos microsservicos 1, 2 e 3 e calcula valuation

## Tipos de evento

- `COMPANY_UPSERTED`
- `COMPANY_DELETED`
- `MARKET_DATA_UPSERTED`
- `MARKET_DATA_DELETED`
- `ASSUMPTIONS_UPSERTED`
- `ASSUMPTIONS_DELETED`

## Exemplo de evento unico

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

## Exemplo de lote de eventos

```json
[
  {
    "eventType": "COMPANY_UPSERTED",
    "payload": {
      "id": 3,
      "name": "Apple Inc.",
      "ticker": "AAPL",
      "sector": "Tecnologia"
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

## Formula financeira usada

1. Receita projetada por ano:

`receita_t = receita_(t-1) * (1 + crescimento_t)`

2. FCFF por ano:

`FCFF = NOPAT + Depreciacao - Capex - VariacaoCapitalGiro`

3. Valor presente dos FCFF (usando discountRate manual informado pelo usuario):

`PV(FCFF_t) = FCFF_t / (1 + discountRate)^t`

4. Valor terminal:

- Gordon:
  `TV = FCFF_(N+1) / (discountRate - g)`
- Exit Multiple:
  `TV = EBITDA_N * MultiploSaida`

5. Valor da firma e valor do patrimonio:

- `EnterpriseValue = SomaPV(FCFF) + PV(TV)`
- `EquityValue = EnterpriseValue - NetDebt`
- `PrecoJusto = EquityValue / SharesOutstanding`

## WACC de referencia (CAPM)

O engine calcula tambem um WACC de referencia para comparacao com o `discountRate` manual:

- `Ke = Rf + beta * (Rm - Rf)`
- `Kd = costOfDebt * (1 - effectiveTaxRate)`
- `E = currentStockPrice * sharesOutstanding`
- `D = totalDebt`
- `WACC_ref = Ke * E/(E + D) + Kd * D/(E + D)`

Campos retornados em `rates`:

- `manualDiscountRate`
- `riskFreeRate`
- `marketRiskPremium`
- `costOfEquity`
- `costOfDebtAfterTax`
- `waccReference`
- `discountRateMinusWaccReference`

## Sincronizacao com servicos 1, 2 e 3

O endpoint `POST /valuation/:companyId/sync-from-services` busca automaticamente:

- `ms-gestao-empresas` (porta 3001)
- `ms-market-data` (porta 3002)
- `ms-premissas-projecao` (porta 3003)

Voce pode customizar as URLs com variaveis de ambiente:

- `COMPANY_SERVICE_URL`
- `MARKET_DATA_SERVICE_URL`
- `ASSUMPTIONS_SERVICE_URL`
