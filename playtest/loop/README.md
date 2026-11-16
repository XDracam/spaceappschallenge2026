# Historical overnight workflow

`overnight.workflow.js` is retained as historical development tooling. It changes systems, rules and authored content, creates autonomous commits, and can rebase/push to main when explicitly configured; such pushes deploy the site. It is not a presentation-only mode. The original overnight authorization does not authorize another run.

Execution now refuses by default. A future use requires new explicit authorization for gameplay changes and autonomous commits, recorded in `authorizationNote`, and corresponding `authorizeGameplayChanges` / `authorizeAutonomousCommits` flags. Publishing additionally requires `authorizePublication` and the existing opt-in `pushToMain`. The clean dedicated-worktree preflight remains required. These flags record authorization; they do not grant it. Do not set them from old notes.

For the current post-submission pass, use read-only reviews, normal reversible implementation and build checks under the current user scope. Do not invoke this workflow.
