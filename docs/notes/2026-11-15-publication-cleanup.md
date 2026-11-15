# Publication cleanup — November 15, 2026

Source: user-requested repository cleanup before judging. This explicitly permits publication redactions in historical notes; original wording elsewhere remains preserved. Cuts are marked `[redacted for publication]`.

## Working-tree edits

- Reduced the domain note to a custom domain via CNAME to GitHub Pages; redacted private infrastructure references in the decision and idea registers as well.
- Redacted two brainstorming examples from the source note and their copies in the concept, brainstorm, role, idea and question documents. Retained the surrounding mechanics and stable identifiers.
- Removed the private artifact link from the science note and idea register.
- Shortened the overnight autonomy note while retaining the user authorization for pushes, the recorded review/build process and the distinction from human validation.
- Made the title-screen artwork explicit in the submission disclosure and linked its recorded image-generation prompt. README and third-party credits already disclose it.
- Replaced a remaining broken link to the removed UI reference image with a description.

## History preparation and observed checks

Prepared an isolated mirror outside this checkout. Because `git filter-repo` was unavailable, used Git's `filter-branch` with a restricted tree filter in that disposable mirror. Removed the reference image and applied the publication redactions to both published branches, `main` and `science-tech-tree`; deleting only the image would leave the redacted text readable in earlier commits.

Checked all 85 commits reachable from the prepared branch tips and 1,046 unique text blobs: the removed image path and original image blob were absent, and searches found none of the targeted text or private link. Compared branch-tip trees against their originals; differences were confined to the cleanup paths. These are repository inspections, not application tests. No tests were added or run.

This is a prepared local rewrite, not a completed public removal. The shared checkout history and remote branches have not been rewritten or pushed by this cleanup. Publication requires an explicitly authorized, coordinated replacement of both remote branch histories against freshly checked tips. Preserve teammates' unfinished work and re-clone after publication; do not merge old history back in. Existing commit links may become obsolete. Forks, old clones and GitHub-retained commit or pull-request references are outside the scope of a branch force-push and may retain earlier content.
