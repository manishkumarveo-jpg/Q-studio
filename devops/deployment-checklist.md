# Deployment Checklist

+## Deployment checklist

- Approved migration and tested backup/rollback plan.
- Correct isolated D1/R2/Queue/DO bindings and private R2 policy.
- Secrets configured outside source and absent from bundles.
- Bootstrap secret/operator runbook verified; no public bootstrap after owner exists.
- CORS/origin/header/rate-limit settings reviewed.
- Health, queue failure visibility, media-runtime plan and smoke suite pass.
- Known limitations and costs documented.
