# Authorization

+## Permission policy

| Role | Main powers |
|---|---|
| Owner | all workspace, security, member, recovery and billing configuration |
| Admin | users, projects, metadata and operations; no owner transfer without Owner |
| Producer | shows/episodes, assets, review requests, QC assignment/export |
| Editor/Animator | view permitted assets, upload versions, update assigned work/remarks |
| Reviewer | review permitted assets, create/resolve allowed comments/annotations |
| Client/Approver | only review-link asset scope and granted view/comment/approve/download action |

Policy checks are server-side by workspace then project/episode/asset/version/share scope. Guest links never grant workspace browsing. Hidden UI is not permission.
