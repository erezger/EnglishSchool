# Backlog

## Done

- Spelling with letter names, class word lists, AI completion (PR #4)
- Mastery check ("מבחן אמת") + parent coin add/remove with reason (PR #5)
- Daily spaced-repetition review "5 דקות ביום" (PR #6)
- Placement test "מבחן מיקום" (PR #7)
- Sentence dictation + practice hub (PR #8)
- Grammar mini-games (PR #9)
- Reading comprehension stories (PR #10)
- Speaking practice with speech recognition (PR #11)
- Per-kid module on/off settings (PR #12)
- Activity log, weekly parent report, daily goal (PR #13)
- Server-side coin guard: caps per save and per hour, audit + parent warning (PR #14)
- Sight-words speed reading (PR #15)
- Off-server copies of DB backups (PR #16)
- Main game rewritten in React, `src/legacy` removed (PRs #17–#20)
- Coin economy: learning pays once a day per item, tests only the first time, shop ×5, parent recompute; fix: game ignored completed levels (opened at level 1, no ✓ marks) (PR #21)

Ideas and requests not built yet, roughly by priority. Move an item to a branch/PR when work starts.

## Next up


## Learning content

- More subjects later (content-driven, so a subject is mostly data, not code).

## Parents


## Tech

- Full server-side coin accounting (each reward granted by an API call instead of the client saving its balance). Now possible since the game is React; today a server-side cap per save/hour limits abuse.
