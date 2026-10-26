# Data Flow

+## Data flows

Native comment: authorized asset version → Worker validation → D1 comment/audit → authorized realtime event → optional QC link.

Upload: scoped intent → private object upload → server completion verification → asset/object record → queue derivatives.

OCR: source screenshot → batch/job → local/compatible processor → validated normalized geometry/crop → needs-review or QC item. Jobs are idempotent and retry-safe.
