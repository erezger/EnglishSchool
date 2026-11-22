/**
 * Grammar mini-games for Israeli grades 3-4. Each question: a sentence with "___",
 * the options, the answer, and a one-line Hebrew reason shown after answering.
 */
export type GrammarQuestion = { sentence: string; options: string[]; answer: string; why: string };
export type GrammarTopic = {
  id: string;
  title: string;
  icon: string;
  rule: string[]; // Hebrew rule card, one line per bullet
  examples: string[];
  questions: GrammarQuestion[];
};

const q = (sentence: string, options: string[], answer: string, why: string): GrammarQuestion => ({ sentence, options, answer, why });

const BE = ['am', 'is', 'are'];
const HAVE = ['have', 'has'];
const THERE = ['is', 'are'];

export const GRAMMAR: GrammarTopic[] = [
  {
    id: 'be',
    title: 'am / is / are',
    icon: '🙋',
    rule: ['I (אני) ← am', 'he / she / it (הוא, היא, זה – אחד) ← is', 'you / we / they (אתה, אנחנו, הם – רבים) ← are'],
    examples: ['I am happy.', 'She is my sister.', 'They are friends.'],
    questions: [
      q('I ___ happy.', BE, 'am', 'I = אני ← am'),
      q('She ___ my sister.', BE, 'is', 'She = היא ← is'),
      q('They ___ in the park.', BE, 'are', 'They = הם ← are'),
      q('The cat ___ black.', BE, 'is', 'The cat = חתול אחד (it) ← is'),
      q('We ___ friends.', BE, 'are', 'We = אנחנו ← are'),
      q('You ___ a good dancer.', BE, 'are', 'You ← תמיד are'),
      q('My dad ___ a doctor.', BE, 'is', 'My dad = הוא ← is'),
      q('The dogs ___ big.', BE, 'are', 'The dogs = הרבה כלבים (they) ← are'),
      q('It ___ hot today.', BE, 'is', 'It ← is'),
      q('I ___ ten years old.', BE, 'am', 'I ← am'),
      q('Dana and Noa ___ in class.', BE, 'are', 'דנה ונועה = הן (they) ← are'),
      q('The book ___ on the table.', BE, 'is', 'The book = ספר אחד (it) ← is'),
    ],
  },
  {
    id: 'have',
    title: 'have / has',
    icon: '🎒',
    rule: ['he / she / it (הוא, היא, זה) ← has', 'I / you / we / they ← have'],
    examples: ['I have a bike.', 'She has a dog.', 'They have two cats.'],
    questions: [
      q('I ___ a red bike.', HAVE, 'have', 'I ← have'),
      q('She ___ a new dress.', HAVE, 'has', 'She = היא ← has'),
      q('We ___ a big garden.', HAVE, 'have', 'We ← have'),
      q('My brother ___ a ball.', HAVE, 'has', 'My brother = הוא ← has'),
      q('They ___ two cats.', HAVE, 'have', 'They ← have'),
      q('The dog ___ a long tail.', HAVE, 'has', 'The dog = it ← has'),
      q('You ___ a nice hat.', HAVE, 'have', 'You ← have'),
      q('Tom ___ a blue pen.', HAVE, 'has', 'Tom = הוא ← has'),
      q('My friends ___ a game.', HAVE, 'have', 'My friends = הם ← have'),
      q('It ___ four legs.', HAVE, 'has', 'It ← has'),
    ],
  },
  {
    id: 'there',
    title: 'there is / there are',
    icon: '📍',
    rule: ['יש אחד ← There is', 'יש הרבה ← There are'],
    examples: ['There is a cat on the bed.', 'There are three apples.'],
    questions: [
      q('There ___ a cat on the bed.', THERE, 'is', 'a cat = אחד ← There is'),
      q('There ___ three apples in the bag.', THERE, 'are', 'three apples = הרבה ← There are'),
      q('There ___ a book on the desk.', THERE, 'is', 'a book = אחד ← There is'),
      q('There ___ many birds in the tree.', THERE, 'are', 'many birds = הרבה ← There are'),
      q('There ___ two chairs in the room.', THERE, 'are', 'two chairs = הרבה ← There are'),
      q('There ___ a big park in my city.', THERE, 'is', 'a park = אחד ← There is'),
      q('There ___ an egg in the box.', THERE, 'is', 'an egg = אחד ← There is'),
      q('There ___ five kids in the car.', THERE, 'are', 'five kids = הרבה ← There are'),
      q('There ___ some pencils in my bag.', THERE, 'are', 'pencils = הרבה ← There are'),
      q('There ___ a bird in the sky.', THERE, 'is', 'a bird = אחד ← There is'),
    ],
  },
  {
    id: 'plural',
    title: 'רבים (one → two)',
    icon: '🐱🐱',
    rule: [
      'בדרך כלל מוסיפים s: cat ← cats',
      'אחרי s, x, sh, ch מוסיפים es: box ← boxes',
      'y אחרי עיצור ← ies: baby ← babies',
      'מילים מיוחדות: man ← men, child ← children, foot ← feet, tooth ← teeth',
    ],
    examples: ['one cat, two cats', 'one box, two boxes', 'one baby, two babies'],
    questions: [
      q('one cat, two ___', ['cats', 'cates', 'caties'], 'cats', 'רוב המילים: מוסיפים s'),
      q('one box, two ___', ['boxes', 'boxs', 'boxies'], 'boxes', 'אחרי x מוסיפים es'),
      q('one bus, three ___', ['buses', 'buss', 'busies'], 'buses', 'אחרי s מוסיפים es'),
      q('one baby, two ___', ['babies', 'babys', 'babyes'], 'babies', 'y אחרי עיצור ← ies'),
      q('one dog, four ___', ['dogs', 'doges', 'dogies'], 'dogs', 'רוב המילים: מוסיפים s'),
      q('one dish, two ___', ['dishes', 'dishs', 'dishies'], 'dishes', 'אחרי sh מוסיפים es'),
      q('one man, two ___', ['men', 'mans', 'manes'], 'men', 'מילה מיוחדת: man ← men'),
      q('one child, three ___', ['children', 'childs', 'childes'], 'children', 'מילה מיוחדת: child ← children'),
      q('one foot, two ___', ['feet', 'foots', 'feets'], 'feet', 'מילה מיוחדת: foot ← feet'),
      q('one apple, five ___', ['apples', 'applees', 'applies'], 'apples', 'רוב המילים: מוסיפים s'),
      q('one fox, two ___', ['foxes', 'foxs', 'foxies'], 'foxes', 'אחרי x מוסיפים es'),
      q('one tooth, many ___', ['teeth', 'tooths', 'toothes'], 'teeth', 'מילה מיוחדת: tooth ← teeth'),
    ],
  },
  {
    id: 'present',
    title: 'he plays / I play',
    icon: '⚽',
    rule: [
      'he / she / it ← מוסיפים s לפועל: she plays',
      'אחרי sh, ch, s, x ← es: he watches',
      'I / you / we / they ← בלי s: we play',
    ],
    examples: ['She plays football.', 'I play football.', 'He watches TV.'],
    questions: [
      q('She ___ football every day.', ['plays', 'play'], 'plays', 'She ← מוסיפים s'),
      q('I ___ to school.', ['go', 'goes'], 'go', 'I ← בלי s'),
      q('He ___ milk in the morning.', ['drinks', 'drink'], 'drinks', 'He ← מוסיפים s'),
      q('They ___ in the park.', ['run', 'runs'], 'run', 'They ← בלי s'),
      q('My cat ___ a lot.', ['sleeps', 'sleep'], 'sleeps', 'My cat = it ← מוסיפים s'),
      q('We ___ English.', ['speak', 'speaks'], 'speak', 'We ← בלי s'),
      q('Dad ___ dinner.', ['cooks', 'cook'], 'cooks', 'Dad = הוא ← מוסיפים s'),
      q('You ___ very well.', ['sing', 'sings'], 'sing', 'You ← בלי s'),
      q('The bird ___ in the tree.', ['sings', 'sing'], 'sings', 'The bird = it ← מוסיפים s'),
      q('Noa ___ her teeth.', ['brushes', 'brushs', 'brush'], 'brushes', 'Noa = היא, ואחרי sh ← es'),
      q('He ___ TV after school.', ['watches', 'watchs', 'watch'], 'watches', 'He, ואחרי ch ← es'),
      q('My friends ___ books.', ['read', 'reads'], 'read', 'My friends = הם ← בלי s'),
    ],
  },
];

export const GRAMMAR_ROUND = 8;
