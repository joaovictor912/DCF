# Microsservico 3 - Premissas de Projecao

Servico responsavel por armazenar as premissas forward-looking definidas pelo usuario para o DCF.

## Premissas armazenadas

- `companyId` (inteiro positivo)
- `projectionYears` (anos de projecao)
- `discountRate` (taxa de desconto)
- `riskFreeRate` (opcional, taxa livre de risco para CAPM)
- `marketRiskPremium` (opcional, premio de risco de mercado para CAPM)
- `revenueGrowthByYear` (crescimento de receita por ano)
- `projectedEbitdaMargin` (margem EBITDA projetada)
- `capexPercentOfRevenue` (Capex como percentual da receita)
- `workingCapitalChangePercentOfRevenue` (variacao de capital de giro como percentual da receita)
- `perpetualGrowthRate` (taxa de crescimento na perpetuidade, g)
- `terminalValueMethod` (`GORDON` ou `EXIT_MULTIPLE`)
- `exitMultiple` (obrigatorio quando `terminalValueMethod = EXIT_MULTIPLE`)

## Regras importantes

- `revenueGrowthByYear` precisa ter exatamente a quantidade de elementos de `projectionYears`.
- `perpetualGrowthRate` deve ser menor que `discountRate`.
- `terminalValueMethod = EXIT_MULTIPLE` exige `exitMultiple > 0`.

## Como executar

1. Instale as dependencias:

```bash
npm install
```

2. Rode o servico:

```bash
npm run dev
```

## Endpoints

- `GET /health` - status do microsservico
- `GET /assumptions` - lista todas as premissas
- `GET /assumptions/:companyId` - consulta premissas por empresa
- `POST /assumptions` - cria premissas para uma empresa
- `PUT /assumptions/:companyId` - atualiza premissas da empresa
- `DELETE /assumptions/:companyId` - remove premissas da empresa

## Exemplo `POST /assumptions`

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
