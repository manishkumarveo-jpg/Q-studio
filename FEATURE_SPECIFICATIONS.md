# FEATURE SPECIFICATIONS

+## Feature contracts

| Feature | Source of truth | Critical rule |
|---|---|---|
| Native review comments | D1 comments + asset_versions | No OCR; time/frame and version are explicit. |
| External screenshot intake | R2 source/crop keys + D1 ingestion records | OCR text stays separate from producer-edited correction text. |
| Correction sheet | D1 qc_items | Possible/Not Possible are mutually exclusive; Fixed is independent. |
| Asset organization | D1 folders/assets/collections | Collections reference assets; they never duplicate them. |
| Shares | D1 review_links, token hash | Token scope, expiry, revocation, passphrase and actions validate server-side. |
| Transfers | D1 upload intents/job records + R2 | A queue/UI state is not completion until the server verifies the object. |

Detailed UI contracts are in [ux/ui-guidelines.md](ux/ui-guidelines.md); API contracts are in [architecture/api-design.md](architecture/api-design.md).
