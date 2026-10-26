# TESTING STRATEGY

+## Test layers

Use Vitest for deterministic domain logic and components, Miniflare/Wrangler patterns for Worker/D1/R2/Queue integration, Playwright for critical journeys, axe/manual keyboard checks for accessibility, and fixture-driven OCR/media benchmarks. Every test declares an ID, requirement, phase, setup, action, expected result, status, and evidence.

No test is Passed unless executed; unavailable infrastructure is Blocked with an owner and reason. See [MASTER_TEST_PLAN.md](MASTER_TEST_PLAN.md) and [test-cases/](test-cases/).
