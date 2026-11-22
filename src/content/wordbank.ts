/**
 * Built-in starter vocabulary by grade (Israeli elementary English, grades 3-4).
 * Everyday, age-appropriate words grouped by topic — not an official Ministry list.
 * Parents add the class/book words on top of this from the parent dashboard.
 */
export type BankWord = { word: string; hebrew: string; emoji: string };
export type BankTopic = { id: string; title: string; icon: string; words: BankWord[] };

const w = (word: string, hebrew: string, emoji = ''): BankWord => ({ word, hebrew, emoji });

export const WORD_BANK: Record<number, BankTopic[]> = {
  3: [
    {
      id: 'g3-colors', title: 'צבעים', icon: '🎨',
      words: [
        w('red', 'אדום', '🔴'), w('blue', 'כחול', '🔵'), w('green', 'ירוק', '🟢'), w('yellow', 'צהוב', '🟡'),
        w('black', 'שחור', '⚫'), w('white', 'לבן', '⚪'), w('pink', 'ורוד', '🩷'), w('orange', 'כתום', '🟠'),
        w('purple', 'סגול', '🟣'), w('brown', 'חום', '🟤'),
      ],
    },
    {
      id: 'g3-numbers', title: 'מספרים', icon: '🔢',
      words: [
        w('one', 'אחת', '1️⃣'), w('two', 'שתיים', '2️⃣'), w('three', 'שלוש', '3️⃣'), w('four', 'ארבע', '4️⃣'),
        w('five', 'חמש', '5️⃣'), w('six', 'שש', '6️⃣'), w('seven', 'שבע', '7️⃣'), w('eight', 'שמונה', '8️⃣'),
        w('nine', 'תשע', '9️⃣'), w('ten', 'עשר', '🔟'),
      ],
    },
    {
      id: 'g3-family', title: 'משפחה', icon: '👨‍👩‍👧',
      words: [
        w('mom', 'אמא', '👩'), w('dad', 'אבא', '👨'), w('sister', 'אחות', '👧'), w('brother', 'אח', '👦'),
        w('baby', 'תינוק / תינוקת', '👶'), w('family', 'משפחה', '👨‍👩‍👧'), w('grandma', 'סבתא', '👵'), w('grandpa', 'סבא', '👴'),
      ],
    },
    {
      id: 'g3-body', title: 'גוף', icon: '🙂',
      words: [
        w('head', 'ראש', '🙂'), w('eye', 'עין', '👁️'), w('ear', 'אוזן', '👂'), w('nose', 'אף', '👃'),
        w('mouth', 'פה', '👄'), w('hand', 'יד', '✋'), w('leg', 'רגל', '🦵'), w('foot', 'כף רגל', '🦶'),
        w('hair', 'שיער', '💇'),
      ],
    },
    {
      id: 'g3-animals', title: 'בעלי חיים', icon: '🐾',
      words: [
        w('cat', 'חתול', '🐱'), w('dog', 'כלב', '🐶'), w('fish', 'דג', '🐟'), w('bird', 'ציפור', '🐦'),
        w('horse', 'סוס', '🐴'), w('cow', 'פרה', '🐮'), w('duck', 'ברווז', '🦆'), w('frog', 'צפרדע', '🐸'),
        w('lion', 'אריה', '🦁'), w('monkey', 'קוף', '🐵'),
      ],
    },
    {
      id: 'g3-school', title: 'בית ספר', icon: '🏫',
      words: [
        w('book', 'ספר', '📖'), w('pen', 'עט', '🖊️'), w('pencil', 'עיפרון', '✏️'), w('bag', 'תיק', '🎒'),
        w('ruler', 'סרגל', '📏'), w('teacher', 'מורה', '🧑‍🏫'), w('class', 'כיתה', '🏫'), w('chair', 'כיסא', '🪑'),
        w('board', 'לוח', '📋'), w('school', 'בית ספר', '🏫'),
      ],
    },
    {
      id: 'g3-food', title: 'אוכל', icon: '🍎',
      words: [
        w('apple', 'תפוח', '🍎'), w('banana', 'בננה', '🍌'), w('milk', 'חלב', '🥛'), w('bread', 'לחם', '🍞'),
        w('egg', 'ביצה', '🥚'), w('cake', 'עוגה', '🎂'), w('pizza', 'פיצה', '🍕'), w('water', 'מים', '💧'),
        w('juice', 'מיץ', '🧃'), w('candy', 'ממתק', '🍬'),
      ],
    },
    {
      id: 'g3-toys', title: 'צעצועים ודברים', icon: '🧸',
      words: [
        w('ball', 'כדור', '⚽'), w('doll', 'בובה', '🪆'), w('kite', 'עפיפון', '🪁'), w('bike', 'אופניים', '🚲'),
        w('car', 'מכונית', '🚗'), w('hat', 'כובע', '🧢'), w('box', 'קופסה', '📦'), w('toy', 'צעצוע', '🧸'),
      ],
    },
    {
      id: 'g3-actions', title: 'פעולות', icon: '🏃',
      words: [
        w('run', 'לרוץ', '🏃'), w('jump', 'לקפוץ', '🦘'), w('sit', 'לשבת', '🪑'), w('swim', 'לשחות', '🏊'),
        w('eat', 'לאכול', '🍽️'), w('drink', 'לשתות', '🥤'), w('play', 'לשחק', '🎮'), w('sing', 'לשיר', '🎤'),
        w('read', 'לקרוא', '📖'), w('write', 'לכתוב', '✍️'),
      ],
    },
    {
      id: 'g3-describe', title: 'תיאורים', icon: '✨',
      words: [
        w('big', 'גדול', '🐘'), w('small', 'קטן', '🐭'), w('happy', 'שמח / שמחה', '😊'), w('sad', 'עצוב / עצובה', '😢'),
        w('hot', 'חם', '🔥'), w('cold', 'קר', '🥶'), w('good', 'טוב', '👍'), w('new', 'חדש', '✨'),
      ],
    },
    {
      id: 'g3-hello', title: 'מילות נימוס', icon: '👋',
      words: [
        w('hello', 'שלום', '👋'), w('goodbye', 'להתראות', '👋'), w('please', 'בבקשה', '🙏'), w('thanks', 'תודה', '🙏'),
        w('yes', 'כן', '✅'), w('no', 'לא', '❌'),
      ],
    },
  ],
  4: [
    {
      id: 'g4-days', title: 'ימי השבוע', icon: '📅',
      words: [
        w('Sunday', 'יום ראשון', '📅'), w('Monday', 'יום שני', '📅'), w('Tuesday', 'יום שלישי', '📅'),
        w('Wednesday', 'יום רביעי', '📅'), w('Thursday', 'יום חמישי', '📅'), w('Friday', 'יום שישי', '📅'),
        w('Saturday', 'שבת', '📅'),
      ],
    },
    {
      id: 'g4-weather', title: 'מזג אוויר', icon: '🌦️',
      words: [
        w('sun', 'שמש', '☀️'), w('rain', 'גשם', '🌧️'), w('wind', 'רוח', '🌬️'), w('cloud', 'ענן', '☁️'),
        w('snow', 'שלג', '❄️'), w('sunny', 'שמשי', '🌞'), w('rainy', 'גשום', '☔'), w('weather', 'מזג אוויר', '🌦️'),
      ],
    },
    {
      id: 'g4-home', title: 'בבית', icon: '🏠',
      words: [
        w('house', 'בית', '🏠'), w('room', 'חדר', '🚪'), w('kitchen', 'מטבח', '🍳'), w('bed', 'מיטה', '🛏️'),
        w('door', 'דלת', '🚪'), w('window', 'חלון', '🪟'), w('table', 'שולחן', '🍽️'), w('garden', 'גינה', '🌷'),
      ],
    },
    {
      id: 'g4-clothes', title: 'בגדים', icon: '👕',
      words: [
        w('shirt', 'חולצה', '👕'), w('dress', 'שמלה', '👗'), w('shoes', 'נעליים', '👟'), w('socks', 'גרביים', '🧦'),
        w('coat', 'מעיל', '🧥'), w('skirt', 'חצאית', '👗'), w('pants', 'מכנסיים', '👖'),
      ],
    },
    {
      id: 'g4-places', title: 'מקומות', icon: '🗺️',
      words: [
        w('park', 'פארק', '🏞️'), w('shop', 'חנות', '🏪'), w('beach', 'חוף ים', '🏖️'), w('zoo', 'גן חיות', '🦁'),
        w('city', 'עיר', '🏙️'), w('street', 'רחוב', '🛣️'), w('library', 'ספרייה', '📚'), w('hospital', 'בית חולים', '🏥'),
      ],
    },
    {
      id: 'g4-jobs', title: 'מקצועות', icon: '🧑‍⚕️',
      words: [
        w('doctor', 'רופא / רופאה', '🧑‍⚕️'), w('farmer', 'חקלאי / חקלאית', '🧑‍🌾'), w('cook', 'טבח / טבחית', '🧑‍🍳'),
        w('pilot', 'טייס / טייסת', '🧑‍✈️'), w('driver', 'נהג / נהגת', '🚕'), w('singer', 'זמר / זמרת', '🎤'),
      ],
    },
    {
      id: 'g4-hobbies', title: 'תחביבים וספורט', icon: '⚽',
      words: [
        w('football', 'כדורגל', '⚽'), w('tennis', 'טניס', '🎾'), w('dance', 'לרקוד', '💃'), w('draw', 'לצייר', '🎨'),
        w('music', 'מוזיקה', '🎵'), w('game', 'משחק', '🎲'), w('picture', 'תמונה', '🖼️'), w('story', 'סיפור', '📕'),
      ],
    },
    {
      id: 'g4-time', title: 'זמן', icon: '⏰',
      words: [
        w('morning', 'בוקר', '🌅'), w('night', 'לילה', '🌙'), w('today', 'היום', '📅'), w('tomorrow', 'מחר', '➡️'),
        w('yesterday', 'אתמול', '⬅️'), w('week', 'שבוע', '🗓️'), w('year', 'שנה', '🎆'), w('birthday', 'יום הולדת', '🎂'),
      ],
    },
    {
      id: 'g4-verbs', title: 'פעלים', icon: '🏃',
      words: [
        w('go', 'ללכת / לנסוע', '🚶'), w('come', 'לבוא', '👋'), w('like', 'לאהוב / לחבב', '👍'), w('love', 'לאהוב', '❤️'),
        w('want', 'לרצות', '🙋'), w('see', 'לראות', '👀'), w('look', 'להסתכל', '👀'), w('help', 'לעזור', '🤝'),
        w('open', 'לפתוח', '📂'), w('close', 'לסגור', '🚪'), w('climb', 'לטפס', '🧗'), w('sleep', 'לישון', '😴'),
        w('wash', 'לרחוץ / לשטוף', '🧼'), w('listen', 'להקשיב', '👂'), w('speak', 'לדבר', '🗣️'), w('buy', 'לקנות', '🛒'),
      ],
    },
    {
      id: 'g4-describe', title: 'תיאורים', icon: '✨',
      words: [
        w('tall', 'גבוה', '🦒'), w('short', 'נמוך / קצר', '📏'), w('long', 'ארוך', '📏'), w('fast', 'מהיר', '🏎️'),
        w('slow', 'איטי', '🐢'), w('old', 'ישן / זקן', '👴'), w('young', 'צעיר', '🧒'), w('clean', 'נקי', '✨'),
        w('dirty', 'מלוכלך', '🟫'), w('hungry', 'רעב / רעבה', '🍽️'), w('thirsty', 'צמא / צמאה', '🥤'),
        w('tired', 'עייף / עייפה', '😴'), w('beautiful', 'יפה', '🌸'), w('funny', 'מצחיק', '😂'),
      ],
    },
    {
      id: 'g4-sight', title: 'מילים שכדאי לזכור בעל פה', icon: '⭐',
      words: [
        w('the', 'ה׳ הידיעה (ה...)', '👉'), w('said', 'אמר / אמרה', '💬'), w('was', 'היה / הייתה', '⏪'),
        w('were', 'היו', '⏪'), w('they', 'הם / הן', '👥'), w('there', 'שם', '📍'), w('their', 'שלהם / שלהן', '👥'),
        w('where', 'איפה', '❓'), w('what', 'מה', '❓'), w('who', 'מי', '❓'), w('when', 'מתי', '⏰'),
        w('why', 'למה', '❓'), w('because', 'כי / בגלל ש...', '💡'), w('friend', 'חבר / חברה', '🤝'),
        w('people', 'אנשים', '👥'), w('very', 'מאוד', '💯'), w('many', 'הרבה', '🔢'), w('some', 'כמה / קצת', '🤏'),
        w('your', 'שלך', '👉'), w('our', 'שלנו', '🫂'),
      ],
    },
  ],
};

export const BANK_GRADES = Object.keys(WORD_BANK).map(Number).sort();

export function gradeLabel(grade: number): string {
  const letters = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳', 'י״א', 'י״ב'];
  return letters[grade] ?? String(grade);
}
