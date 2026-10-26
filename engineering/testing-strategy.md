# Testing Strategy

+## Engineering test policy

Write the narrowest deterministic test first, then Worker/API integration and high-value browser path. Fixtures use generated/non-sensitive sample media. Tests must assert authorization and failure path, not only happy UI. Test names include stable case IDs from the master plan.
