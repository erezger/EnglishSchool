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

Ideas and requests not built yet, roughly by priority. Move an item to a branch/PR when work starts.

## Next up


## Learning content

- More subjects later (content-driven, so a subject is mostly data, not code).

## Parents


## Tech

- Split the rest of `src/legacy` into React components (spelling is the first React game page).
- Off-server copies of DB backups (e.g. Oracle Object Storage).
- Full server-side coin accounting (would need the original game rewritten; today a server-side cap per save/hour limits abuse).
