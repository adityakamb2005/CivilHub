# CivilHub documentation

Reviewed on 23 October 2026 at release commit `9d28f85`.
Start with the [project README](../README.md) for features, architecture and local setup.

## Developer and validation guides

| Document | Purpose |
| --- | --- |
| [Contributing](../CONTRIBUTING.md) | Development boundaries, review and validation expectations |
| [Atomic acceptance](ATOMIC_ACCEPTANCE.md) | Transaction boundary, migration order and known limits |
| [Acceptance security review](ATOMIC_ACCEPTANCE_REVIEW.md) | Authorization, RLS, grants and evidence boundaries |
| [Integration test report](../ATOMIC_INTEGRATION_TEST_REPORT.md) | Dated local results and corrected concurrency coverage |
| [Screenshots](screenshots/README.md) | Genuine local captures and remaining capture checklist |

The integration report preserves its earlier worktree/checkpoint descriptions.
Commit `9d28f85` subsequently recorded that work; the report is historical evidence,
not the current Git status or a production certificate.

## Production preparation

[Deployment and migration checklist](DEPLOYMENT.md) covers hosting, environment
names, Auth URLs, backup, read-only verification SQL and manual launch gates.
It does not authorize any hosted operation.

## Historical design material

[Marketplace audit](MARKETPLACE_AUDIT.md),
[security plan](MARKETPLACE_SECURITY_PLAN.md) and
[P0 application identity notes](P0_APPLICATION_IDENTITY.md) explain earlier
investigation and proposals. Some options and blocked-test statements are
historical; current SQL, the acceptance guides and dated execution report take
precedence. No historical document was removed.

## Recommended GitHub About settings

Prepared for manual entry; settings were not changed.

- **Description:** Civil engineering marketplace connecting clients and engineers through professional profiles, project listings, applications and project messaging.
- **Topics:** `civil-engineering`, `construction`, `marketplace`, `nextjs`,
  `typescript`, `react`, `supabase`, `postgresql`, `full-stack`
- **Website:** **WEBSITE URL REQUIRED AFTER DEPLOYMENT**

The public GitHub API reports an empty repository homepage field. A source
metadata reference to `civilhub.com` could not be verified as accessible and owned
by this project. Do not publish it as the live website without verification.
