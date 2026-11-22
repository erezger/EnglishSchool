# Backlog

Ideas and requests not built yet, roughly by priority. Move an item to a branch/PR when work starts.

## Next up

- **Mastery check ("מבחן אמת")** — a periodic short test on words/letters the kid marked as known,
  without hints, so progress can't be faked by just clicking "I learned it". Results visible to parents.
  - **Parents can deduct coins** if the test shows things were marked without being learned
    (amount + reason; shown to the kid; audit-logged). *(requested)*
- **Spaced repetition "5 minutes a day"** — daily review of due words (stats already stored per word in
  `spellingStats`: correct / wrong / streak / last seen).
- **Placement test** — short adaptive test that skips levels the kid already knows.

## Learning content

- Sight-words track (the, said, because, friend…) as its own game modes (partly in the grade 4 bank).
- Sentence dictation: hear a sentence, type all of it.
- Reading comprehension: short graded stories with audio, tap a word to hear/translate, questions (unseen prep).
- Grade 3–4 grammar mini-games: am/is/are, have/has, there is/are, plurals, present simple.
- Speaking: say the word into the mic (Chrome speech recognition) and get feedback.
- More subjects later (content-driven, so a subject is mostly data, not code).

## Parents

- Weekly progress report per skill (weak words, time practiced, trends).
- Per-kid settings: which modules are open, daily goal, difficulty.

## Tech

- Split the rest of `src/legacy` into React components (spelling is the first React game page).
- Off-server copies of DB backups (e.g. Oracle Object Storage).
- Server-side coin accounting (today the game client reports coins; a tech-savvy kid could edit them).
