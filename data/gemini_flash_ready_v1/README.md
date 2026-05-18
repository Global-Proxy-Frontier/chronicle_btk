# Gemini Flash Ready AML Dataset (Raw)

This folder is isolated from the app source and contains a synthetic AML dataset designed for fast per-customer analysis with Gemini Flash.

## Files

- customers.csv: 1000 rows
- accounts.csv: 1000 rows
- transactions_part1.csv: 50000 rows
- transactions_part2.csv: 50000 rows
- customer_transaction_summary.csv: 1000 rows
- manifest.json: generation metadata

## Important Rules Applied

- No precomputed AML risk score columns
- No suspicious labels
- No laundering-type labels
- Raw transactional and behavioral fields only

## Core Idea

When user clicks a customer, filter by customer_id and send:

1. customer profile from customers.csv
2. account row from accounts.csv
3. last N transactions (for example last 100) from transactions_part*.csv

This keeps token usage controlled and gives Gemini enough context for explainable analysis.

## Regeneration

Run from project root:

node ./scripts/generate_gemini_flash_dataset.js

The generator is deterministic with a fixed seed in the script.
