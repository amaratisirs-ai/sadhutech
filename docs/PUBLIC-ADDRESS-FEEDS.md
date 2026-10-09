# Public Address Feed Imports

The Gate imports address reports into the existing `threat_intel` table on startup
and every six hours. Imports do not make addresses trusted or change verdict
thresholds. These sources include historical labels, not just newly discovered
incidents; an import timestamp is not an incident timestamp.

## Added Sources

| Source | Format | Coverage | License |
|--------|--------|----------|---------|
| [MyEtherWallet ethereum-lists](https://github.com/MyEtherWallet/ethereum-lists) | Address darklist JSON | Community warnings about Ethereum scam/phishing addresses; historical coverage | MIT |
| [Forta labelled-datasets](https://github.com/forta-network/labelled-datasets) | Ethereum phishing CSV | Historical Etherscan `phish-hack` labels, extracted through Luabase; publisher file last updated October 2022 | MIT |

Only Forta's `labels/1/phishing_scams.csv` is imported. Other files include
whitehat or differently classified addresses and are not imported wholesale.
The MyEtherWallet lightlist, domain lists, tokens, and contract catalog are not
imported. MetaMask's phishing domain lists do not fit the address table.

Scam Sniffer's existing address import now reads the entire available list rather
than its first 1,000 entries. Its existing GPL-3.0 license still applies to that
dataset; review redistribution obligations before publishing dataset copies.

## Duplicate Prevention

- Accept only valid 40-hex-character EVM addresses and normalize to lowercase.
- New feeds exclude the zero address and deduplicate their own records.
- Across feeds, the first configured source keeps ownership of each address,
  preserving existing sync classification and quorum behavior. Do not count
  mirrors or upstream provenance stages as independent reporters.
- Write at most 250 unique addresses per batch using existing primary-key
  `ON CONFLICT (address)` upserts. Repeated runs update records rather than add
  duplicate rows. Failed batches fall back to individual reports.
- Existing trust flags, first-seen timestamps, and distinct reporter handling
  remain owned by the PostgreSQL adapter.

The sync total is addresses processed, including existing rows; it is not a count
of new inserts. The raw source count can be larger than the final unique total.

## Running The Import

Deploy the Gate branch through a PR and normal Render deployment to run the
startup sync. For a manual public-only import in a trusted environment with
`DATABASE_URL` configured:

```bash
pnpm --filter @genesis/gate sync --public-only
```

This imports curated records, Scam Sniffer, CryptoScamDB, MyEtherWallet and Forta.
It does not call Blockaid, Chainabuse, Rugdoc or SlowMist. Never paste connection
strings or API keys into chat or commit them.

Verify the database after importing:

```sql
SELECT COUNT(*) AS total,
       COUNT(DISTINCT lower(address)) AS unique_addresses
FROM threat_intel;

SELECT lower(address), COUNT(*)
FROM threat_intel
GROUP BY lower(address)
HAVING COUNT(*) > 1;
```

The duplicate query must return no rows. A repeated import of unchanged feeds
should not increase the total.

## Read-Only Coverage Check

On October 8, 2026 (local date), the live table contained 4,123 records. A read-only
comparison found 2,530 unique Scam Sniffer addresses, 652 supported MyEtherWallet
addresses, and 6,205 unique Forta phishing addresses. Combined with the existing
table, these represented 5,535 unique new addresses, for a projected 9,658 total.
This is a snapshot, not a promise of future counts, and no production write was
performed during the comparison.

## Third-Party Notices

### MyEtherWallet Ethereum Lists

Source: https://github.com/MyEtherWallet/ethereum-lists

MIT License

Copyright (c) 2020 MyEtherWallet

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

### Forta Foundation Labelled Datasets

Source: https://github.com/forta-network/labelled-datasets

MIT License

Copyright (c) 2022 Forta Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.