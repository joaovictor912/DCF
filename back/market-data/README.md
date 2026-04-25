# Microservice 2 - Market Data

Service responsible for storing current financial data used by the DCF model.

## Stored data

- `companyId` (positive integer)
- `cash`
- `netDebt`
- `sharesOutstanding`
- `updatedAt` (last update timestamp)

## Endpoints

- `GET /health` - microservice status
- `GET /market-data` - list all records
- `GET /market-data/:companyId` - get data by company
- `POST /market-data` - create market data record
- `PUT /market-data/:companyId` - update an existing record
- `DELETE /market-data/:companyId` - delete a record

## Example

```json
{
  "companyId": 3,
  "cash": 450000000,
  "netDebt": 1200000000,
  "sharesOutstanding": 980000000
}
```
