# Development Strategy

+## Implementation strategy

Complete documentation gate before code. Build phases strictly in numbered order, and update each plan's Run results after real tests. Local demo mode may support deterministic frontend seed data only; it must not simulate a cloud result as real. Replace a mock boundary only in its named service phase. Gate exit requires acceptance, required/regression/security/performance checks, documented failures and no critical unresolved issue.
