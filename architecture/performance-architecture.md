# Performance Architecture

+## Performance budget

Initial SPA and route transitions are measured in preview deployment. QC tables virtualize or paginate after profiling, while keyboard selection must still use visible sorted rows. Generate thumbnails/proxies asynchronously; byte-range delivery is designed and tested before media claims. OCR target is empirical: up to ten screenshots/~50 cards, reported as upload and processing p50/p95 with failure rate—not a universal 15-second SLA.
