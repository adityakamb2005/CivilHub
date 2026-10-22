# Application screenshots

Captured on 23 October 2026 from release source `9d28f85` in a local Next.js
development server bound to `127.0.0.1:3019`, with the verified isolated Supabase
API at `127.0.0.1:54321` and PostgreSQL at `127.0.0.1:54322`.

The existing CLI/container locality checks were used. A read-only database check
confirmed profile IDs belonged to the four dedicated disposable accounts and no
profile avatar URL was configured. No fixture, account or password was changed.
No cached production build was served; local public settings were forced before
starting development compilation. The owned server and headless Edge were closed.

| Capture | Contents |
| --- | --- |
| [Homepage](homepage.png) | Genuine top viewport with the platform introduction |
| [Engineer directory](engineer-directory.png) | Genuine empty public-directory state |
| [Project listings](project-listings.png) | One existing, clearly labeled disposable local integration test project |

Images are unaltered 1440 × 1050 viewport captures. They contain no session
credentials or production user records. External browser requests were blocked;
a homepage illustration may still be served through Next.js's permitted image
optimizer. The development indicator is expected. Homepage sample engineer cards
elsewhere on the page remain demonstration content, not user adoption evidence.

## Remaining screenshot checklist

These views require a separate authenticated local capture session. They were
not fabricated or represented as completed:

- [ ] Client dashboard with disposable profile/project data.
- [ ] Engineer dashboard with disposable profile/assignment data.
- [ ] Project details and application form.
- [ ] Client application management.
- [ ] Messaging thread with disposable participants and sample conversation.

Use only reviewed disposable local data. Verify database and build locality
before starting; the existing browser/all validation phases rotate the four
dedicated passwords and are unnecessary just to capture public pages. Keep tokens,
email addresses, private information and browser chrome out of published images.
Review every image and update the [README gallery](../../README.md#application-screenshots)
only after the corresponding file exists.
