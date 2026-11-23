/**
 * Short graded stories for reading comprehension (unseen prep), grades 3-4.
 * Present simple, everyday vocabulary. `glossary` maps lower-case words in the text to Hebrew.
 */
export type StoryQuestion = { q: string; qHe: string; options: string[]; answer: string };
export type Story = {
  id: string;
  grade: number;
  title: string;
  titleHe: string;
  emoji: string;
  sentences: string[];
  glossary: Record<string, string>;
  questions: StoryQuestion[];
};

const TF = ['True', 'False'];

export const STORIES: Story[] = [
  {
    id: 'g3-cat',
    grade: 3,
    title: 'My Cat Tom',
    titleHe: 'החתול שלי טום',
    emoji: '🐱',
    sentences: ['I have a cat.', 'His name is Tom.', 'Tom is big and orange.', 'He likes milk and fish.', 'Tom sleeps on my bed.', 'I love my cat!'],
    glossary: {
      have: 'יש לי', cat: 'חתול', his: 'שלו', name: 'שם', big: 'גדול', orange: 'כתום', likes: 'אוהב',
      milk: 'חלב', fish: 'דג', sleeps: 'ישן', on: 'על', bed: 'מיטה', love: 'אוהב/ת', my: 'שלי',
    },
    questions: [
      { q: 'What color is Tom?', qHe: 'מה הצבע של טום?', options: ['orange', 'black', 'white'], answer: 'orange' },
      { q: 'What does Tom like?', qHe: 'מה טום אוהב?', options: ['milk and fish', 'pizza and cake', 'apples'], answer: 'milk and fish' },
      { q: 'Where does Tom sleep?', qHe: 'איפה טום ישן?', options: ['on my bed', 'in the park', 'in a box'], answer: 'on my bed' },
      { q: 'Tom is small.', qHe: 'טום קטן. נכון או לא נכון?', options: TF, answer: 'False' },
    ],
  },
  {
    id: 'g3-park',
    grade: 3,
    title: 'At the Park',
    titleHe: 'בפארק',
    emoji: '🏞️',
    sentences: [
      'It is a sunny day.',
      'Dana and her brother go to the park.',
      'Dana plays with a ball.',
      'Her brother runs and jumps.',
      'They see a big dog.',
      'The dog is happy.',
      'They have fun!',
    ],
    glossary: {
      sunny: 'שמשי', day: 'יום', her: 'שלה', brother: 'אח', go: 'הולכים', park: 'פארק', plays: 'משחקת',
      with: 'עם', ball: 'כדור', runs: 'רץ', jumps: 'קופץ', they: 'הם', see: 'רואים', big: 'גדול', dog: 'כלב',
      happy: 'שמח', have: 'יש להם', fun: 'כיף',
    },
    questions: [
      { q: 'It is a sunny day.', qHe: 'זה יום שמשי. נכון או לא נכון?', options: TF, answer: 'True' },
      { q: 'Who goes to the park?', qHe: 'מי הולך לפארק?', options: ['Dana and her brother', 'Dana and her mom', 'a dog'], answer: 'Dana and her brother' },
      { q: 'What does Dana play with?', qHe: 'עם מה דנה משחקת?', options: ['a ball', 'a kite', 'a doll'], answer: 'a ball' },
      { q: 'What do they see?', qHe: 'מה הם רואים?', options: ['a big dog', 'a small cat', 'a bird'], answer: 'a big dog' },
    ],
  },
  {
    id: 'g3-birthday',
    grade: 3,
    title: 'My Birthday',
    titleHe: 'יום ההולדת שלי',
    emoji: '🎂',
    sentences: [
      'Today is my birthday.',
      'I am nine years old.',
      'My mom makes a big cake.',
      'My friends come to my house.',
      'We sing and dance.',
      'I get a new bike.',
      'It is a great day!',
    ],
    glossary: {
      today: 'היום', birthday: 'יום הולדת', nine: 'תשע', years: 'שנים', old: 'בגיל (old = זקן/ישן)', mom: 'אמא',
      makes: 'מכינה', cake: 'עוגה', friends: 'חברים', come: 'באים', house: 'בית', we: 'אנחנו', sing: 'שרים',
      dance: 'רוקדים', get: 'מקבל/ת', new: 'חדש', bike: 'אופניים', great: 'נהדר',
    },
    questions: [
      { q: 'How old is the child?', qHe: 'בן/בת כמה הילד/ה?', options: ['nine', 'ten', 'eight'], answer: 'nine' },
      { q: 'Who makes the cake?', qHe: 'מי מכינה את העוגה?', options: ['mom', 'dad', 'the friends'], answer: 'mom' },
      { q: 'What is the present?', qHe: 'מה המתנה?', options: ['a new bike', 'a ball', 'a book'], answer: 'a new bike' },
      { q: 'The friends come to the park.', qHe: 'החברים באים לפארק. נכון או לא נכון?', options: TF, answer: 'False' },
    ],
  },
  {
    id: 'g4-rain',
    grade: 4,
    title: 'A Rainy Day',
    titleHe: 'יום גשום',
    emoji: '🌧️',
    sentences: [
      'It is Monday.',
      'It is cold and rainy.',
      "Noa can't play outside, and she is sad.",
      'Then her grandma comes to visit.',
      'They make hot chocolate in the kitchen.',
      'They read a funny story together.',
      'Noa laughs a lot.',
      'Now it is a good day!',
    ],
    glossary: {
      monday: 'יום שני', cold: 'קר', rainy: 'גשום', "can't": 'לא יכולה', play: 'לשחק', outside: 'בחוץ', sad: 'עצובה',
      then: 'אז / אחר כך', grandma: 'סבתא', comes: 'באה', visit: 'לבקר', make: 'מכינות', hot: 'חם', chocolate: 'שוקולד',
      kitchen: 'מטבח', read: 'קוראות', funny: 'מצחיק', story: 'סיפור', together: 'ביחד', laughs: 'צוחקת', lot: 'הרבה',
      now: 'עכשיו', good: 'טוב',
    },
    questions: [
      { q: 'What is the weather like?', qHe: 'איך מזג האוויר?', options: ['cold and rainy', 'hot and sunny', 'windy'], answer: 'cold and rainy' },
      { q: 'Why is Noa sad?', qHe: 'למה נועה עצובה?', options: ["she can't play outside", 'she is hungry', 'her dog is lost'], answer: "she can't play outside" },
      { q: 'Who comes to visit?', qHe: 'מי באה לבקר?', options: ['grandma', 'a friend', 'her teacher'], answer: 'grandma' },
      { q: 'Where do they make hot chocolate?', qHe: 'איפה הן מכינות שוקו?', options: ['in the kitchen', 'in the garden', 'at school'], answer: 'in the kitchen' },
      { q: 'At the end, Noa is sad.', qHe: 'בסוף, נועה עצובה. נכון או לא נכון?', options: TF, answer: 'False' },
    ],
  },
  {
    id: 'g4-library',
    grade: 4,
    title: 'The School Library',
    titleHe: 'הספרייה של בית הספר',
    emoji: '📚',
    sentences: [
      'Our school has a big library.',
      'There are many books on the shelves.',
      'Every Tuesday my class goes to the library.',
      'I like books about animals.',
      'My friend Ben likes books about space.',
      'The librarian helps us find good books.',
      'We must be quiet in the library.',
    ],
    glossary: {
      our: 'שלנו', school: 'בית ספר', has: 'יש ל...', library: 'ספרייה', many: 'הרבה', books: 'ספרים', shelves: 'מדפים',
      every: 'כל', tuesday: 'יום שלישי', class: 'כיתה', goes: 'הולכת', like: 'אוהב/ת', about: 'על (נושא)',
      animals: 'בעלי חיים', friend: 'חבר', space: 'חלל', librarian: 'ספרן/ית', helps: 'עוזר/ת', find: 'למצוא',
      good: 'טובים', must: 'חייבים', quiet: 'שקטים',
    },
    questions: [
      { q: 'When does the class go to the library?', qHe: 'מתי הכיתה הולכת לספרייה?', options: ['every Tuesday', 'every Sunday', 'every day'], answer: 'every Tuesday' },
      { q: 'What books does Ben like?', qHe: 'איזה ספרים בן אוהב?', options: ['books about space', 'books about animals', 'books about food'], answer: 'books about space' },
      { q: 'Who helps them find books?', qHe: 'מי עוזר להם למצוא ספרים?', options: ['the librarian', 'the teacher', 'mom'], answer: 'the librarian' },
      { q: 'You can be loud in the library.', qHe: 'מותר להרעיש בספרייה. נכון או לא נכון?', options: TF, answer: 'False' },
    ],
  },
  {
    id: 'g4-zoo',
    grade: 4,
    title: 'A Trip to the Zoo',
    titleHe: 'טיול לגן החיות',
    emoji: '🦁',
    sentences: [
      'Today our class goes to the zoo.',
      'We go by bus.',
      'First we see the lions.',
      'They are big and they sleep in the sun.',
      'Then we see the monkeys.',
      'The monkeys climb and jump, and they are very funny.',
      'At lunch time we eat sandwiches near the elephants.',
      'I want to go to the zoo again!',
    ],
    glossary: {
      today: 'היום', our: 'שלנו', class: 'כיתה', zoo: 'גן חיות', bus: 'אוטובוס', by: 'ב... (באמצעות)', first: 'קודם',
      lions: 'אריות', sleep: 'ישנים', sun: 'שמש', then: 'אחר כך', monkeys: 'קופים', climb: 'מטפסים', jump: 'קופצים',
      very: 'מאוד', funny: 'מצחיקים', lunch: 'ארוחת צהריים', time: 'זמן', eat: 'אוכלים', sandwiches: 'כריכים',
      near: 'ליד', elephants: 'פילים', want: 'רוצה', again: 'שוב',
    },
    questions: [
      { q: 'How does the class go to the zoo?', qHe: 'איך הכיתה מגיעה לגן החיות?', options: ['by bus', 'by car', 'by train'], answer: 'by bus' },
      { q: 'What do the lions do?', qHe: 'מה האריות עושים?', options: ['they sleep in the sun', 'they climb trees', 'they eat sandwiches'], answer: 'they sleep in the sun' },
      { q: 'Which animals are funny?', qHe: 'אילו חיות מצחיקות?', options: ['the monkeys', 'the lions', 'the elephants'], answer: 'the monkeys' },
      { q: 'Where do they eat lunch?', qHe: 'איפה הם אוכלים צהריים?', options: ['near the elephants', 'on the bus', 'near the lions'], answer: 'near the elephants' },
    ],
  },
];

/** Splits a sentence into words and the punctuation/spaces between them (for tappable words). */
export function tokenize(sentence: string): { text: string; word: string | null }[] {
  return (sentence.match(/[A-Za-z']+|[^A-Za-z']+/g) ?? []).map((t) => ({ text: t, word: /^[A-Za-z']+$/.test(t) ? t.toLowerCase() : null }));
}

/** Fallback meanings for common words (and names) used across the stories. */
export const COMMON_GLOSS: Record<string, string> = {
  i: 'אני', a: 'אחד/אחת (a)', an: 'אחד/אחת (an)', the: 'ה... (הידיעה)', is: 'הוא / היא / זה (is)', am: 'אני (am)',
  are: 'הם / אתם (are)', and: 'ו... (וגם)', to: 'אל / ל...', in: 'ב... / בתוך', on: 'על', at: 'ב... (at)',
  it: 'זה / זאת', he: 'הוא', she: 'היא', we: 'אנחנו', they: 'הם / הן', my: 'שלי', her: 'שלה', his: 'שלו',
  us: 'אותנו', our: 'שלנו', there: 'שם (there are = יש)', be: 'להיות', big: 'גדול', day: 'יום',
  go: 'הולכים / נוסעים', goes: 'הולך / הולכת', see: 'רואים', likes: 'אוהב / אוהבת',
  tom: 'טום (שם)', dana: 'דנה (שם)', noa: 'נועה (שם)', ben: 'בן (שם)',
};

export function glossFor(story: Story, word: string): string | null {
  return story.glossary[word] ?? COMMON_GLOSS[word] ?? null;
}
