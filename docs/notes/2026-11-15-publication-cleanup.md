# Publication cleanup — November 15, 2026

Source: user-requested repository cleanup before judging. This explicitly permits publication redactions in historical notes; original wording elsewhere remains preserved. Cuts are marked `[redacted for publication]`.

## Working-tree edits

- Reduced the domain note to a custom domain via CNAME to GitHub Pages; redacted private infrastructure references in the decision and idea registers as well.
- Redacted two brainstorming examples from the source note and their copies in the concept, brainstorm, role, idea and question documents. Retained the surrounding mechanics and stable identifiers.
- Removed the private artifact link from the science note and idea register.
- Shortened the overnight autonomy note while retaining the user authorization for pushes, the recorded review/build process and the distinction from human validation.
- Made the title-screen artwork explicit in the submission disclosure and linked its recorded image-generation prompt. README and third-party credits already disclose it.
- Replaced a remaining broken link to the removed UI reference image with a description.

## Initial history preparation and observed checks

Prepared an isolated mirror outside this checkout. Because `git filter-repo` was unavailable, used Git's `filter-branch` with a restricted tree filter in that disposable mirror. Removed the reference image and applied the publication redactions to both published branches, `main` and `science-tech-tree`; deleting only the image would leave the redacted text readable in earlier commits.

Checked all 85 commits reachable from the prepared branch tips and 1,046 unique text blobs: the removed image path and original image blob were absent, and searches found none of the targeted text or private link. Compared branch-tip trees against their originals; differences were confined to the cleanup paths. These are repository inspections, not application tests. No tests were added or run.

At this initial preparation stage, the rewrite had not been published. Replacement of both remote branch histories awaited explicit authorization. The subsequently merged `science-tech-tree` branch was deleted at the user’s request after confirming it had no commits missing from `main`; final publication therefore replaces only `main`. Preserve teammates' unfinished work and re-clone after publication; do not merge old history back in. Existing commit links may become obsolete. Forks, old clones and GitHub-retained commit or pull-request references are outside the scope of a branch force-push and may retain earlier content.

## Final rewrite authorization and verification — November 15, 2026

The user explicitly authorized syncing with `origin/main`, completing the cleanup and force-pushing only after verification. Fast-forwarded the shared checkout to `521b125119556aa8bf48132bfd2b5f345439d4d3`, including the plain-HTTP task-form fix, before making a fresh isolated mirror. The untracked `video/` directory was excluded from the cleanup.

Observed before publication:

- Checked all 93 original commits and 1,251 unique reachable blobs. The removed reference-image path and original image blob are absent from the rewritten branch; searches found none of the targeted text or private artifact link.
- Compared every original commit with its rewritten counterpart. Authors, commit dates, complete messages and parent relationships are preserved. Every tree difference is confined to the designated publication-cleanup paths. Rewriting invalidates original commit signatures; 17 original signatures were removed rather than carried forward as invalid signatures.
- The final `game/` tree is byte-for-byte identical to the latest original `main`, preserving title-art disclosure, selected audio, credits and the HTTP task-form fix. TypeScript checking and the Vite production build passed on that exact game tree. Vite reported its bundle-size warning. No automated tests were added or run.
- Removed the disposable mirror’s original-history backup references and rewrite-state reference, pruned unreachable objects, and passed `git fsck --full --no-reflogs`.
- Publication uses an explicit lease against the freshly checked original remote tip. If another push changes `main`, the replacement must stop and be rebuilt from that new tip. Verify the published branch after pushing and synchronize the shared checkout without adding untracked video work.

After history replacement, teammates must preserve unfinished work and re-clone; merging old branches can reintroduce removed history. A branch rewrite does not erase old clones, forks or GitHub-retained references/cached commit pages. Those may require separate removal through their owners or GitHub.

## Observed publication result — November 15, 2026

The exact-tip force-push replaced `origin/main` from `521b125119556aa8bf48132bfd2b5f345439d4d3` with `ccca7674a567c712eb7285bc0b82deb64bed662d`. A fresh mirror cloned from GitHub contained only `main`, with 94 commits including the verification note, and passed the removed-image, targeted-text and Git integrity checks. The shared checkout was moved to that rewritten tip with `git reset --keep`; no original untracked video files were removed or changed. The published game tree remained identical to the pre-rewrite game tree.

A separate unauthenticated HTTP HEAD check after publication returned HTTP 200 for both the old image’s raw URL and its old commit page. Therefore this cleanup removed the material from the published branch history but did **not** establish complete removal from GitHub. Retained unreferenced objects or cached views require follow-up with GitHub; rewriting or force-pushing again does not establish their removal. A removal-request draft was prepared outside the repository for the owner. No support message was sent.
