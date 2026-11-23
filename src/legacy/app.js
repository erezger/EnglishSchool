/* eslint-disable */
// Client-side app logic ported from the original single-file version.
// Loaded once by <LegacyApp /> after the static markup is mounted.

/* ==========================================================================
   1. CURRICULUM DATA: 26 LETTERS (ABC NAME + PHONICS) + 6 DIGRAPHS + GENIUS BONUS
   ========================================================================== */
const LETTER_BANK = {
    a: { upper: 'A', lower: 'a', hebrewName: 'אֵיי', ttsLetterName: 'Ay', hebrewSound: 'אַה (כמו אֲבא)', trick: 'האות a נראית כמו תפוח קטן (Apple) עם עלה למעלה 🍎', phoneme: 'ah', exampleWord: 'apple', exampleEmoji: '🍎', exampleHebrew: 'תפוח', bonus: { title: 'צליל ארוך (אֵיי) – קסם ה-e!', desc: 'כשיש e בסוף המילה, האות a אומרת את השם שלה: אֵיי! כמו במילה cake (עוגה).', word: 'cake', emoji: '🎂', hebrew: 'עוגה' } },
    b: { upper: 'B', lower: 'b', hebrewName: 'בִּי', ttsLetterName: 'Bee', hebrewSound: 'בּ (כמו בּלון)', trick: 'זוכרת את המיטה (bed)? ל-b יש מקל בצד שמאל ובטן קדימה 🛏️', phoneme: 'buh', exampleWord: 'bat', exampleEmoji: '🦇', exampleHebrew: 'עטלף' },
    s: { upper: 'S', lower: 's', hebrewName: 'אֶס', ttsLetterName: 'Ess', hebrewSound: 'ססס (כמו נחש)', trick: 'האות S מתפתלת בדיוק כמו נחש (Snake) שעושה ססס! 🐍', phoneme: 'sss', exampleWord: 'sun', exampleEmoji: '☀️', exampleHebrew: 'שמש', bonus: { title: 'לפעמים נשמעת כמו ז (z)', desc: 'בסוף מילים רבות או בין תנועות, s יכולה להישמע כמו ז, למשל במילה rose (ורד).', word: 'rose', emoji: '🌹', hebrew: 'ורד' } },
    t: { upper: 'T', lower: 't', hebrewName: 'טִי', ttsLetterName: 'Tee', hebrewSound: 'ט (כמו טלפון)', trick: 'האות t נראית כמו ברז (Tap) שמוציא מים: ט-ט-ט 🚰', phoneme: 'tuh', exampleWord: 'tap', exampleEmoji: '🚰', exampleHebrew: 'ברז' },
    p: { upper: 'P', lower: 'p', hebrewName: 'פִּי', ttsLetterName: 'Pee', hebrewSound: 'פּ (כמו פּיצה)', trick: 'הראש של p מסתכל קדימה לכיוון הפיצה (Pizza) 🍕', phoneme: 'puh', exampleWord: 'pat', exampleEmoji: '✋', exampleHebrew: 'ליטוף' },

    i: { upper: 'I', lower: 'i', hebrewName: 'אַיי', ttsLetterName: 'Eye', hebrewSound: 'אִי קצר (כמו אִיגלו)', trick: 'האות i היא ילד קטן עם כדור קטן מעל הראש 🧊', phoneme: 'ih', exampleWord: 'igloo', exampleEmoji: '🧊', exampleHebrew: 'איגלו', bonus: { title: 'צליל ארוך (אַיי) – קסם ה-e!', desc: 'כשיש e בסוף המילה, האות i אומרת אַיי! כמו במילה bike (אופניים).', word: 'bike', emoji: '🚲', hebrew: 'אופניים' } },
    n: { upper: 'N', lower: 'n', hebrewName: 'אֶן', ttsLetterName: 'En', hebrewSound: 'נננ (כמו נמר)', trick: 'האות n נראית כמו גשר קטן או רשת (Net) עם קשת אחת 🌉', phoneme: 'nnn', exampleWord: 'net', exampleEmoji: '🥅', exampleHebrew: 'רשת' },
    m: { upper: 'M', lower: 'm', hebrewName: 'אֶם', ttsLetterName: 'Em', hebrewSound: 'מממ (כמו ממתק)', trick: 'ל-m יש שתי קשתות כמו שני הרים (Mountains) – מממ טעים! ⛰️', phoneme: 'mmm', exampleWord: 'map', exampleEmoji: '🗺️', exampleHebrew: 'מפה' },
    d: { upper: 'D', lower: 'd', hebrewName: 'דִי', ttsLetterName: 'Dee', hebrewSound: 'ד (כמו דג)', trick: 'בטריק המיטה (bed), האות d נמצאת בצד ימין עם מקל בסוף 🐶', phoneme: 'duh', exampleWord: 'dog', exampleEmoji: '🐶', exampleHebrew: 'כלב' },
    g: { upper: 'G', lower: 'g', hebrewName: 'גִ\'י', ttsLetterName: 'Jee', hebrewSound: 'ג (כמו גלידה)', trick: 'ל-g יש זנב מעוגל למטה כמו ידית של ספל או זנב של חתול 🎁', phoneme: 'guh', exampleWord: 'gift', exampleEmoji: '🎁', exampleHebrew: 'מתנה', bonus: { title: 'צליל רך (ג\') לפני e / i / y', desc: 'לפני האותיות e, i, y האות g לפעמים נשמעת כמו ג\', למשל giraffe (ג\'ירפה).', word: 'giraffe', emoji: '🦒', hebrew: 'ג\'ירפה' } },

    o: { upper: 'O', lower: 'o', hebrewName: 'אוֹאוּ', ttsLetterName: 'Oh', hebrewSound: 'אוֹ קצר (כמו אוֹר)', trick: 'הפה נהיה עגול בדיוק כמו האות O כשאומרים אוֹ! 😮', phoneme: 'aw', exampleWord: 'octopus', exampleEmoji: '🐙', exampleHebrew: 'תמנון', bonus: { title: 'צליל ארוך (אוֹאוּ) – קסם ה-e!', desc: 'כשיש e בסוף המילה, האות o אומרת את השם שלה: אוֹאוּ! כמו במילה home (בית).', word: 'home', emoji: '🏠', hebrew: 'בית' } },
    c: { upper: 'C', lower: 'c', hebrewName: 'סִי', ttsLetterName: 'See', hebrewSound: 'ק (כמו קפה)', trick: 'האות c נראית כמו עוגייה (Cookie) שמישהו נתן בה ביס 🍪', phoneme: 'kuh', exampleWord: 'cat', exampleEmoji: '🐱', exampleHebrew: 'חתול', bonus: { title: 'צליל ס\' לפני e / i / y', desc: 'כשאחרי c מגיעות האותיות e, i או y, היא נשמעת כמו ס\'! למשל city (עיר).', word: 'city', emoji: '🏙️', hebrew: 'עיר' } },
    k: { upper: 'K', lower: 'k', hebrewName: 'קֵיי', ttsLetterName: 'Kay', hebrewSound: 'ק (כמו קנגורו)', trick: 'האות k מרימה רגל בבעיטה (Kick) – צליל ק חזק! 🦘', phoneme: 'kuh', exampleWord: 'kid', exampleEmoji: '🧒', exampleHebrew: 'ילד' },
    e: { upper: 'E', lower: 'e', hebrewName: 'אִי', ttsLetterName: 'Ee', hebrewSound: 'אֶה (כמו אֶגוז)', trick: 'האות e נראית כמו ביצה (Egg) שנשברה קצת באמצע 🥚', phoneme: 'eh', exampleWord: 'egg', exampleEmoji: '🥚', exampleHebrew: 'ביצה', bonus: { title: 'צליל ארוך (אִי) כמו במילה me', desc: 'במילים קצרות שמסתיימות ב-e או כשיש ee, שומעים אִי ארוך! למשל me (אותי/אני).', word: 'me', emoji: '🙋‍♀️', hebrew: 'אני / אותי' } },
    r: { upper: 'R', lower: 'r', hebrewName: 'אָאר', ttsLetterName: 'Are', hebrewSound: 'ררר (רכה, כמו רדיו)', trick: 'האות r היא כמו כלבלב קטן שנוהם בעדינות ררר (Run!) 🏃', phoneme: 'rrr', exampleWord: 'red', exampleEmoji: '🔴', exampleHebrew: 'אדום' },

    h: { upper: 'H', lower: 'h', hebrewName: 'אֵייץ\'', ttsLetterName: 'Aitch', hebrewSound: 'ה (נשיפה רכה, כמו הר)', trick: 'האות h נראית כמו כיסא שיושבים עליו אחרי ריצה ונושפים ההה 🪑', phoneme: 'huh', exampleWord: 'hat', exampleEmoji: '🎩', exampleHebrew: 'כובע' },
    l: { upper: 'L', lower: 'l', hebrewName: 'אֶל', ttsLetterName: 'Ell', hebrewSound: 'ללל (כמו לימון)', trick: 'האות l היא מקל ארוך וישר כמו סוכרייה על מקל (Lollipop) 🍭', phoneme: 'lll', exampleWord: 'leg', exampleEmoji: '🦵', exampleHebrew: 'רגל' },
    f: { upper: 'F', lower: 'f', hebrewName: 'אֶף', ttsLetterName: 'Eff', hebrewSound: 'פפפ רפה (כמו פרח)', trick: 'האות f נראית כמו פרח גבוה (Flower) שמתכופף ברוח 🌸', phoneme: 'fff', exampleWord: 'fan', exampleEmoji: '🪭', exampleHebrew: 'מאוורר' },
    u: { upper: 'U', lower: 'u', hebrewName: 'יוּ', ttsLetterName: 'You', hebrewSound: 'אַה קצר (כמו אַף)', trick: 'האות u נראית כמו כוס (Cup) או ידית של מטרייה (Umbrella) ☂️', phoneme: 'uh', exampleWord: 'sun', exampleEmoji: '☀️', exampleHebrew: 'שמש', bonus: { title: 'צליל ארוך (יוּ) – קסם ה-e!', desc: 'כשיש e בסוף המילה, האות u אומרת את השם שלה: יוּ! כמו במילה cute (חמוד).', word: 'cute', emoji: '🥰', hebrew: 'חמוד' } },
    w: { upper: 'W', lower: 'w', hebrewName: 'דַאבֶּל-יוּ', ttsLetterName: 'Double you', hebrewSound: 'ווּ (כמו וואו!)', trick: 'האות w היא כמו שני גלים בים (Water) – אומרים ווּ עם שפתיים עגולות 🌊', phoneme: 'wuh', exampleWord: 'win', exampleEmoji: '🏆', exampleHebrew: 'לנצח' },

    j: { upper: 'J', lower: 'j', hebrewName: 'ג\'ֵיי', ttsLetterName: 'Jay', hebrewSound: 'ג\' (כמו ג\'ינס)', trick: 'האות j קופצת (Jump) ויש לה נקודה מעל הראש 🍓', phoneme: 'juh', exampleWord: 'jam', exampleEmoji: '🍓', exampleHebrew: 'ריבה' },
    v: { upper: 'V', lower: 'v', hebrewName: 'וִי', ttsLetterName: 'Vee', hebrewSound: 'וְוְוְ (כמו ורד)', trick: 'האות v חדה כמו חרטום של ואן (Van) ומרגישים רטט בשפה 🚐', phoneme: 'vvv', exampleWord: 'van', exampleEmoji: '🚐', exampleHebrew: 'ואן' },
    y: { upper: 'Y', lower: 'y', hebrewName: 'וַואי', ttsLetterName: 'Why', hebrewSound: 'יְ (כמו יד)', trick: 'האות y מרימה ידיים למעלה ואומרת YES! ✅', phoneme: 'yuh', exampleWord: 'yes', exampleEmoji: '✅', exampleHebrew: 'כן', bonus: { title: 'בסוף מילה נשמעת אִי או אַיי', desc: 'בסוף מילה ארוכה y נשמעת אִי (happy – שמח), ובמילה קצרה אַיי (sky – שמיים).', word: 'happy', emoji: '😊', hebrew: 'שמח' } },
    z: { upper: 'Z', lower: 'z', hebrewName: 'זִי', ttsLetterName: 'Zee', hebrewSound: 'זזז (כמו זבוב)', trick: 'האות z נראית כמו זיגזג של רוכסן (Zip) ⚡', phoneme: 'zzz', exampleWord: 'zip', exampleEmoji: '🤐', exampleHebrew: 'רוכסן' },
    x: { upper: 'X', lower: 'x', hebrewName: 'אֶקס', ttsLetterName: 'Ex', hebrewSound: 'קס (כמו בוקס)', trick: 'האות x היא איקס של תיבת אוצר (Box) ונשמעת כמו ק+ס 📦', phoneme: 'ks', exampleWord: 'box', exampleEmoji: '📦', exampleHebrew: 'קופסה' },
    q: { upper: 'Q', lower: 'q', hebrewName: 'קְיוּ', ttsLetterName: 'Cue', hebrewSound: 'קוו (כמו Queen)', trick: 'המלכה q תמיד מסתכלת אחורה ואוהבת שהאות u הולכת איתה 👑', phoneme: 'kwuh', exampleWord: 'queen', exampleEmoji: '👑', exampleHebrew: 'מלכה' },

    // Level 6 Digraphs
    sh: { upper: 'SH', lower: 'sh', hebrewName: 'אֶס + אֵייץ\'', ttsLetterName: 'Ess Aitch', hebrewSound: 'ששש (שקט!)', trick: 'כש-s ו-h ביחד, הן שמות אצבע על הפה ואומרות ששש! 🤫', phoneme: 'shhh', exampleWord: 'ship', exampleEmoji: '🚢', exampleHebrew: 'אונייה' },
    ch: { upper: 'CH', lower: 'ch', hebrewName: 'סִי + אֵייץ\'', ttsLetterName: 'See Aitch', hebrewSound: 'צ\' (כמו צ\'יפס)', trick: 'הצירוף ch נשמע כמו אפצ\'י או כמו צ\'יפס פריך! 🍟', phoneme: 'chuh', exampleWord: 'chip', exampleEmoji: '🍟', exampleHebrew: 'צ\'יפס' },
    th: { upper: 'TH', lower: 'th', hebrewName: 'טִי + אֵייץ\'', ttsLetterName: 'Tee Aitch', hebrewSound: 'ת\' (לשון בין השיניים)', trick: 'מוציאים קצה קטן של הלשון בין השיניים ונושפים בעדינות 👅', phoneme: 'thhh', exampleWord: 'thin', exampleEmoji: '📏', exampleHebrew: 'דק' },
    ck: { upper: 'CK', lower: 'ck', hebrewName: 'סִי + קֵיי', ttsLetterName: 'See Kay', hebrewSound: 'ק חזקה (בסוף מילה)', trick: 'החברות c ו-k אוהבות לעמוד בסוף מילה ולעשות יחד צליל ק אחד חזק! 🦆', phoneme: 'kuh', exampleWord: 'duck', exampleEmoji: '🦆', exampleHebrew: 'ברווז' },
    ee: { upper: 'EE', lower: 'ee', hebrewName: 'דַאבֶּל אִי', ttsLetterName: 'Double Ee', hebrewSound: 'אִי ארוך (כמו עץ)', trick: 'שתי אותיות e תאומות שרות יחד אִיייי ארוך כמו דבורה (bee)! 🐝', phoneme: 'eee', exampleWord: 'tree', exampleEmoji: '🌳', exampleHebrew: 'עץ' },
    oo: { upper: 'OO', lower: 'oo', hebrewName: 'דַאבֶּל אוֹאוּ', ttsLetterName: 'Double Oh', hebrewSound: 'אוּ (כמו ירח)', trick: 'שני עיגולים כמו משקפת שמסתכלים בה על הירח (moon) ואומרים אוּוּ! 🌙', phoneme: 'ooo', exampleWord: 'moon', exampleEmoji: '🌙', exampleHebrew: 'ירח', bonus: { title: 'אוּ קצר (כמו בספר – book)', desc: 'לפעמים oo נשמעת קצרה ורכה יותר, כמו במילה book (ספר) או foot (כף רגל).', word: 'book', emoji: '📖', hebrew: 'ספר' } }
};

const ALPHABET_ORDER = 'abcdefghijklmnopqrstuvwxyz'.split('');

/* ==========================================================================
   2. 7 GRADED LEVELS (95+ WORDS + 12 REAL SENTENCES)
   ========================================================================== */
const LEVELS = [
    {
        id: 1, shortName: 'שלב 1', title: 'מתחילים לקרוא!',
        letters: ['a', 'b', 's', 't', 'p'],
        words: [
            { word: 'bat', parts: ['b', 'a', 't'], hebrew: 'עטלף', emoji: '🦇' },
            { word: 'sat', parts: ['s', 'a', 't'], hebrew: 'ישב', emoji: '🪑' },
            { word: 'pat', parts: ['p', 'a', 't'], hebrew: 'ליטוף', emoji: '✋' },
            { word: 'tap', parts: ['t', 'a', 'p'], hebrew: 'ברז', emoji: '🚰' },
            { word: 'tab', parts: ['t', 'a', 'b'], hebrew: 'לשונית', emoji: '🏷️' },
            { word: 'sap', parts: ['s', 'a', 'p'], hebrew: 'שרף עץ', emoji: '🌳' },
            { word: 'at', parts: ['a', 't'], hebrew: 'ב- / אצל', emoji: '📍' },
            { word: 'past', parts: ['p', 'a', 's', 't'], hebrew: 'עבר', emoji: '⏳' },
            { word: 'spat', parts: ['s', 'p', 'a', 't'], hebrew: 'ריב קטן', emoji: '💬' },
            { word: 'stab', parts: ['s', 't', 'a', 'b'], hebrew: 'לדקור (במזלג)', emoji: '🍴' }
        ]
    },
    {
        id: 2, shortName: 'שלב 2', title: 'המילים הראשונות',
        letters: ['i', 'n', 'm', 'd', 'g'],
        words: [
            { word: 'pin', parts: ['p', 'i', 'n'], hebrew: 'סיכה', emoji: '📌' },
            { word: 'sit', parts: ['s', 'i', 't'], hebrew: 'לשבת', emoji: '🪑' },
            { word: 'pan', parts: ['p', 'a', 'n'], hebrew: 'מחבת', emoji: '🍳' },
            { word: 'map', parts: ['m', 'a', 'p'], hebrew: 'מפה', emoji: '🗺️' },
            { word: 'mat', parts: ['m', 'a', 't'], hebrew: 'שטיחון', emoji: '🧶' },
            { word: 'man', parts: ['m', 'a', 'n'], hebrew: 'איש', emoji: '👨' },
            { word: 'dad', parts: ['d', 'a', 'd'], hebrew: 'אבא', emoji: '👨‍👧' },
            { word: 'sad', parts: ['s', 'a', 'd'], hebrew: 'עצוב', emoji: '😢' },
            { word: 'pig', parts: ['p', 'i', 'g'], hebrew: 'חזיר', emoji: '🐷' },
            { word: 'big', parts: ['b', 'i', 'g'], hebrew: 'גדול', emoji: '🐘' },
            { word: 'dig', parts: ['d', 'i', 'g'], hebrew: 'לחפור', emoji: '⛏️' },
            { word: 'bag', parts: ['b', 'a', 'g'], hebrew: 'תיק', emoji: '🎒' },
            { word: 'nap', parts: ['n', 'a', 'p'], hebrew: 'תנומה', emoji: '😴' },
            { word: 'tin', parts: ['t', 'i', 'n'], hebrew: 'קופסת פח', emoji: '🥫' }
        ]
    },
    {
        id: 3, shortName: 'שלב 3', title: 'תנועות וצלילים',
        letters: ['o', 'c', 'k', 'e', 'r'],
        words: [
            { word: 'cat', parts: ['c', 'a', 't'], hebrew: 'חתול', emoji: '🐱' },
            { word: 'dog', parts: ['d', 'o', 'g'], hebrew: 'כלב', emoji: '🐶' },
            { word: 'top', parts: ['t', 'o', 'p'], hebrew: 'פסגה / סביבון', emoji: '🔝' },
            { word: 'pot', parts: ['p', 'o', 't'], hebrew: 'סיר', emoji: '🍲' },
            { word: 'mop', parts: ['m', 'o', 'p'], hebrew: 'מגב', emoji: '🧹' },
            { word: 'bed', parts: ['b', 'e', 'd'], hebrew: 'מיטה', emoji: '🛏️' },
            { word: 'red', parts: ['r', 'e', 'd'], hebrew: 'אדום', emoji: '🔴' },
            { word: 'net', parts: ['n', 'e', 't'], hebrew: 'רשת', emoji: '🥅' },
            { word: 'ten', parts: ['t', 'e', 'n'], hebrew: 'עשר', emoji: '🔟' },
            { word: 'pen', parts: ['p', 'e', 'n'], hebrew: 'עט', emoji: '🖊️' },
            { word: 'rat', parts: ['r', 'a', 't'], hebrew: 'חולדה', emoji: '🐀' },
            { word: 'run', parts: ['r', 'u', 'n'], hebrew: 'לרוץ', emoji: '🏃' },
            { word: 'rock', parts: ['r', 'o', 'ck'], hebrew: 'סלע', emoji: '🪨' },
            { word: 'kid', parts: ['k', 'i', 'd'], hebrew: 'ילד / ילדה', emoji: '🧒' },
            { word: 'kick', parts: ['k', 'i', 'ck'], hebrew: 'לבעוט', emoji: '⚽' }
        ]
    },
    {
        id: 4, shortName: 'שלב 4', title: 'קריאה שוטפת',
        letters: ['h', 'l', 'f', 'u', 'w'],
        words: [
            { word: 'hat', parts: ['h', 'a', 't'], hebrew: 'כובע', emoji: '🎩' },
            { word: 'hen', parts: ['h', 'e', 'n'], hebrew: 'תרנגולת', emoji: '🐔' },
            { word: 'leg', parts: ['l', 'e', 'g'], hebrew: 'רגל', emoji: '🦵' },
            { word: 'lip', parts: ['l', 'i', 'p'], hebrew: 'שפה', emoji: '👄' },
            { word: 'log', parts: ['l', 'o', 'g'], hebrew: 'בול עץ', emoji: '🪵' },
            { word: 'fan', parts: ['f', 'a', 'n'], hebrew: 'מאוורר', emoji: '🪭' },
            { word: 'fun', parts: ['f', 'u', 'n'], hebrew: 'כיף', emoji: '🎉' },
            { word: 'sun', parts: ['s', 'u', 'n'], hebrew: 'שמש', emoji: '☀️' },
            { word: 'cup', parts: ['c', 'u', 'p'], hebrew: 'כוס', emoji: '☕' },
            { word: 'bus', parts: ['b', 'u', 's'], hebrew: 'אוטובוס', emoji: '🚌' },
            { word: 'bug', parts: ['b', 'u', 'g'], hebrew: 'חיפושית / חרק', emoji: '🐞' },
            { word: 'win', parts: ['w', 'i', 'n'], hebrew: 'לנצח', emoji: '🏆' },
            { word: 'web', parts: ['w', 'e', 'b'], hebrew: 'קורי עכביש', emoji: '🕸️' },
            { word: 'wet', parts: ['w', 'e', 't'], hebrew: 'רטוב', emoji: '💧' },
            { word: 'hug', parts: ['h', 'u', 'g'], hebrew: 'חיבוק', emoji: '🤗' },
            { word: 'fox', parts: ['f', 'o', 'x'], hebrew: 'שועל', emoji: '🦊' }
        ]
    },
    {
        id: 5, shortName: 'שלב 5', title: 'כל ה-26 אותיות!',
        letters: ['j', 'v', 'y', 'z', 'x', 'q'],
        words: [
            { word: 'jam', parts: ['j', 'a', 'm'], hebrew: 'ריבה', emoji: '🍓' },
            { word: 'jet', parts: ['j', 'e', 't'], hebrew: 'מטוס סילון', emoji: '✈️' },
            { word: 'van', parts: ['v', 'a', 'n'], hebrew: 'ואן', emoji: '🚐' },
            { word: 'vet', parts: ['v', 'e', 't'], hebrew: 'וטרינר', emoji: '🩺' },
            { word: 'yes', parts: ['y', 'e', 's'], hebrew: 'כן', emoji: '✅' },
            { word: 'yak', parts: ['y', 'a', 'k'], hebrew: 'יאק (חיה)', emoji: '🐃' },
            { word: 'zip', parts: ['z', 'i', 'p'], hebrew: 'רוכסן', emoji: '🤐' },
            { word: 'zoo', parts: ['z', 'oo'], hebrew: 'גן חיות', emoji: '🦁' },
            { word: 'box', parts: ['b', 'o', 'x'], hebrew: 'קופסה', emoji: '📦' },
            { word: 'six', parts: ['s', 'i', 'x'], hebrew: 'שש', emoji: '6️⃣' },
            { word: 'mix', parts: ['m', 'i', 'x'], hebrew: 'לערבב', emoji: '🥣' },
            { word: 'quiz', parts: ['q', 'u', 'i', 'z'], hebrew: 'חידון', emoji: '❓' },
            { word: 'queen', parts: ['q', 'u', 'ee', 'n'], hebrew: 'מלכה', emoji: '👑' },
            { word: 'jug', parts: ['j', 'u', 'g'], hebrew: 'כד', emoji: '🏺' }
        ]
    },
    {
        id: 6, shortName: 'שלב 6', title: 'צירופי כיתה ד\'!',
        letters: ['sh', 'ch', 'th', 'ck', 'ee', 'oo'],
        words: [
            { word: 'ship', parts: ['sh', 'i', 'p'], hebrew: 'אונייה', emoji: '🚢' },
            { word: 'shop', parts: ['sh', 'o', 'p'], hebrew: 'חנות', emoji: '🏪' },
            { word: 'fish', parts: ['f', 'i', 'sh'], hebrew: 'דג', emoji: '🐟' },
            { word: 'dish', parts: ['d', 'i', 'sh'], hebrew: 'צלחת', emoji: '🍽️' },
            { word: 'chat', parts: ['ch', 'a', 't'], hebrew: 'שיחה', emoji: '💬' },
            { word: 'chip', parts: ['ch', 'i', 'p'], hebrew: 'צ\'יפס', emoji: '🍟' },
            { word: 'chin', parts: ['ch', 'i', 'n'], hebrew: 'סנטר', emoji: '🙂' },
            { word: 'thin', parts: ['th', 'i', 'n'], hebrew: 'דק', emoji: '📏' },
            { word: 'this', parts: ['th', 'i', 's'], hebrew: 'זה / זאת', emoji: '👇' },
            { word: 'that', parts: ['th', 'a', 't'], hebrew: 'ההוא / ההיא', emoji: '👉' },
            { word: 'duck', parts: ['d', 'u', 'ck'], hebrew: 'ברווז', emoji: '🦆' },
            { word: 'clock', parts: ['c', 'l', 'o', 'ck'], hebrew: 'שעון', emoji: '⏰' },
            { word: 'tree', parts: ['t', 'r', 'ee'], hebrew: 'עץ', emoji: '🌳' },
            { word: 'bee', parts: ['b', 'ee'], hebrew: 'דבורה', emoji: '🐝' },
            { word: 'book', parts: ['b', 'oo', 'k'], hebrew: 'ספר', emoji: '📖' },
            { word: 'moon', parts: ['m', 'oo', 'n'], hebrew: 'ירח', emoji: '🌙' }
        ]
    },
    {
        id: 7, shortName: 'שלב 7', title: 'קוראים משפטים!',
        isSentenceLevel: true,
        letters: [],
        words: [],
        sentences: [
            { id: 's1', text: 'A big dog sat on a red mat', hebrew: 'כלב גדול ישב על שטיחון אדום', emoji: '🐶🔴' },
            { id: 's2', text: 'The fat cat has a hat', hebrew: 'לחתול השמן יש כובע', emoji: '🐱🎩' },
            { id: 's3', text: 'A fish is in the dish', hebrew: 'דג נמצא בתוך הצלחת', emoji: '🐟🍽️' },
            { id: 's4', text: 'Dad has a red pen', hebrew: 'לאבא יש עט אדום', emoji: '👨🖊️' },
            { id: 's5', text: 'The pig can dig in the mud', hebrew: 'החזיר יכול לחפור בבוץ', emoji: '🐷⛏️' },
            { id: 's6', text: 'A bug is on the cup', hebrew: 'חיפושית נמצאת על הכוס', emoji: '🐞☕' },
            { id: 's7', text: 'This duck can win the fun quiz', hebrew: 'הברווז הזה יכול לנצח בחידון הכיפי', emoji: '🦆🏆' },
            { id: 's8', text: 'Look at the moon and the tree', hebrew: 'הביטי בירח ובעץ', emoji: '🌙🌳' },
            { id: 's9', text: 'A bee sat on my book', hebrew: 'דבורה ישבה על הספר שלי', emoji: '🐝📖' },
            { id: 's10', text: 'The kid has six pens in a box', hebrew: 'לילד יש שש עטים בקופסה', emoji: '🧒📦' },
            { id: 's11', text: 'The red bus is fast', hebrew: 'האוטובוס האדום הוא מהיר', emoji: '🚌💨' },
            { id: 's12', text: 'The queen has a pet fox', hebrew: 'למלכה יש שועל מחמד', emoji: '👑🦊' }
        ]
    }
];

const ALL_WORDS_MAP = {};
LEVELS.forEach(l => (l.words || []).forEach(w => { ALL_WORDS_MAP[w.word] = w; }));

/* ==========================================================================
   3. REWARDS SHOP CATALOG
   ========================================================================== */
const SHOP_AVATARS = [
    { id: 'av_girl', emoji: '👧🏻', name: 'ילדה חכמה', cost: 0 },
    { id: 'av_astro', emoji: '👩‍🚀', name: 'אסטרונאוטית', cost: 40 },
    { id: 'av_fairy', emoji: '🧚‍♀️', name: 'פיית מילים', cost: 60 },
    { id: 'av_hero', emoji: '🦸‍♀️', name: 'גיבורת-על', cost: 90 },
    { id: 'av_queen', emoji: '👸', name: 'מלכת האנגלית', cost: 120 },
    { id: 'av_robot', emoji: '🤖', name: 'רובוט גאון', cost: 80 }
];

const SHOP_PETS = [
    { id: 'pet_dog', emoji: '🐶', name: 'כלבלב', cost: 0 },
    { id: 'pet_cat', emoji: '🐱', name: 'חתלתול', cost: 35 },
    { id: 'pet_uni', emoji: '🦄', name: 'חד-קרן', cost: 75 },
    { id: 'pet_dragon', emoji: '🐉', name: 'דרקון', cost: 100 },
    { id: 'pet_panda', emoji: '🐼', name: 'פנדה', cost: 60 },
    { id: 'pet_owl', emoji: '🦉', name: 'ינשוף חכם', cost: 85 }
];

const SHOP_THEMES = [
    { id: 'theme-classic', name: 'קלאסי סגול', icon: '💜', cost: 0, preview: 'from-indigo-500 to-purple-600' },
    { id: 'theme-unicorn', name: 'חד-קרן ורוד', icon: '🦄', cost: 50, preview: 'from-pink-500 to-purple-500' },
    { id: 'theme-ocean', name: 'אוקיינוס כחול', icon: '🌊', cost: 50, preview: 'from-sky-500 to-teal-500' },
    { id: 'theme-space', name: 'חלל וכוכבים', icon: '🌌', cost: 80, preview: 'from-slate-800 to-indigo-800' },
    { id: 'theme-neon', name: 'ניאון זוהר', icon: '⚡', cost: 100, preview: 'from-fuchsia-600 to-emerald-500' }
];

/* ==========================================================================
   4. LOGGED-IN STUDENT + SERVER PERSISTENCE (NEXT.JS API + POSTGRES)
   The page is only rendered for a logged-in student; the server passes the
   user and their progress in window.__EC_BOOT__ (see LegacyApp.tsx).
   ========================================================================== */
const BOOT = (typeof window !== 'undefined' && window.__EC_BOOT__) || {};
const CURRENT_USER = BOOT.user || { id: 'anonymous', username: '', displayName: '' };
const KID_SETTINGS = BOOT.settings || { disabledModules: [] };
const moduleOn = (id) => !(KID_SETTINGS.disabledModules || []).includes(id);
const API_PROGRESS = '/api/me/progress';
const API_REWARDS = '/api/me/rewards';
const API_REDEEM = '/api/me/redemptions';
const POLL_INTERVAL_MS = 5000;
const REQUEST_TIMEOUT_MS = 10000;
const SAVE_RETRY_MS = 5000;
const clientSessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
let cloudErrorMsg = '';

/** Escape any text that came from users (names, reward titles) before putting it in innerHTML. */
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createDefaultProfileData() {
    return {
        coins: 0,
        dailyStreak: 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        completedLevels: [],
        learnedLetters: [],
        readWords: [],
        readSentences: [],
        mistakes: [],
        bdBestScore: 0,
        slowSpeech: false,
        sfxMuted: false,
        preferredVoiceName: '',
        ownedItems: ['av_girl', 'pet_dog', 'theme-classic'],
        equippedAvatar: 'av_girl',
        equippedPet: 'pet_dog',
        equippedTheme: 'theme-classic'
    };
}

let state = {
    ...createDefaultProfileData(),
    currentLevelId: 1,
    currentTab: 'learn',
    blenderWordIndex: 0,
    blenderRevealMeaning: false,
    shopTab: 'app',
    abcBoardMode: 'name',
    // Server-managed (parents define rewards; redemptions wait for a parent to mark them done)
    parentRewards: [],
    redemptions: [],
    rewardsLoaded: false
};

let cloudReady = false;       // initial load finished
let cloudConnected = false;   // server reachable; saves go straight to Postgres
let lastLocalWriteId = 0;
let serverVersion = 0;        // version of the server copy our state is based on
let inflightSave = null;
let rerunSave = false;
let hasUnsavedChanges = false;
let dirtyWhileOffline = false;
let retryTimer = null;
let pollTimer = null;

/* ---------- local backup (per user, survives a flaky connection / refresh) ---------- */
function getLocalBackupKey() {
    return `english_click_pro_progress_${CURRENT_USER.id}`;
}

function saveLocalBackup() {
    try {
        localStorage.setItem(getLocalBackupKey(), JSON.stringify({
            data: extractPersistableState(),
            version: serverVersion,
            dirty: hasUnsavedChanges || dirtyWhileOffline
        }));
    } catch (err) {
        // Ignore storage quota / private mode
    }
}

function loadLocalBackup() {
    try {
        const raw = localStorage.getItem(getLocalBackupKey());
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        return null;
    }
}

/* ---------- state <-> stored data ---------- */
// Fields written by other parts of the app (e.g. spelling stats from /practice/spell) that this
// game doesn't use. They are kept as-is and sent back on every save so they are never lost.
const GAME_KEYS = ['coins', 'dailyStreak', 'lastActiveDate', 'completedLevels', 'learnedLetters', 'readWords',
    'readSentences', 'mistakes', 'bdBestScore', 'slowSpeech', 'sfxMuted', 'preferredVoiceName', 'ownedItems',
    'equippedAvatar', 'equippedPet', 'equippedTheme', 'updatedAt', 'writeId', 'editorId'];
let passthroughData = {};
function capturePassthrough(raw) {
    passthroughData = {};
    if (!raw || typeof raw !== 'object') return;
    Object.keys(raw).forEach((key) => {
        if (!GAME_KEYS.includes(key)) passthroughData[key] = raw[key];
    });
}

function extractPersistableState() {
    lastLocalWriteId = Date.now();
    return {
        ...passthroughData,
        coins: Number(state.coins) || 0,
        dailyStreak: Number(state.dailyStreak) || 1,
        lastActiveDate: state.lastActiveDate || new Date().toISOString().slice(0, 10),
        completedLevels: Array.isArray(state.completedLevels) ? [...state.completedLevels] : [],
        learnedLetters: Array.isArray(state.learnedLetters) ? [...state.learnedLetters] : [],
        readWords: Array.isArray(state.readWords) ? [...state.readWords] : [],
        readSentences: Array.isArray(state.readSentences) ? [...state.readSentences] : [],
        mistakes: Array.isArray(state.mistakes) ? [...state.mistakes] : [],
        bdBestScore: Number(state.bdBestScore) || 0,
        slowSpeech: Boolean(state.slowSpeech),
        sfxMuted: Boolean(state.sfxMuted),
        preferredVoiceName: state.preferredVoiceName || '',
        ownedItems: Array.isArray(state.ownedItems) ? [...state.ownedItems] : ['av_girl', 'pet_dog', 'theme-classic'],
        equippedAvatar: state.equippedAvatar || 'av_girl',
        equippedPet: state.equippedPet || 'pet_dog',
        equippedTheme: state.equippedTheme || 'theme-classic',
        updatedAt: new Date().toISOString(),
        writeId: lastLocalWriteId,
        editorId: clientSessionId
    };
}

function sanitizeLoadedProfile(data) {
    const base = createDefaultProfileData();
    if (!data) return base;
    return {
        ...base,
        coins: typeof data.coins === 'number' ? data.coins : base.coins,
        dailyStreak: typeof data.dailyStreak === 'number' ? data.dailyStreak : base.dailyStreak,
        lastActiveDate: data.lastActiveDate || base.lastActiveDate,
        completedLevels: Array.isArray(data.completedLevels) ? data.completedLevels : [],
        learnedLetters: Array.isArray(data.learnedLetters) ? data.learnedLetters : [],
        readWords: Array.isArray(data.readWords) ? data.readWords : [],
        readSentences: Array.isArray(data.readSentences) ? data.readSentences : [],
        mistakes: Array.isArray(data.mistakes) ? data.mistakes : [],
        bdBestScore: data.bdBestScore || 0,
        slowSpeech: !!data.slowSpeech,
        sfxMuted: !!data.sfxMuted,
        preferredVoiceName: data.preferredVoiceName || '',
        ownedItems: Array.isArray(data.ownedItems) && data.ownedItems.length ? data.ownedItems : base.ownedItems,
        equippedAvatar: data.equippedAvatar || base.equippedAvatar,
        equippedPet: data.equippedPet || base.equippedPet,
        equippedTheme: data.equippedTheme || base.equippedTheme
    };
}

function assignProgressToState(data) {
    Object.assign(state, {
        ...data,
        completedLevels: [...data.completedLevels],
        learnedLetters: [...data.learnedLetters],
        readWords: [...data.readWords],
        readSentences: [...data.readSentences],
        mistakes: [...data.mistakes],
        ownedItems: [...data.ownedItems]
    });
}

/** First load: apply data, update the daily streak, render everything. Returns true if the streak date changed. */
function applyProfileToActiveState(rawData) {
    capturePassthrough(rawData);
    const data = sanitizeLoadedProfile(rawData);
    const today = new Date().toISOString().slice(0, 10);
    let changed = false;

    if (data.lastActiveDate && data.lastActiveDate !== today) {
        const prev = new Date(data.lastActiveDate + 'T00:00:00');
        const curr = new Date(today + 'T00:00:00');
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            data.dailyStreak = (data.dailyStreak || 1) + 1;
        } else if (diffDays > 1) {
            data.dailyStreak = 1;
        }
        data.lastActiveDate = today;
        changed = true;
    }

    assignProgressToState(data);
    initVoices();
    applyTheme();
    updateHeaderUI();
    renderLevelSelector();
    renderLevelHeader();
    renderCurrentView();
    return changed;
}

/** Server copy wins (another device, or a parent reset). */
function adoptServerProgress(progress, { notify = false } = {}) {
    serverVersion = Number(progress.version) || serverVersion;
    capturePassthrough(progress.data);
    assignProgressToState(sanitizeLoadedProfile(progress.data));
    hasUnsavedChanges = false;
    dirtyWhileOffline = false;
    applyTheme();
    updateHeaderUI();
    renderLevelSelector();
    renderLevelHeader();
    if (state.currentTab === 'learn') renderCurrentView();
    saveLocalBackup();
    if (notify) showToast('ההתקדמות עודכנה מהשרת', '🔄');
}

/* ---------- networking ---------- */
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { cache: 'no-store', ...options, signal: controller.signal });
    } catch (err) {
        if (err?.name === 'AbortError') throw new Error('השרת לא הגיב בזמן');
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

let redirectingToLogin = false;
function handleLoggedOut() {
    if (redirectingToLogin) return;
    redirectingToLogin = true;
    saveLocalBackup();
    window.location.href = '/login?expired=1';
}

function setSaveBadge(kind) {
    const badge = document.getElementById('save-status-badge');
    if (!badge) return;
    const variants = {
        saving: ['שומר לשרת...', 'bg-amber-50 text-amber-700 border-amber-200'],
        saved: ['נשמר בענן ☁️✓', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
        local: ['נשמר מקומית ✓', 'bg-amber-50 text-amber-700 border-amber-200'],
        error: ['שגיאת שמירה ⚠️', 'bg-rose-50 text-rose-700 border-rose-200'],
        offline: ['לא מחובר לשרת ⚠️', 'bg-rose-50 text-rose-700 border-rose-200']
    };
    const [text, colors] = variants[kind] || variants.saved;
    badge.textContent = text;
    badge.className = `text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${colors}`;
}

/**
 * Sends the current state. Concurrent calls are coalesced (one more PUT runs after the
 * in-flight one). The server rejects stale writes (409) and returns its copy, which we adopt.
 */
function pushProgress({ keepalive = false } = {}) {
    if (inflightSave) {
        rerunSave = true;
        return inflightSave;
    }
    inflightSave = (async () => {
        try {
            do {
                rerunSave = false;
                hasUnsavedChanges = false;
                const res = await fetchWithTimeout(API_PROGRESS, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: extractPersistableState(), baseVersion: serverVersion }),
                    keepalive
                });
                if (res.status === 401) return handleLoggedOut();
                if (res.status === 409) {
                    const json = await res.json();
                    adoptServerProgress(json.current, { notify: true });
                    continue;
                }
                if (!res.ok) throw new Error(`שגיאת שמירה (${res.status})`);
                const json = await res.json();
                serverVersion = Number(json.version) || serverVersion;
            } while (rerunSave);
            dirtyWhileOffline = false;
            cloudConnected = true;
            cloudErrorMsg = '';
            saveLocalBackup();
            setSaveBadge('saved');
        } catch (err) {
            console.warn('Error saving progress:', err);
            hasUnsavedChanges = true;
            dirtyWhileOffline = true;
            cloudErrorMsg = err?.message || 'שגיאת שמירה בשרת';
            saveLocalBackup();
            setSaveBadge('error');
            scheduleSaveRetry();
        } finally {
            inflightSave = null;
        }
    })();
    return inflightSave;
}

function scheduleSaveRetry() {
    if (retryTimer) return;
    retryTimer = setTimeout(() => {
        retryTimer = null;
        if (dirtyWhileOffline) {
            setSaveBadge('saving');
            pushProgress();
        }
    }, SAVE_RETRY_MS);
}

/** Wait for any pending save to land (used before redeeming / leaving). */
async function flushSaves() {
    while (inflightSave) {
        await inflightSave;
    }
}

function scheduleSave() {
    hasUnsavedChanges = true;
    saveLocalBackup();
    if (!cloudConnected) {
        dirtyWhileOffline = true;
        setSaveBadge('local');
        scheduleSaveRetry();
        return;
    }
    setSaveBadge('saving');
    pushProgress();
}

// Kept for older call sites in this file.
function persistToCloudNow() {
    scheduleSave();
    return inflightSave || Promise.resolve();
}

async function pollServerOnce() {
    if (!cloudReady || redirectingToLogin || document.visibilityState !== 'visible') return;
    try {
        const res = await fetchWithTimeout(API_PROGRESS);
        if (res.status === 401) return handleLoggedOut();
        if (!res.ok) throw new Error(`שגיאת שרת (${res.status})`);
        const progress = await res.json();
        cloudConnected = true;
        const version = Number(progress.version) || 0;
        if (version > serverVersion && !inflightSave && !dirtyWhileOffline && !hasUnsavedChanges) {
            const isOwnEcho = progress.data && progress.data.editorId === clientSessionId;
            if (isOwnEcho) serverVersion = version;
            else adoptServerProgress(progress);
        }
        if (dirtyWhileOffline && !inflightSave) pushProgress();
        if (cloudErrorMsg) {
            cloudErrorMsg = '';
            setSaveBadge('saved');
        }
    } catch (err) {
        console.warn('Live sync error:', err);
        cloudErrorMsg = err?.message || 'שגיאת סנכרון';
    }
}

function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(pollServerOnce, POLL_INTERVAL_MS);
    window.addEventListener('focus', pollServerOnce);
}

/* ---------- rewards from parents ---------- */
async function loadRewards() {
    try {
        const res = await fetchWithTimeout(API_REWARDS);
        if (res.status === 401) return handleLoggedOut();
        if (!res.ok) throw new Error(`שגיאת שרת (${res.status})`);
        const json = await res.json();
        state.parentRewards = Array.isArray(json.rewards) ? json.rewards : [];
        state.redemptions = Array.isArray(json.redemptions) ? json.redemptions : [];
        state.rewardsLoaded = true;
    } catch (err) {
        console.warn('Could not load rewards:', err);
        showToast('לא הצלחנו לטעון את הפרסים, נסי שוב', '⚠️');
    }
    if (state.shopTab === 'parent' && !document.getElementById('shop-modal').classList.contains('hidden')) {
        renderShopContent();
    }
}

/* ---------- start ---------- */
function initCloudStorage() {
    const boot = BOOT.progress;
    const backup = loadLocalBackup();
    serverVersion = Number(boot?.version) || 0;
    cloudConnected = !!boot;

    // Offline edits from this device that never reached the server, based on the same version
    const useBackup = backup && backup.dirty && backup.data && Number(backup.version) === serverVersion;
    const changed = applyProfileToActiveState(useBackup ? backup.data : boot?.data);

    cloudReady = true;
    if (useBackup || changed) scheduleSave();
    else setSaveBadge(cloudConnected ? 'saved' : 'offline');
    startPolling();
}

async function switchUser() {
    try {
        if (hasUnsavedChanges || dirtyWhileOffline) await Promise.race([pushProgress(), new Promise(r => setTimeout(r, 3000))]);
        await flushSaves();
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
        // Even if logout fails, go to the login screen
    }
    window.location.href = '/login';
}
window.switchUser = switchUser;

/* ---------- notices from parents: waiting check + coin changes ---------- */
async function loadNotices() {
    try {
        const res = await fetchWithTimeout('/api/me/notices');
        if (res.status === 401) return handleLoggedOut();
        if (!res.ok) return;
        const json = await res.json();
        renderCheckBanner(json.openCheck);
        renderReviewBanner(json.review);
        if (Array.isArray(json.adjustments) && json.adjustments.length) showCoinAdjustments(json.adjustments);
    } catch (err) {
        // not critical
    }
}

function renderCheckBanner(openCheck) {
    let el = document.getElementById('check-banner');
    if (!openCheck) {
        if (el) el.remove();
        return;
    }
    if (!el) {
        el = document.createElement('div');
        el.id = 'check-banner';
        const wrapper = document.getElementById('app-wrapper');
        wrapper.insertBefore(el, wrapper.children[1] || null);
    }
    el.innerHTML = `
        <div class="mb-5 bg-gradient-to-l from-amber-100 to-yellow-50 border-2 border-amber-300 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pop">
            <div class="flex items-center gap-3">
                <span class="text-3xl">📝</span>
                <div>
                    <div class="font-black text-amber-950">יש לך מבחן מההורים!</div>
                    <div class="text-xs text-amber-900">${Number(openCheck.total)} שאלות על מה שכבר למדת – בלי רמזים</div>
                </div>
            </div>
            <button onclick="goToPractice('/practice/check')" class="bg-amber-500 hover:bg-amber-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-sm cursor-pointer">מתחילים 🚀</button>
        </div>
    `;
}

function renderPlacementBanner() {
    const existing = document.getElementById('placement-banner');
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('placement_dismissed') === '1'; } catch (e) {}
    if (!moduleOn('placement') || passthroughData.placement || state.completedLevels.length >= LEVELS.length || dismissed) {
        if (existing) existing.remove();
        return;
    }
    if (existing) return;
    const el = document.createElement('div');
    el.id = 'placement-banner';
    const wrapper = document.getElementById('app-wrapper');
    wrapper.insertBefore(el, wrapper.children[1] || null);
    el.innerHTML = `
        <div class="mb-5 bg-gradient-to-l from-violet-100 to-fuchsia-50 border-2 border-violet-300 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <span class="text-3xl">🧭</span>
                <div>
                    <div class="font-black text-violet-950">כבר יודעים חלק? מבחן מיקום קצר!</div>
                    <div class="text-xs text-violet-900">כמה שאלות – ומדלגים ישר לשלב שמתאים לך</div>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="goToPractice('/practice/placement')" class="bg-violet-600 hover:bg-violet-700 text-white font-black px-5 py-2.5 rounded-2xl shadow-sm cursor-pointer">למבחן מיקום 🧭</button>
                <button onclick="dismissPlacementBanner()" class="bg-white border border-violet-200 text-violet-800 font-bold px-3 py-2.5 rounded-2xl cursor-pointer">לא עכשיו</button>
            </div>
        </div>
    `;
}
window.dismissPlacementBanner = function() {
    try { sessionStorage.setItem('placement_dismissed', '1'); } catch (e) {}
    const el = document.getElementById('placement-banner');
    if (el) el.remove();
};

function renderReviewBanner(review) {
    let el = document.getElementById('review-banner');
    const show = review && review.count > 0 && !review.doneToday;
    if (!show) {
        if (el) el.remove();
        return;
    }
    if (!el) {
        el = document.createElement('div');
        el.id = 'review-banner';
        const wrapper = document.getElementById('app-wrapper');
        const after = document.getElementById('check-banner') || wrapper.children[0];
        wrapper.insertBefore(el, after.nextSibling);
    }
    el.innerHTML = `
        <div class="mb-5 bg-gradient-to-l from-sky-100 to-indigo-50 border-2 border-sky-300 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <span class="text-3xl">⏰</span>
                <div>
                    <div class="font-black text-sky-950">${Number(review.count)} דברים לחזרה היום – 5 דקות!</div>
                    <div class="text-xs text-sky-900">${review.streak > 0 ? '🔥 רצף של ' + Number(review.streak) + ' ימים – לא לשבור אותו!' : 'סיום החזרה = בונוס מטבעות 🪙'}</div>
                </div>
            </div>
            <button onclick="goToPractice('/practice/daily')" class="bg-sky-500 hover:bg-sky-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-sm cursor-pointer">לחזרה היומית ⏰</button>
        </div>
    `;
}

function showCoinAdjustments(list) {
    if (document.getElementById('coin-notice')) return;
    const overlay = document.createElement('div');
    overlay.id = 'coin-notice';
    overlay.className = 'fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4';
    overlay.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-pop" role="dialog" aria-modal="true">
            <div class="text-5xl mb-2">🪙</div>
            <h3 class="text-xl font-black text-slate-800 mb-3">הודעה מההורים</h3>
            <div class="space-y-2 mb-5">
                ${list.map(a => `
                    <div class="rounded-2xl border px-3 py-2 ${a.amount >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}">
                        <div class="font-black ${a.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${a.amount >= 0 ? '+' : ''}${Number(a.amount)} מטבעות</div>
                        <div class="text-sm text-slate-700">${escapeHtml(a.reason)}</div>
                    </div>`).join('')}
            </div>
            <button id="coin-notice-ok" class="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black cursor-pointer">הבנתי 👍</button>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('coin-notice-ok').onclick = () => {
        overlay.remove();
        fetch('/api/me/notices/seen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: list.map(a => a.id) })
        }).catch(() => {});
        pollServerOnce(); // pick up the new coin balance right away
    };
}

window.goToPractice = async function(path) {
    try {
        if (hasUnsavedChanges || dirtyWhileOffline) await Promise.race([pushProgress(), new Promise(r => setTimeout(r, 3000))]);
        await flushSaves();
    } catch (err) {}
    window.location.href = path;
};

window.goToParentArea = async function() {
    try {
        await flushSaves();
    } catch (err) {}
    window.location.href = '/login?next=/parent&mode=parent';
};

/* ==========================================================================
   5. CRYSTAL-CLEAR ENGLISH SPEECH ENGINE (VOICES, WORDS, ABC NAMES & PHONICS)
   ========================================================================== */
let availableEnglishVoices = [];
let selectedVoice = null;

function initVoices() {
    if (!('speechSynthesis' in window)) return;
    try {
        const allVoices = window.speechSynthesis.getVoices() || [];
        // Prioritize clear US/GB English voices
        const enVoices = allVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
        enVoices.sort((a, b) => {
            const score = (v) => {
                const n = (v.name || '').toLowerCase();
                let s = 0;
                if (v.lang === 'en-US') s += 4;
                else if (v.lang === 'en-GB') s += 3;
                if (n.includes('google') || n.includes('samantha') || n.includes('aria') || n.includes('natural') || n.includes('jenny')) s += 5;
                if (v.localService) s += 1;
                return s;
            };
            return score(b) - score(a);
        });

        availableEnglishVoices = enVoices;

        if (state.preferredVoiceName) {
            const savedMatch = availableEnglishVoices.find(v => v.name === state.preferredVoiceName);
            if (savedMatch) {
                selectedVoice = savedMatch;
                return;
            }
        }
        if (availableEnglishVoices.length > 0) {
            selectedVoice = availableEnglishVoices[0];
        }
    } catch (err) {
        console.warn('Voice initialization warning:', err);
    }
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        initVoices();
    };
}

function createEnglishUtterance(text, rateMultiplier = 1) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = selectedVoice ? selectedVoice.lang : 'en-US';
    if (selectedVoice) utter.voice = selectedVoice;
    const baseRate = state.slowSpeech ? 0.68 : 0.92;
    utter.rate = Math.max(0.5, Math.min(1.2, baseRate * rateMultiplier));
    utter.pitch = 1.04;
    utter.volume = 1;
    return utter;
}

function speakWord(text) {
    if (!text || !('speechSynthesis' in window)) return;
    try {
        if (!selectedVoice) initVoices();
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const utter = createEnglishUtterance(String(text), 1);
        window.speechSynthesis.speak(utter);
    } catch (err) {
        console.warn('Speech synthesis error:', err);
    }
}

function speakLetterName(key) {
    if (!key || !('speechSynthesis' in window)) return;
    const info = LETTER_BANK[String(key).toLowerCase()];
    const spoken = info ? info.ttsLetterName : String(key).toUpperCase();
    try {
        if (!selectedVoice) initVoices();
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        const utter = createEnglishUtterance(spoken, 0.92);
        window.speechSynthesis.speak(utter);
    } catch (err) {
        console.warn('Letter name speech error:', err);
    }
}

function speakPhonics(key, withExample = false) {
    if (!key || !('speechSynthesis' in window)) return;
    const info = LETTER_BANK[String(key).toLowerCase()];
    const phonemeText = info ? info.phoneme : String(key);
    try {
        if (!selectedVoice) initVoices();
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const uPhoneme = createEnglishUtterance(phonemeText, 0.85);
        window.speechSynthesis.speak(uPhoneme);

        if (withExample && info && info.exampleWord) {
            const uExample = createEnglishUtterance(info.exampleWord, 0.95);
            window.speechSynthesis.speak(uExample);
        }
    } catch (err) {
        console.warn('Phonics speech error:', err);
    }
}

// Expose speech helpers globally for inline HTML onclick handlers
window.speakWord = speakWord;
window.speakLetterName = speakLetterName;
window.speakPhonics = speakPhonics;

/* ==========================================================================
   6. WEB AUDIO SFX ENGINE + COINS, WORD MASTERY & MISTAKE BANK HELPERS
   ========================================================================== */
let audioCtx = null;

function getAudioContext() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
    }
    return audioCtx;
}

function playSfx(type = 'pop') {
    if (state.sfxMuted) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        if (type === 'pop') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.11);
        } else if (type === 'coin') {
            // Bright two-tone ka-ching chime
            [987.77, 1318.51].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                const start = now + i * 0.075;
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.18, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.25);
            });
        } else if (type === 'wrong') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(160, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.23);
        } else if (type === 'fanfare') {
            // Victory arpeggio
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                const start = now + i * 0.09;
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0.16, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.32);
            });
        }
    } catch (err) {
        // Ignore Web Audio autoplay restrictions
    }
}

function spawnFloatingCoin(amount) {
    const wallet = document.getElementById('wallet-pill');
    const popup = document.createElement('div');
    popup.className = 'floating-coin';
    popup.textContent = `+${amount} 🪙`;

    if (wallet) {
        const rect = wallet.getBoundingClientRect();
        popup.style.left = `${Math.max(16, rect.left + rect.width / 2 - 42)}px`;
        popup.style.top = `${Math.max(16, rect.top)}px`;
    } else {
        popup.style.left = '50%';
        popup.style.top = '80px';
    }

    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 1200);
}

function awardCoins(amount, toastMessage = '') {
    if (!amount || amount <= 0) return;
    state.coins = (Number(state.coins) || 0) + amount;
    playSfx('coin');
    spawnFloatingCoin(amount);
    updateHeaderUI();
    scheduleSave();
    if (toastMessage) {
        showToast(`${toastMessage} (+${amount} 🪙)`, '🪙');
    }
}

function markWordAsRead(word, withCoinReward = false) {
    if (!word) return;
    const normalized = String(word).toLowerCase();
    if (!state.readWords.includes(normalized)) {
        state.readWords.push(normalized);
        if (withCoinReward) {
            awardCoins(3, `קראת מילה חדשה: ${normalized}!`);
        } else {
            updateHeaderUI();
            scheduleSave();
        }
    }
}

function recordMistake(word) {
    if (!word) return;
    const normalized = String(word).toLowerCase();
    if (ALL_WORDS_MAP[normalized] && !state.mistakes.includes(normalized)) {
        state.mistakes.push(normalized);
        updateHeaderUI();
        scheduleSave();
    }
}

let confettiParticles = [];
let confettiAnimating = false;
function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#a855f7', '#22c55e'];
    for (let i = 0; i < 90; i++) {
        confettiParticles.push({
            x: Math.random() * canvas.width,
            y: -20 - Math.random() * 140,
            w: 7 + Math.random() * 6,
            h: 5 + Math.random() * 8,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 5,
            vy: 3 + Math.random() * 5,
            rot: Math.random() * 360,
            vRot: (Math.random() - 0.5) * 12,
            alpha: 1
        });
    }
    if (!confettiAnimating) {
        confettiAnimating = true;
        requestAnimationFrame(() => animateConfetti(canvas, ctx));
    }
}

function animateConfetti(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rot += p.vRot;
        if (p.y > canvas.height * 0.78) p.alpha -= 0.025;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
    });
    confettiParticles = confettiParticles.filter(p => p.alpha > 0 && p.y < canvas.height + 40);
    if (confettiParticles.length > 0) requestAnimationFrame(() => animateConfetti(canvas, ctx));
    else {
        confettiAnimating = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

let toastTimer = null;
function showToast(text, icon = '✨') {
    const container = document.getElementById('toast-container');
    document.getElementById('toast-text').textContent = text;
    document.getElementById('toast-icon').textContent = icon;
    container.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => container.classList.add('opacity-0', 'translate-y-4'), 2400);
}

/* ==========================================================================
   7. HEADER, THEME & LEVEL NAVIGATION
   ========================================================================== */
function applyTheme() {
    document.body.classList.remove('theme-classic', 'theme-unicorn', 'theme-ocean', 'theme-space', 'theme-neon');
    document.body.classList.add(state.equippedTheme || 'theme-classic');
}

function updateHeaderUI() {
    const nameEl = document.getElementById('header-profile-name');
    if (nameEl) {
        nameEl.textContent = CURRENT_USER.displayName;
    }

    document.getElementById('stat-coins').textContent = state.coins;
    document.getElementById('stat-streak').textContent = state.dailyStreak;

    const av = SHOP_AVATARS.find(a => a.id === state.equippedAvatar) || SHOP_AVATARS[0];
    const pet = SHOP_PETS.find(p => p.id === state.equippedPet) || SHOP_PETS[0];
    document.getElementById('header-avatar').textContent = av.emoji;
    document.getElementById('header-pet').textContent = pet.emoji;

    document.getElementById('speed-icon').textContent = state.slowSpeech ? '🐢' : '🐇';
    document.getElementById('speed-label').textContent = state.slowSpeech ? 'קצב איטי' : 'קצב רגיל';
    document.getElementById('sfx-icon').textContent = state.sfxMuted ? '🔇' : '🔊';

    // Letters mastered out of 26 base letters
    const singleLettersMastered = state.learnedLetters.filter(l => l.length === 1).length;
    document.getElementById('stat-letters-text').textContent = `${singleLettersMastered} / 26`;
    document.getElementById('bar-letters').style.width = `${Math.min(100, Math.round((singleLettersMastered / 26) * 100))}%`;

    // Words read
    const totalWordsCount = Object.keys(ALL_WORDS_MAP).length;
    document.getElementById('stat-words-text').textContent = `${state.readWords.length} / ${totalWordsCount}`;
    document.getElementById('bar-words').style.width = `${Math.min(100, Math.round((state.readWords.length / totalWordsCount) * 100))}%`;

    // Levels completed
    document.getElementById('stat-levels-text').textContent = `${state.completedLevels.length} / 7`;
    document.getElementById('bar-levels').style.width = `${Math.round((state.completedLevels.length / 7) * 100)}%`;

    // Mistake bank badge
    const mBadge = document.getElementById('mistake-badge-top');
    if (state.mistakes.length > 0) {
        mBadge.classList.remove('hidden');
        document.getElementById('mistake-count-top').textContent = state.mistakes.length;
    } else {
        mBadge.classList.add('hidden');
    }
}

function getCurrentLevel() {
    return LEVELS.find(l => l.id === state.currentLevelId) || LEVELS[0];
}

function renderLevelSelector() {
    const container = document.getElementById('level-selector');
    container.innerHTML = '';

    LEVELS.forEach(lvl => {
        const isSelected = state.currentLevelId === lvl.id;
        const isDone = state.completedLevels.includes(lvl.id);

        const btn = document.createElement('button');
        btn.onclick = () => selectLevel(lvl.id);
        btn.className = `relative text-right p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[76px] ${
            isSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md -translate-y-0.5'
                : isDone
                    ? 'bg-emerald-50/90 hover:bg-emerald-100 text-slate-800 border-emerald-300'
                    : 'bg-white/95 hover:bg-indigo-50 text-slate-800 border-slate-200'
        }`;

        const previewText = lvl.isSentenceLevel
            ? '📖 12 משפטים'
            : lvl.letters.map(l => l.toUpperCase()).join(' ');

        btn.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <span class="text-xs font-extrabold ${isSelected ? 'text-indigo-100' : 'text-indigo-600'}">${lvl.shortName}</span>
                ${isDone ? `<span class="text-[11px] font-black px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-emerald-500 text-white'}">✓</span>` : ''}
            </div>
            <div class="${lvl.isSentenceLevel ? '' : 'en-text'} text-xs font-extrabold mt-1 truncate w-full ${isSelected ? 'text-white' : 'text-slate-700'}">${previewText}</div>
        `;
        container.appendChild(btn);
    });
}

window.selectLevel = function(levelId) {
    state.currentLevelId = levelId;
    state.blenderWordIndex = 0;
    state.blenderRevealMeaning = false;
    renderLevelSelector();
    renderLevelHeader();

    const lvl = getCurrentLevel();
    if (lvl.isSentenceLevel) {
        document.getElementById('main-tabs-bar').classList.add('hidden');
        hideAllTabPanels();
        document.getElementById('tab-sentences').classList.remove('hidden');
        renderSentencesLevel();
    } else {
        document.getElementById('main-tabs-bar').classList.remove('hidden');
        document.getElementById('tab-sentences').classList.add('hidden');
        switchTab('learn');
    }
};

function renderLevelHeader() {
    const lvl = getCurrentLevel();
    document.getElementById('current-level-badge').textContent = lvl.shortName;
    document.getElementById('current-level-title').textContent = lvl.title;
    document.getElementById('current-level-subtitle').textContent = lvl.isSentenceLevel
        ? 'לחצי על כל מילה לשמוע אותה, או קראי את כל המשפט!'
        : lvl.letters.map(l => l.toUpperCase()).join(' • ');

    const doneBadge = document.getElementById('current-level-done-badge');
    doneBadge.classList.toggle('hidden', !state.completedLevels.includes(lvl.id));
}

function hideAllTabPanels() {
    ['learn', 'blend', 'spell', 'quiz', 'challenges', 'sentences'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.add('hidden');
    });
}

window.switchTab = function(tabName) {
    const lvl = getCurrentLevel();
    if (lvl.isSentenceLevel && tabName !== 'challenges') {
        // Allow jumping to challenges even from level 7
        state.currentLevelId = 1;
        renderLevelSelector();
        renderLevelHeader();
        document.getElementById('main-tabs-bar').classList.remove('hidden');
    }

    state.currentTab = tabName;
    hideAllTabPanels();
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');

    ['learn', 'blend', 'spell', 'quiz', 'challenges'].forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabName) {
            btn.className = 'flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-white text-indigo-700 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap';
        } else {
            btn.className = 'flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white/90 hover:bg-white/15 transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap';
        }
    });

    renderCurrentView();
};

function renderCurrentView() {
    const lvl = getCurrentLevel();
    if (lvl.isSentenceLevel && state.currentTab !== 'challenges') {
        renderSentencesLevel();
        return;
    }
    if (state.currentTab === 'learn') renderLearnTab();
    else if (state.currentTab === 'blend') renderBlenderTab();
    else if (state.currentTab === 'spell') startSpellingBuilder();
    else if (state.currentTab === 'quiz') startQuiz(false);
    else if (state.currentTab === 'challenges') renderChallengesTab();
}

window.toggleSpeechSpeed = function() {
    state.slowSpeech = !state.slowSpeech;
    updateHeaderUI();
    scheduleSave();
    showToast(state.slowSpeech ? 'מצב הקראה איטית וברורה 🐢' : 'מצב הקראה בקצב רגיל 🐇', state.slowSpeech ? '🐢' : '🐇');
};

window.toggleSfxMute = function() {
    state.sfxMuted = !state.sfxMuted;
    updateHeaderUI();
    scheduleSave();
    if (!state.sfxMuted) playSfx('pop');
};

/* ==========================================================================
   8. TAB 1: LEARN LETTERS (DUAL ABC NAME + PHONICS SOUND + GENIUS BONUS)
   ========================================================================== */
function renderLearnTab() {
    const lvl = getCurrentLevel();
    const grid = document.getElementById('letters-grid');
    grid.innerHTML = '';

    lvl.letters.forEach(key => {
        const info = LETTER_BANK[key];
        const isLearned = state.learnedLetters.includes(key);
        const card = document.createElement('div');
        card.className = `rounded-3xl p-5 border-2 transition-all flex flex-col justify-between ${
            isLearned
                ? 'bg-emerald-50/40 border-emerald-200 shadow-xs'
                : 'bg-slate-50/80 hover:bg-white border-indigo-100 hover:border-indigo-300 shadow-xs hover:shadow-md'
        }`;

        const bonusHtml = info.bonus ? `
            <div class="mt-3">
                <button onclick="toggleGeniusBonus('${key}')" class="w-full flex items-center justify-between bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold px-3 py-2 rounded-xl transition cursor-pointer">
                    <span>💡 בונוס לגאונים: צליל נוסף</span>
                    <span id="bonus-arrow-${key}">▼</span>
                </button>
                <div id="bonus-box-${key}" class="hidden mt-2 bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-2 animate-pop">
                    <div class="font-extrabold text-amber-800">${info.bonus.title}</div>
                    <p class="leading-relaxed">${info.bonus.desc}</p>
                    <button onclick="speakWord('${info.bonus.word}')" class="inline-flex items-center gap-1.5 bg-white border border-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-bold text-amber-900 cursor-pointer">
                        <span>${info.bonus.emoji}</span>
                        <span class="en-text font-black text-sm">${info.bonus.word}</span>
                        <span>(${info.bonus.hebrew}) 🔊</span>
                    </button>
                </div>
            </div>
        ` : '';

        card.innerHTML = `
            <div>
                <!-- Letter Display -->
                <div class="flex items-center justify-between gap-2 mb-3">
                    <div onclick="speakLetterName('${key}')" class="cursor-pointer select-none flex items-baseline gap-2 bg-white border border-indigo-100 px-4 py-2 rounded-2xl shadow-2xs hover:scale-105 transition" title="לחצי לשמוע את שם האות ב-ABC">
                        <span class="en-text text-4xl font-extrabold text-slate-400">${info.upper}</span>
                        <span class="en-text text-5xl font-black text-indigo-600">${info.lower}</span>
                    </div>

                    <!-- Dual Badges: ABC Name vs Phonics Sound -->
                    <div class="flex flex-col gap-1.5 flex-1">
                        <div class="bg-indigo-100/90 border border-indigo-200 text-indigo-950 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center justify-between gap-1">
                            <span class="text-indigo-700">שם ב-ABC:</span>
                            <span class="font-black text-sm">${info.hebrewName}</span>
                        </div>
                        <div class="bg-emerald-100/90 border border-emerald-200 text-emerald-950 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center justify-between gap-1">
                            <span class="text-emerald-700">צליל קריאה:</span>
                            <span class="font-black text-sm">${info.hebrewSound.split(' ')[0]}</span>
                        </div>
                    </div>
                </div>

                <!-- Dual Pronunciation Buttons -->
                <div class="grid grid-cols-2 gap-2 mb-3">
                    <button onclick="speakLetterName('${key}')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1 shadow-xs cursor-pointer">
                        <span>🔊</span><span>שם האות</span>
                    </button>
                    <button onclick="speakPhonics('${key}', true)" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-2 rounded-xl transition active:scale-95 flex items-center justify-center gap-1 shadow-xs cursor-pointer">
                        <span>🗣️</span><span>צליל האות</span>
                    </button>
                </div>

                <!-- Full Reading Sound & Memory Trick -->
                <div class="bg-white/90 border border-indigo-100/80 rounded-2xl p-3 mb-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    <div class="text-xs font-extrabold text-emerald-700 mb-1">🗣️ הצליל במילה: ${info.hebrewSound}</div>
                    <span class="font-extrabold text-indigo-600">💡 טריק: </span>${info.trick}
                </div>

                <!-- Example Word Strip -->
                <div class="flex items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-2.5">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">${info.exampleEmoji}</span>
                        <div>
                            <div class="en-text font-black text-lg text-slate-800 leading-none">${info.exampleWord}</div>
                            <div class="text-xs text-slate-500 font-medium">${info.exampleHebrew}</div>
                        </div>
                    </div>
                    <button onclick="speakWord('${info.exampleWord}')" class="bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs px-3 py-2 rounded-xl transition active:scale-95 cursor-pointer">
                        🔊 שמע מילה
                    </button>
                </div>

                ${bonusHtml}
            </div>

            <!-- Mastered Toggle -->
            <div class="mt-4 pt-3 border-t border-slate-200/70">
                <button onclick="toggleLetterLearned('${key}')" class="w-full py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                    isLearned
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
                }">
                    ${isLearned ? '✓ למדתי את האות הזו!' : 'סמני "למדתי ✓" (+2 🪙)'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.toggleGeniusBonus = function(key) {
    const box = document.getElementById(`bonus-box-${key}`);
    const arrow = document.getElementById(`bonus-arrow-${key}`);
    if (!box) return;
    const isHidden = box.classList.contains('hidden');
    box.classList.toggle('hidden');
    arrow.textContent = isHidden ? '▲' : '▼';
    if (isHidden) playSfx('pop');
};

window.toggleLetterLearned = function(key) {
    if (!state.learnedLetters.includes(key)) {
        state.learnedLetters.push(key);
        awardCoins(2, `כל הכבוד! למדת את האות ${key.toUpperCase()}`);
        renderLearnTab();
    } else {
        showToast('כבר סימנת שלמדת את האות הזו! 🌟', '✅');
    }
};

/* ==========================================================================
   9. TAB 2: WORD BLENDER MACHINE
   ========================================================================== */
let isBlendingRunning = false;

function renderBlenderTab() {
    const lvl = getCurrentLevel();
    const words = lvl.words;
    if (!words.length) return;
    if (state.blenderWordIndex >= words.length) state.blenderWordIndex = 0;
    const currentWordObj = words[state.blenderWordIndex];

    // Pills
    const pills = document.getElementById('blender-word-pills');
    pills.innerHTML = '';
    words.forEach((w, idx) => {
        const active = idx === state.blenderWordIndex;
        const read = state.readWords.includes(w.word);
        const pill = document.createElement('button');
        pill.onclick = () => {
            state.blenderWordIndex = idx;
            state.blenderRevealMeaning = false;
            renderBlenderTab();
        };
        pill.className = `en-text px-3 py-1.5 rounded-xl text-sm font-extrabold transition cursor-pointer flex items-center gap-1 ${
            active
                ? 'bg-indigo-600 text-white shadow-sm'
                : read
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 hover:bg-indigo-100 text-slate-600'
        }`;
        pill.innerHTML = `${w.word}${read && !active ? '<span class="text-[10px]">✓</span>' : ''}`;
        pills.appendChild(pill);
    });

    // Read badge
    const readBadge = document.getElementById('blender-read-badge');
    readBadge.style.opacity = state.readWords.includes(currentWordObj.word) ? '1' : '0';

    // Tiles
    const tilesContainer = document.getElementById('blender-tiles');
    tilesContainer.innerHTML = '';
    currentWordObj.parts.forEach((part, idx) => {
        const tile = document.createElement('button');
        tile.id = `blend-tile-${idx}`;
        tile.onclick = () => {
            triggerTileHighlight(idx);
            speakPhonics(part, false);
        };
        tile.className = 'en-text min-w-[70px] sm:min-w-[90px] h-[82px] sm:h-[100px] px-3.5 bg-white hover:bg-indigo-50 border-2 border-indigo-200 rounded-3xl text-4xl sm:text-5xl font-black text-indigo-700 shadow-sm transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95';
        const hebrewHint = LETTER_BANK[part] ? LETTER_BANK[part].hebrewSound.split(' ')[0] : '';
        tile.innerHTML = `
            <span class="leading-none">${part}</span>
            <span class="font-hebrew text-xs font-bold text-slate-400 mt-1" dir="rtl">${hebrewHint}</span>
        `;
        tilesContainer.appendChild(tile);

        if (idx < currentWordObj.parts.length - 1) {
            const plus = document.createElement('span');
            plus.className = 'text-xl font-black text-indigo-300 select-none';
            plus.textContent = '+';
            tilesContainer.appendChild(plus);
        }
    });

    document.getElementById('blender-counter').textContent = `${state.blenderWordIndex + 1} / ${words.length}`;
    renderBlenderMeaningBox(currentWordObj);
}

function renderBlenderMeaningBox(wordObj) {
    const box = document.getElementById('blender-meaning-box');
    const btn = document.getElementById('btn-toggle-meaning');
    if (state.blenderRevealMeaning) {
        btn.textContent = '🙈 הסתר פירוש';
        box.innerHTML = `
            <div class="inline-flex items-center gap-3 bg-white border-2 border-emerald-200 px-6 py-3 rounded-2xl shadow-sm animate-pop">
                <span class="text-4xl">${wordObj.emoji}</span>
                <div class="text-right">
                    <div class="en-text text-2xl font-black text-emerald-700 leading-tight">${wordObj.word}</div>
                    <div class="text-base font-bold text-slate-700">${wordObj.hebrew}</div>
                </div>
            </div>
        `;
    } else {
        btn.textContent = '👀 גלה פירוש';
        box.innerHTML = `<div class="text-sm text-slate-400 font-medium">נסי לחבר את הצלילים בקול לפני שתגלי את הפירוש 😉</div>`;
    }
}

window.toggleBlenderMeaning = function() {
    state.blenderRevealMeaning = !state.blenderRevealMeaning;
    if (state.blenderRevealMeaning) playSfx('pop');
    const lvl = getCurrentLevel();
    renderBlenderMeaningBox(lvl.words[state.blenderWordIndex]);
};

function triggerTileHighlight(idx) {
    const tile = document.getElementById(`blend-tile-${idx}`);
    if (!tile) return;
    tile.classList.add('tile-glow');
    setTimeout(() => tile.classList.remove('tile-glow'), 420);
}

window.animateAndBlendWord = function() {
    if (isBlendingRunning) return;
    isBlendingRunning = true;

    const lvl = getCurrentLevel();
    const wordObj = lvl.words[state.blenderWordIndex];
    const stepDelay = state.slowSpeech ? 440 : 300;

    wordObj.parts.forEach((_, idx) => {
        setTimeout(() => {
            triggerTileHighlight(idx);
            playSfx('pop');
        }, idx * stepDelay);
    });

    setTimeout(() => {
        wordObj.parts.forEach((_, idx) => {
            const t = document.getElementById(`blend-tile-${idx}`);
            if (t) t.classList.add('tile-glow');
        });
        speakWord(wordObj.word);
        state.blenderRevealMeaning = true;
        renderBlenderMeaningBox(wordObj);
        markWordAsRead(wordObj.word, true);

        setTimeout(() => {
            wordObj.parts.forEach((_, idx) => {
                const t = document.getElementById(`blend-tile-${idx}`);
                if (t) t.classList.remove('tile-glow');
            });
            isBlendingRunning = false;
            renderBlenderTab();
        }, 650);
    }, wordObj.parts.length * stepDelay + 100);
};

window.stepBlenderWord = function(delta) {
    const lvl = getCurrentLevel();
    state.blenderWordIndex = (state.blenderWordIndex + delta + lvl.words.length) % lvl.words.length;
    state.blenderRevealMeaning = false;
    renderBlenderTab();
};

/* ==========================================================================
   10. TAB 3: SPELLING BUILDER (LISTEN & BUILD WORD)
   ========================================================================== */
let spellState = {
    words: [],
    index: 0,
    chosenIndices: [],
    pool: [],
    solved: false
};

function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function startSpellingBuilder() {
    const lvl = getCurrentLevel();
    spellState = {
        words: shuffleArray(lvl.words).slice(0, 8),
        index: 0,
        chosenIndices: [],
        pool: [],
        solved: false
    };
    setupSpellingWord();
}

function setupSpellingWord() {
    const container = document.getElementById('spell-container');
    if (spellState.index >= spellState.words.length) {
        playSfx('fanfare');
        launchConfetti();
        awardCoins(15, 'אלופת הכתיבה! סיימת את סבב בניית המילים');
        container.innerHTML = `
            <div class="bg-gradient-to-b from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-3xl p-8 text-center animate-pop">
                <div class="text-6xl mb-3">✍️🏆</div>
                <h3 class="text-2xl font-black text-teal-900 mb-2">מדהים! בנית את כל המילים!</h3>
                <p class="text-sm text-slate-600 mb-6">קיבלת בונוס של +15 מטבעות ליתרה שלך 🪙</p>
                <div class="flex flex-wrap justify-center gap-3">
                    <button onclick="startSpellingBuilder()" class="bg-white border-2 border-teal-300 text-teal-800 font-bold px-6 py-3 rounded-2xl cursor-pointer">🔄 סבב חדש</button>
                    <button onclick="switchTab('quiz')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-3 rounded-2xl shadow-md cursor-pointer">🎯 עברי לחידון השלב!</button>
                </div>
            </div>
        `;
        return;
    }

    const target = spellState.words[spellState.index];
    const distractorPool = shuffleArray(Object.keys(LETTER_BANK).filter(k => k.length === 1 && !target.parts.includes(k))).slice(0, 2);
    spellState.pool = shuffleArray([...target.parts, ...distractorPool]);
    spellState.chosenIndices = [];
    spellState.solved = false;

    renderSpellingUI();
    setTimeout(() => speakWord(target.word), 260);
}

function renderSpellingUI() {
    const container = document.getElementById('spell-container');
    const target = spellState.words[spellState.index];

    const slotsHtml = target.parts.map((_, idx) => {
        const poolIdx = spellState.chosenIndices[idx];
        const filled = poolIdx !== undefined;
        const val = filled ? spellState.pool[poolIdx] : '';
        return `
            <button onclick="${filled && !spellState.solved ? `removeSpellLetter(${idx})` : ''}" class="en-text min-w-[66px] sm:min-w-[80px] h-[76px] sm:h-[88px] rounded-2xl border-3 text-4xl sm:text-5xl font-black flex items-center justify-center transition ${
                spellState.solved
                    ? 'bg-emerald-500 border-emerald-600 text-white animate-pop'
                    : filled
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800 cursor-pointer hover:bg-rose-50'
                        : 'bg-white border-dashed border-slate-300 text-slate-300'
            }">
                ${val || '_'}
            </button>
        `;
    }).join('');

    const poolHtml = spellState.pool.map((part, pIdx) => {
        const isUsed = spellState.chosenIndices.includes(pIdx);
        return `
            <button onclick="pickSpellLetter(${pIdx})" ${isUsed || spellState.solved ? 'disabled' : ''} class="en-text min-w-[62px] sm:min-w-[74px] h-[68px] sm:h-[78px] px-3 rounded-2xl border-2 text-3xl sm:text-4xl font-black transition ${
                isUsed
                    ? 'bg-slate-100 border-slate-200 text-slate-300 scale-90 cursor-default'
                    : 'bg-white hover:bg-amber-50 border-indigo-200 hover:border-amber-400 text-slate-800 shadow-xs active:scale-95 cursor-pointer'
            }">
                ${part}
            </button>
        `;
    }).join('');

    container.innerHTML = `
        <div class="flex items-center justify-between text-xs font-bold text-slate-500 mb-3">
            <span>מילה ${spellState.index + 1} מתוך ${spellState.words.length}</span>
            <span class="text-amber-600">+4 🪙 לכל מילה נכונה</span>
        </div>

        <div class="bg-slate-50/90 border-2 border-indigo-100 rounded-3xl p-5 sm:p-7 text-center">
            <h3 class="text-lg font-extrabold text-slate-800 mb-3">✍️ הקשיבי למילה והרכיבי אותה מהאותיות!</h3>

            <div class="flex items-center justify-center gap-4 my-3">
                <button onclick="speakWord('${target.word}')" class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg flex flex-col items-center justify-center transition active:scale-95 cursor-pointer">
                    <span class="text-3xl">🔊</span>
                    <span class="text-[11px] font-bold">שמעי</span>
                </button>
                <div class="bg-white border border-amber-200 px-5 py-3 rounded-2xl">
                    <div class="text-4xl">${target.emoji}</div>
                    <div class="text-base font-extrabold text-slate-800">${target.hebrew}</div>
                </div>
            </div>

            <!-- Answer Slots (LTR) -->
            <div class="flex items-center justify-center gap-2.5 sm:gap-3 my-6 flex-wrap" dir="ltr">
                ${slotsHtml}
            </div>

            <!-- Scrambled Letter Bank (LTR) -->
            <div class="flex items-center justify-center gap-2.5 flex-wrap pt-4 border-t border-slate-200" dir="ltr">
                ${poolHtml}
            </div>

            <!-- Feedback / Controls -->
            <div id="spell-feedback" class="mt-5 min-h-[48px] flex items-center justify-center gap-2">
                ${spellState.solved ? `
                    <button onclick="nextSpellingWord()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-2xl shadow-md cursor-pointer animate-pop">
                        🎉 מעולה! למילה הבאה ⬅️
                    </button>
                ` : `
                    <button onclick="clearSpellSlots()" class="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-200/70 px-4 py-2 rounded-xl cursor-pointer">נקה אותיות</button>
                    <button onclick="giveSpellHint()" class="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-xl cursor-pointer">💡 רמז לאות הראשונה</button>
                `}
            </div>
        </div>
    `;
}

window.pickSpellLetter = function(poolIdx) {
    if (spellState.solved) return;
    const target = spellState.words[spellState.index];
    if (spellState.chosenIndices.length >= target.parts.length) return;

    spellState.chosenIndices.push(poolIdx);
    speakPhonics(spellState.pool[poolIdx], false);

    // Check completion
    if (spellState.chosenIndices.length === target.parts.length) {
        const built = spellState.chosenIndices.map(i => spellState.pool[i]).join('');
        if (built === target.word) {
            spellState.solved = true;
            markWordAsRead(target.word, false);
            awardCoins(4);
            setTimeout(() => speakWord(target.word), 250);
        } else {
            playSfx('wrong');
            recordMistake(target.word);
            renderSpellingUI();
            const fb = document.getElementById('spell-feedback');
            fb.innerHTML = `<span class="text-rose-600 font-bold text-sm bg-rose-50 px-4 py-2 rounded-xl border border-rose-200 animate-shake">כמעט! נסי שוב – לחצי על אות כדי להסיר אותה 💪</span>`;
            return;
        }
    }
    renderSpellingUI();
};

window.removeSpellLetter = function(slotIdx) {
    spellState.chosenIndices.splice(slotIdx, 1);
    playSfx('pop');
    renderSpellingUI();
};

window.clearSpellSlots = function() {
    spellState.chosenIndices = [];
    renderSpellingUI();
};

window.giveSpellHint = function() {
    const target = spellState.words[spellState.index];
    const firstPart = target.parts[0];
    const idx = spellState.pool.indexOf(firstPart);
    if (idx !== -1) {
        spellState.chosenIndices = [idx];
        speakPhonics(firstPart, false);
        renderSpellingUI();
    }
};

window.nextSpellingWord = function() {
    spellState.index++;
    setupSpellingWord();
};

window.startSpellingBuilder = startSpellingBuilder;

/* ==========================================================================
   11. TAB 4: SMART MIXED QUIZ (+ MISTAKE PRACTICE 2x COINS MODE)
   ========================================================================== */
let quizState = {
    isMistakeMode: false,
    questions: [],
    currentIndex: 0,
    correctCount: 0,
    streakInQuiz: 0,
    answeredCurrent: false
};

function generateQuizQuestions(wordList, isDigraphLevel = false) {
    const words = shuffleArray(wordList);
    const allOtherWords = Object.values(ALL_WORDS_MAP).filter(w => !wordList.some(lw => lw.word === w.word));
    const lettersPool = Object.keys(LETTER_BANK).filter(k => k.length === (isDigraphLevel ? 2 : 1));
    const lvl = getCurrentLevel();
    const count = Math.min(6, Math.max(words.length, 4));
    const questions = [];

    for (let i = 0; i < count; i++) {
        const target = words[i % words.length];
        const type = (!isDigraphLevel && i === 3 && lvl.letters.length >= 4) ? 3 : (i % 3);

        if (type === 0) {
            const distractors = shuffleArray([...wordList.filter(w => w.word !== target.word), ...shuffleArray(allOtherWords).slice(0, 3)]);
            questions.push({
                type: 'listen',
                word: target.word,
                promptHe: 'הקשיבי למילה ובחרי איך כותבים אותה:',
                correctAnswer: target.word,
                options: shuffleArray([target.word, ...distractors.slice(0, 3).map(d => d.word)]),
                revealInfo: `${target.emoji} ${target.word} = ${target.hebrew}`
            });
        } else if (type === 1) {
            const distractors = shuffleArray([...wordList.filter(w => w.word !== target.word), ...shuffleArray(allOtherWords).slice(0, 3)]);
            questions.push({
                type: 'meaning',
                word: target.word,
                emoji: target.emoji,
                hebrew: target.hebrew,
                promptHe: 'איזו מילה באנגלית מתאימה לתמונה ולפירוש?',
                correctAnswer: target.word,
                options: shuffleArray([target.word, ...distractors.slice(0, 3).map(d => d.word)]),
                revealInfo: `${target.emoji} ${target.word} = ${target.hebrew}`
            });
        } else if (type === 2) {
            const startPart = target.parts[0];
            const distractorLetters = shuffleArray(lettersPool.filter(l => l !== startPart)).slice(0, 3);
            questions.push({
                type: 'startLetter',
                word: target.word,
                emoji: target.emoji,
                hebrew: target.hebrew,
                promptHe: 'הקשיבי למילה: באיזה צליל היא מתחילה?',
                correctAnswer: startPart,
                options: shuffleArray([startPart, ...distractorLetters]),
                revealInfo: `המילה ${target.word} מתחילה ב-"${startPart}"`
            });
        } else {
            // ABC Letter Name Recognition Question
            const targetLetter = lvl.letters[Math.floor(Math.random() * lvl.letters.length)];
            const info = LETTER_BANK[targetLetter];
            const distractorLetters = shuffleArray(lettersPool.filter(l => l !== targetLetter)).slice(0, 3);
            questions.push({
                type: 'abcName',
                letterKey: targetLetter,
                word: target.word,
                promptHe: 'הקשיבי לשם האות ב-ABC ובחרי את האות הנכונה:',
                correctAnswer: targetLetter.toUpperCase(),
                options: shuffleArray([targetLetter, ...distractorLetters]).map(l => l.toUpperCase()),
                revealInfo: `האות ${info.upper} (${info.lower}) נקראת "${info.hebrewName}"`
            });
        }
    }
    return questions;
}

function startQuiz(isMistakeMode = false) {
    const lvl = getCurrentLevel();
    let pool = lvl.words;
    if (isMistakeMode) {
        pool = state.mistakes.map(w => ALL_WORDS_MAP[w]).filter(Boolean);
        if (!pool.length) {
            showToast('בנק החיזוק ריק! כל הכבוד 🌟', '🎉');
            return;
        }
    }
    quizState = {
        isMistakeMode,
        questions: generateQuizQuestions(pool, !isMistakeMode && lvl.id === 6),
        currentIndex: 0,
        correctCount: 0,
        streakInQuiz: 0,
        answeredCurrent: false
    };
    renderQuizQuestion();
}

window.startQuiz = startQuiz;

window.startMistakePractice = function() {
    if (!state.mistakes.length) {
        showToast('אין מילים בבנק החיזוק כרגע!', '✨');
        return;
    }
    state.currentTab = 'quiz';
    hideAllTabPanels();
    document.getElementById('tab-quiz').classList.remove('hidden');
    startQuiz(true);
};

function renderQuizQuestion() {
    const container = document.getElementById('quiz-container');
    const q = quizState.questions[quizState.currentIndex];
    if (!q) {
        renderQuizSummary();
        return;
    }

    quizState.answeredCurrent = false;
    const total = quizState.questions.length;
    const dotsHtml = quizState.questions.map((_, idx) => {
        const cls = idx < quizState.currentIndex ? 'bg-emerald-500' : idx === quizState.currentIndex ? 'bg-indigo-600 scale-125' : 'bg-slate-200';
        return `<div class="w-3 h-3 rounded-full transition-all ${cls}"></div>`;
    }).join('');

    let stimulusHtml = '';
    if (q.type === 'listen') {
        stimulusHtml = `
            <button onclick="speakWord('${q.word}')" class="mx-auto my-4 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg flex flex-col items-center justify-center transition active:scale-95 cursor-pointer">
                <span class="text-4xl">🔊</span>
                <span class="text-xs font-bold mt-1">שמעי שוב</span>
            </button>
        `;
    } else if (q.type === 'abcName') {
        stimulusHtml = `
            <button onclick="speakLetterName('${q.letterKey}')" class="mx-auto my-4 w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg flex flex-col items-center justify-center transition active:scale-95 cursor-pointer">
                <span class="text-4xl">🔤</span>
                <span class="text-xs font-bold mt-1">שמעי שם</span>
            </button>
        `;
    } else if (q.type === 'meaning') {
        stimulusHtml = `
            <div class="my-4 inline-flex flex-col items-center bg-amber-50 border-2 border-amber-200 px-8 py-4 rounded-3xl">
                <span class="text-5xl mb-1">${q.emoji}</span>
                <span class="text-2xl font-extrabold text-slate-800">${q.hebrew}</span>
            </div>
        `;
    } else {
        stimulusHtml = `
            <div class="my-4 flex items-center justify-center gap-4">
                <button onclick="speakWord('${q.word}')" class="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-md flex flex-col items-center justify-center transition active:scale-95 cursor-pointer">
                    <span class="text-3xl">🔊</span>
                    <span class="text-[11px] font-bold">השמע</span>
                </button>
                <div class="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-right">
                    <div class="text-3xl">${q.emoji}</div>
                    <div class="text-sm font-bold text-slate-600">${q.hebrew}</div>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        ${quizState.isMistakeMode ? `<div class="mb-3 bg-rose-100 text-rose-800 text-xs font-black px-4 py-2 rounded-2xl text-center">🎯 תרגול בנק החיזוק – כל תשובה נכונה שווה 10 מטבעות (2x)! 🪙</div>` : ''}
        <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-bold text-slate-500">שאלה ${quizState.currentIndex + 1} מתוך ${total}</span>
            <div class="flex items-center gap-2">${dotsHtml}</div>
        </div>

        <div class="bg-slate-50/90 border-2 border-indigo-100 rounded-3xl p-5 sm:p-7 text-center">
            <h3 class="text-lg sm:text-xl font-extrabold text-slate-800">${q.promptHe}</h3>
            ${stimulusHtml}

            <div class="grid grid-cols-2 gap-3 sm:gap-4 mt-5" dir="ltr">
                ${q.options.map(opt => `
                    <button onclick="handleQuizAnswer(this, '${opt}')" class="en-text bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-400 rounded-2xl py-4 sm:py-5 px-4 text-3xl sm:text-4xl font-black text-slate-800 shadow-xs transition active:scale-95 cursor-pointer">
                        ${opt}
                    </button>
                `).join('')}
            </div>
            <div id="quiz-feedback" class="mt-5 min-h-[56px] flex items-center justify-center"></div>
        </div>
    `;

    if (q.type === 'listen' || q.type === 'startLetter') {
        setTimeout(() => speakWord(q.word), 260);
    } else if (q.type === 'abcName') {
        setTimeout(() => speakLetterName(q.letterKey), 260);
    }
}

window.handleQuizAnswer = function(btnEl, chosen) {
    if (quizState.answeredCurrent) return;
    const q = quizState.questions[quizState.currentIndex];
    const fb = document.getElementById('quiz-feedback');

    if (chosen === q.correctAnswer) {
        quizState.answeredCurrent = true;
        quizState.correctCount++;
        quizState.streakInQuiz++;

        const baseCoins = quizState.isMistakeMode ? 10 : 5;
        let bonus = 0;
        if (quizState.streakInQuiz > 0 && quizState.streakInQuiz % 3 === 0) {
            bonus = 10;
            showToast('בונוס רצף 3 תשובות נכונות! +10 🪙', '🔥');
        }
        awardCoins(baseCoins + bonus);
        markWordAsRead(q.word, false);

        // If in mistake bank mode, remove mastered word!
        if (quizState.isMistakeMode) {
            state.mistakes = state.mistakes.filter(w => w !== q.word);
            updateHeaderUI();
            scheduleSave();
        }

        btnEl.classList.remove('bg-white', 'border-slate-200', 'text-slate-800');
        btnEl.classList.add('bg-emerald-500', 'border-emerald-600', 'text-white', 'animate-pop');
        setTimeout(() => speakWord(q.word), 220);

        fb.innerHTML = `
            <div class="flex flex-col sm:flex-row items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3 rounded-2xl w-full justify-between animate-pop">
                <div class="font-bold text-sm">🎉 מעולה! <span class="font-normal">(${q.revealInfo})</span></div>
                <button onclick="nextQuizQuestion()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2 rounded-xl text-sm cursor-pointer shrink-0">לשאלה הבאה ⬅️</button>
            </div>
        `;
    } else {
        quizState.streakInQuiz = 0;
        playSfx('wrong');
        recordMistake(q.word);
        btnEl.classList.add('animate-shake', 'bg-rose-50', 'border-rose-300', 'text-rose-500', 'opacity-65');
        btnEl.disabled = true;
        fb.innerHTML = `<div class="text-rose-600 font-bold text-sm bg-rose-50 px-4 py-2 rounded-xl border border-rose-200">כמעט! נסי שוב 💪 (שמרתי את המילה לבנק החיזוק)</div>`;
    }
};

window.nextQuizQuestion = function() {
    quizState.currentIndex++;
    renderQuizQuestion();
};

function renderQuizSummary() {
    const lvl = getCurrentLevel();
    const container = document.getElementById('quiz-container');

    if (!quizState.isMistakeMode) {
        if (!state.completedLevels.includes(lvl.id)) {
            state.completedLevels.push(lvl.id);
            awardCoins(25, `סיימת את ${lvl.shortName}!`);
        } else {
            awardCoins(10, `בונוס חזרה על ${lvl.shortName}`);
        }
    } else {
        awardCoins(15, 'בונוס סיום בנק החיזוק!');
    }

    updateHeaderUI();
    renderLevelSelector();
    renderLevelHeader();
    playSfx('fanfare');
    launchConfetti();

    const nextLevel = LEVELS.find(l => l.id === lvl.id + 1);

    container.innerHTML = `
        <div class="bg-gradient-to-b from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-3xl p-7 sm:p-10 text-center animate-pop">
            <div class="text-6xl mb-3">🏆🪙</div>
            <h3 class="text-2xl sm:text-3xl font-black text-indigo-900 mb-2">
                ${quizState.isMistakeMode ? 'כל הכבוד! חיזקת את המילים הקשות!' : `אלופה! סיימת את ${lvl.shortName}!`}
            </h3>
            <p class="text-slate-600 font-medium mb-6">המטבעות נוספו לבנק האנגלית שלך! בדקי מה אפשר לקנות בחנות הפרסים 🛍️</p>

            <div class="flex flex-wrap items-center justify-center gap-3">
                <button onclick="startQuiz(false)" class="bg-white hover:bg-slate-100 border-2 border-indigo-200 text-indigo-700 font-bold px-6 py-3 rounded-2xl cursor-pointer">🔄 שחקי שוב</button>
                ${nextLevel && !quizState.isMistakeMode ? `
                    <button onclick="selectLevel(${nextLevel.id})" class="bg-gradient-to-l from-indigo-600 to-purple-600 text-white font-extrabold px-7 py-3 rounded-2xl shadow-lg cursor-pointer">
                        קדימה ל${nextLevel.shortName}! 🚀
                    </button>
                ` : `
                    <button onclick="openShopModal('app')" class="bg-gradient-to-l from-pink-500 to-purple-600 text-white font-extrabold px-7 py-3 rounded-2xl shadow-lg cursor-pointer">
                        🛍️ לחנות הפרסים!
                    </button>
                `}
            </div>
        </div>
    `;
}

/* ==========================================================================
   12. LEVEL 7: SENTENCE READING STUDIO (12 FUN SENTENCES)
   ========================================================================== */
function renderSentencesLevel() {
    const lvl = LEVELS.find(l => l.id === 7);
    const container = document.getElementById('tab-sentences');

    const cardsHtml = lvl.sentences.map((s, idx) => {
        const isRead = state.readSentences.includes(s.id);
        const wordsHtml = s.text.split(' ').map(w => `
            <button onclick="speakWord('${w.replace(/[^a-zA-Z]/g, '')}')" class="en-text px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-amber-100 text-indigo-900 font-black text-xl sm:text-2xl transition active:scale-95 cursor-pointer">
                ${w}
            </button>
        `).join('');

        return `
            <div class="rounded-3xl p-5 border-2 transition ${isRead ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-indigo-100 shadow-xs'}">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-extrabold text-slate-400">משפט #${idx + 1}</span>
                    <span class="text-2xl">${s.emoji}</span>
                </div>

                <!-- Clickable Word-by-Word Sentence -->
                <div class="flex flex-wrap gap-2 justify-center py-3" dir="ltr">
                    ${wordsHtml}
                </div>

                <!-- Collapsible Hebrew Translation -->
                <div id="sent-he-${s.id}" class="hidden text-center text-sm font-bold text-slate-600 bg-amber-50 border border-amber-200 rounded-xl py-2 px-3 my-2 animate-pop">
                    ${s.hebrew}
                </div>

                <div class="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button onclick="speakWord('${s.text}')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer transition active:scale-95">
                        🔊 קרא משפט מלא
                    </button>
                    <button onclick="toggleSentenceTranslation('${s.id}')" class="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer transition">
                        👀 תרגום לעברית
                    </button>
                    <button onclick="markSentenceRead('${s.id}')" class="${isRead ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-teal-600 hover:bg-teal-700 text-white'} font-extrabold text-xs sm:text-sm px-4 py-2 rounded-xl cursor-pointer transition active:scale-95">
                        ${isRead ? '✓ קראתי!' : 'קראתי לבד! (+5 🪙)'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
                <h3 class="text-xl font-black text-slate-800">📖 קוראים משפטים אמיתיים באנגלית!</h3>
                <p class="text-sm text-slate-500">לחצי על כל מילה בנפרד אם את צריכה עזרה, או קראי בקול וסמני "קראתי לבד!" כדי להרוויח <strong class="text-amber-600">+5 🪙</strong> למשפט.</p>
            </div>
            <div class="bg-indigo-50 text-indigo-800 font-extrabold text-sm px-4 py-2 rounded-2xl shrink-0">
                הושלמו: ${state.readSentences.length} / ${lvl.sentences.length}
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${cardsHtml}
        </div>
    `;
}

window.toggleSentenceTranslation = function(id) {
    const el = document.getElementById(`sent-he-${id}`);
    if (el) el.classList.toggle('hidden');
};

window.markSentenceRead = function(id) {
    if (!state.readSentences.includes(id)) {
        state.readSentences.push(id);
        awardCoins(5, 'כל הכבוד על קריאת המשפט!');
        if (state.readSentences.length >= 6 && !state.completedLevels.includes(7)) {
            state.completedLevels.push(7);
            awardCoins(25, 'סיימת את שלב המשפטים!');
            launchConfetti();
            playSfx('fanfare');
        }
        renderLevelSelector();
        renderLevelHeader();
        renderSentencesLevel();
    } else {
        showToast('כבר קראת את המשפט הזה! 🌟', '✅');
    }
};

/* ==========================================================================
   13. TAB 5: MISTAKE BANK & b/d/p/q RAPID CHALLENGE
   ========================================================================== */
const BD_QUESTIONS_POOL = [
    { mode: 'sound', target: 'b', word: 'bat', hebrew: 'עטלף', emoji: '🦇', prompt: 'איזו אות מתחילה את המילה?' },
    { mode: 'sound', target: 'd', word: 'dog', hebrew: 'כלב', emoji: '🐶', prompt: 'איזו אות מתחילה את המילה?' },
    { mode: 'sound', target: 'p', word: 'pig', hebrew: 'חזיר', emoji: '🐷', prompt: 'איזו אות מתחילה את המילה?' },
    { mode: 'sound', target: 'q', word: 'queen', hebrew: 'מלכה', emoji: '👑', prompt: 'איזו אות מתחילה את המילה?' },
    { mode: 'sound', target: 'b', word: 'bed', hebrew: 'מיטה', emoji: '🛏️', prompt: 'איזו אות מתחילה את המילה?' },
    { mode: 'sound', target: 'd', word: 'dad', hebrew: 'אבא', emoji: '👨', prompt: 'איזו אות מתחילה את המילה?' },
    { mode: 'sound', target: 'p', word: 'pan', hebrew: 'מחבת', emoji: '🍳', prompt: 'איזו אות מתחילה את המילה?' },
    { mode: 'sound', target: 'b', word: 'bus', hebrew: 'אוטובוס', emoji: '🚌', prompt: 'איזו אות מתחילה את המילה?' },
    { mode: 'match', target: 'b', upper: 'B', prompt: 'מצאי את האות הקטנה של:' },
    { mode: 'match', target: 'd', upper: 'D', prompt: 'מצאי את האות הקטנה של:' },
    { mode: 'match', target: 'p', upper: 'P', prompt: 'מצאי את האות הקטנה של:' },
    { mode: 'match', target: 'q', upper: 'Q', prompt: 'מצאי את האות הקטנה של:' }
];

let bdGame = { questions: [], index: 0, score: 0, locked: false };

function renderChallengesTab() {
    // Render Mistake Bank
    const mContainer = document.getElementById('mistake-bank-content');
    const mBtn = document.getElementById('btn-start-mistake-quiz');
    if (!state.mistakes.length) {
        mBtn.classList.add('hidden');
        mContainer.innerHTML = `
            <div class="bg-white/80 rounded-2xl p-4 text-center text-sm font-bold text-emerald-700 border border-emerald-200">
                🌟 בנק החיזוק ריק כרגע! אין לך מילים שטעית בהן – עבודה נהדרת!
            </div>
        `;
    } else {
        mBtn.classList.remove('hidden');
        mContainer.innerHTML = `
            <div class="flex flex-wrap gap-2" dir="ltr">
                ${state.mistakes.map(w => {
                    const obj = ALL_WORDS_MAP[w];
                    return `
                        <button onclick="speakWord('${w}')" class="bg-white hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-2xs cursor-pointer transition">
                            <span>${obj ? obj.emoji : '🔤'}</span>
                            <span class="en-text font-black text-rose-900">${w}</span>
                            <span class="font-hebrew text-xs text-slate-500" dir="rtl">${obj ? obj.hebrew : ''}</span>
                            <span class="text-xs">🔊</span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Render b/d/p/q Start
    document.getElementById('bd-best-score').textContent = `${state.bdBestScore} / 10`;
    renderBdStartScreen();
}

function renderBdStartScreen() {
    document.getElementById('bd-game-area').innerHTML = `
        <h4 class="text-lg font-extrabold text-slate-800 mb-1">⚡ אתגר 10 השאלות המהיר</h4>
        <p class="text-xs sm:text-sm text-slate-500 mb-4">כל תשובה נכונה מזכה ב-3 מטבעות 🪙!</p>
        <button onclick="startBdGame()" class="bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold px-7 py-3 rounded-2xl shadow-md cursor-pointer transition active:scale-95">
            🚀 התחילי אתגר b / d / p / q
        </button>
    `;
}

window.startBdGame = function() {
    bdGame = {
        questions: shuffleArray(BD_QUESTIONS_POOL).slice(0, 10),
        index: 0,
        score: 0,
        locked: false
    };
    renderBdQuestion();
};

function renderBdQuestion() {
    const area = document.getElementById('bd-game-area');
    if (bdGame.index >= bdGame.questions.length) {
        if (bdGame.score > state.bdBestScore) {
            state.bdBestScore = bdGame.score;
            scheduleSave();
        }
        document.getElementById('bd-best-score').textContent = `${state.bdBestScore} / 10`;
        if (bdGame.score >= 8) {
            playSfx('fanfare');
            launchConfetti();
            awardCoins(15, 'אלופת ה-b/d/p/q!');
        }
        area.innerHTML = `
            <div class="py-3 animate-pop">
                <div class="text-5xl mb-2">${bdGame.score >= 8 ? '👑' : '🌟'}</div>
                <h4 class="text-2xl font-black text-teal-900">סיימת עם ${bdGame.score} מתוך 10!</h4>
                <button onclick="startBdGame()" class="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-6 py-2.5 rounded-2xl cursor-pointer">🔄 שחקי שוב</button>
            </div>
        `;
        return;
    }

    bdGame.locked = false;
    const q = bdGame.questions[bdGame.index];
    const options = shuffleArray(['b', 'd', 'p', 'q']);

    const visual = q.mode === 'sound'
        ? `<div class="flex items-center justify-center gap-4 my-3">
                <button onclick="speakWord('${q.word}')" class="w-16 h-16 rounded-full bg-teal-600 text-white shadow flex items-center justify-center text-2xl cursor-pointer">🔊</button>
                <div class="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
                    <div class="text-3xl">${q.emoji}</div>
                    <div class="text-xs font-bold text-slate-700">${q.hebrew}</div>
                </div>
           </div>`
        : `<div class="my-3 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200 en-text text-5xl font-black text-teal-800">${q.upper}</div>`;

    area.innerHTML = `
        <div class="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>שאלה ${bdGame.index + 1} / 10</span>
            <span class="text-teal-700">ניקוד: ${bdGame.score}</span>
        </div>
        <div class="font-extrabold text-slate-800">${q.prompt}</div>
        ${visual}
        <div class="grid grid-cols-4 gap-3 max-w-md mx-auto mt-4" dir="ltr">
            ${options.map(opt => `
                <button onclick="answerBdQuestion(this, '${opt}')" class="en-text bg-slate-50 hover:bg-teal-50 border-2 border-slate-200 hover:border-teal-400 rounded-2xl py-3.5 text-4xl font-black text-slate-800 cursor-pointer transition active:scale-95">${opt}</button>
            `).join('')}
        </div>
        <div id="bd-feedback" class="mt-3 min-h-[26px] text-sm font-bold"></div>
    `;

    setTimeout(() => q.mode === 'sound' ? speakWord(q.word) : speakPhonics(q.target, false), 220);
}

window.answerBdQuestion = function(btnEl, chosen) {
    if (bdGame.locked) return;
    bdGame.locked = true;
    const q = bdGame.questions[bdGame.index];
    const fb = document.getElementById('bd-feedback');

    if (chosen === q.target) {
        bdGame.score++;
        awardCoins(3);
        btnEl.classList.add('bg-emerald-500', 'border-emerald-600', 'text-white', 'animate-pop');
        fb.innerHTML = `<span class="text-emerald-700">✨ בול! (+3 🪙)</span>`;
    } else {
        playSfx('wrong');
        btnEl.classList.add('bg-rose-100', 'border-rose-400', 'text-rose-600', 'animate-shake');
        fb.innerHTML = `<span class="text-rose-600">התשובה הנכונה: <strong class="en-text text-lg text-slate-900 mx-1">${q.target}</strong></span>`;
    }

    setTimeout(() => {
        bdGame.index++;
        renderBdQuestion();
    }, 1050);
};

/* ==========================================================================
   14. REWARDS SHOP MODAL (APP ITEMS + CUSTOM PARENT REWARDS)
   ========================================================================== */
window.openShopModal = function(tab = 'app') {
    state.shopTab = tab;
    document.getElementById('shop-modal').classList.remove('hidden');
    renderShopContent();
    if (tab === 'parent') loadRewards();
};

window.closeShopModal = function() {
    document.getElementById('shop-modal').classList.add('hidden');
};

window.switchShopTab = function(tab) {
    state.shopTab = tab;
    renderShopContent();
    if (tab === 'parent') loadRewards();
};

function renderShopContent() {
    document.getElementById('shop-balance').textContent = `${state.coins} 🪙`;

    const tabApp = document.getElementById('shop-tab-app');
    const tabParent = document.getElementById('shop-tab-parent');
    tabApp.className = `px-4 py-2.5 rounded-t-2xl font-extrabold text-sm transition cursor-pointer ${state.shopTab === 'app' ? 'bg-white text-indigo-700 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-800'}`;
    tabParent.className = `px-4 py-2.5 rounded-t-2xl font-extrabold text-sm transition cursor-pointer ${state.shopTab === 'parent' ? 'bg-white text-pink-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-800'}`;

    const body = document.getElementById('shop-body');

    if (state.shopTab === 'app') {
        body.innerHTML = `
            <div class="space-y-6">
                <!-- Avatars -->
                <div>
                    <h3 class="font-black text-slate-800 mb-2.5">👧 דמויות (אווטארים)</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        ${SHOP_AVATARS.map(item => renderShopItemCard(item, 'avatar')).join('')}
                    </div>
                </div>

                <!-- Pets -->
                <div>
                    <h3 class="font-black text-slate-800 mb-2.5">🐾 חיות מחמד מעודדות</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        ${SHOP_PETS.map(item => renderShopItemCard(item, 'pet')).join('')}
                    </div>
                </div>

                <!-- Themes -->
                <div>
                    <h3 class="font-black text-slate-800 mb-2.5">🎨 ערכות צבעים לאתר</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        ${SHOP_THEMES.map(item => renderShopItemCard(item, 'theme')).join('')}
                    </div>
                </div>
            </div>
        `;
    } else {
        if (!state.rewardsLoaded) {
            body.innerHTML = `<div class="text-center text-slate-500 font-bold py-10">טוען את הפרסים... ⏳</div>`;
            return;
        }
        const pending = state.redemptions.filter(r => r.status === 'pending');
        const history = state.redemptions.filter(r => r.status !== 'pending').slice(0, 8);
        const formatDate = (iso) => {
            try { return new Date(iso).toLocaleDateString('he-IL'); } catch (e) { return ''; }
        };
        body.innerHTML = `
            <div class="space-y-5">
                <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-950">
                    <strong>🎁 איך זה עובד?</strong> ההורים מגדירים כאן פרסים אמיתיים! כשצברת מספיק מטבעות, לחצי על <strong>"מימשתי פרס!"</strong> – הפרס יחכה כאן עד שההורים יסמנו שקיבלת אותו.
                </div>

                ${pending.length ? `
                    <div class="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4">
                        <h4 class="font-extrabold text-sm text-sky-900 mb-2">⏳ מחכה להורים</h4>
                        <div class="space-y-1.5">
                            ${pending.map(p => `
                                <div class="flex justify-between items-center text-xs sm:text-sm bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-sky-950 font-bold">
                                    <span>🎁 ${escapeHtml(p.title)} (${Number(p.cost)} 🪙)</span>
                                    <span class="text-sky-700 font-medium">${formatDate(p.requestedAt)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Parent Rewards List -->
                <div class="space-y-3">
                    ${state.parentRewards.length ? state.parentRewards.map(r => {
                        const cost = Number(r.cost) || 1;
                        const canAfford = state.coins >= cost;
                        const pct = Math.min(100, Math.round((state.coins / cost) * 100));
                        return `
                            <div class="bg-white border-2 ${canAfford ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'} rounded-2xl p-4">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div class="flex-1">
                                        <div class="font-extrabold text-slate-800 text-base">${escapeHtml(r.title)}</div>
                                        <div class="text-xs font-bold text-amber-700 mt-0.5">מחיר: ${cost} 🪙 (התקדמות: ${pct}%)</div>
                                        <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                                            <div class="h-full ${canAfford ? 'bg-emerald-500' : 'bg-amber-400'} rounded-full" style="width: ${pct}%"></div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2 shrink-0">
                                        <button onclick="redeemParentReward('${escapeHtml(r.id)}')" ${!canAfford ? 'disabled' : ''} class="px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition ${canAfford ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}">
                                            ${canAfford ? '🎉 מימשתי פרס!' : `חסרים ${cost - state.coins} 🪙`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('') : `<div class="text-center text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-6">עוד אין פרסים. בקשי מההורים להוסיף פרסים באזור ההורים 🎁</div>`}
                </div>

                <!-- Redemption History -->
                ${history.length ? `
                    <div>
                        <h4 class="font-extrabold text-sm text-slate-700 mb-2">📜 היסטוריית פרסים</h4>
                        <div class="space-y-1.5">
                            ${history.map(h => `
                                <div class="flex justify-between items-center text-xs ${h.status === 'fulfilled' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'} border rounded-xl px-3.5 py-2 font-medium">
                                    <span>${h.status === 'fulfilled' ? '🎉' : '↩️'} ${escapeHtml(h.title)} (${Number(h.cost)} 🪙)${h.status === 'cancelled' ? ' – בוטל, המטבעות הוחזרו' : ''}</span>
                                    <span>${formatDate(h.resolvedAt || h.requestedAt)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

function renderShopItemCard(item, category) {
    const owned = state.ownedItems.includes(item.id);
    const equipped =
        (category === 'avatar' && state.equippedAvatar === item.id) ||
        (category === 'pet' && state.equippedPet === item.id) ||
        (category === 'theme' && state.equippedTheme === item.id);
    const canAfford = state.coins >= item.cost;

    const visual = category === 'theme'
        ? `<div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${item.preview} flex items-center justify-center text-2xl mx-auto mb-2 shadow">${item.icon}</div>`
        : `<div class="text-4xl mb-2">${item.emoji}</div>`;

    let btnHtml = '';
    if (equipped) {
        btnHtml = `<span class="block w-full py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">✓ פעיל עכשיו</span>`;
    } else if (owned) {
        btnHtml = `<button onclick="equipShopItem('${item.id}', '${category}')" class="w-full py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-extrabold cursor-pointer">בחרי</button>`;
    } else {
        btnHtml = `<button onclick="buyShopItem('${item.id}', '${category}', ${item.cost})" ${!canAfford ? 'disabled' : ''} class="w-full py-1.5 rounded-xl text-xs font-extrabold transition ${canAfford ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}">קני ב-${item.cost} 🪙</button>`;
    }

    return `
        <div class="bg-slate-50 border-2 ${equipped ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200'} rounded-2xl p-3 text-center flex flex-col justify-between">
            <div>
                ${visual}
                <div class="font-extrabold text-xs sm:text-sm text-slate-800 mb-2">${item.name}</div>
            </div>
            ${btnHtml}
        </div>
    `;
}

window.buyShopItem = function(id, category, cost) {
    if (state.coins < cost) return;
    state.coins -= cost;
    state.ownedItems.push(id);
    equipShopItem(id, category, false);
    playSfx('fanfare');
    launchConfetti();
    showToast('תתחדשי! הרכישה הושלמה 🎉', '🛍️');
    updateHeaderUI();
    renderShopContent();
    scheduleSave();
};

window.equipShopItem = function(id, category, withFeedback = true) {
    if (category === 'avatar') state.equippedAvatar = id;
    if (category === 'pet') state.equippedPet = id;
    if (category === 'theme') {
        state.equippedTheme = id;
        applyTheme();
    }
    if (withFeedback) playSfx('pop');
    updateHeaderUI();
    renderShopContent();
    scheduleSave();
};

let redeemInProgress = false;
window.redeemParentReward = async function(id) {
    const reward = state.parentRewards.find(r => r.id === id);
    if (!reward || state.coins < reward.cost || redeemInProgress) return;
    if (dirtyWhileOffline) {
        showToast('אין חיבור לשרת כרגע, נסי שוב עוד רגע', '⚠️');
        return;
    }
    redeemInProgress = true;
    try {
        await flushSaves(); // the server must see our latest coins first
        const res = await fetchWithTimeout(API_REDEEM, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rewardId: id })
        });
        if (res.status === 401) return handleLoggedOut();
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            showToast(json.message || 'לא הצלחנו לממש את הפרס', '⚠️');
            return;
        }
        state.coins = Number(json.coins) || 0;
        serverVersion = Number(json.version) || serverVersion;
        saveLocalBackup();
        playSfx('fanfare');
        launchConfetti();
        showToast(`יש! מימשת את הפרס: ${reward.title} – עכשיו מחכים להורים`, '🎁');
        updateHeaderUI();
        await loadRewards();
    } catch (err) {
        showToast('לא הצלחנו לממש את הפרס, נסי שוב', '⚠️');
    } finally {
        redeemInProgress = false;
        renderShopContent();
    }
};

/* ==========================================================================
   15. VOICE SELECTOR MODAL
   ========================================================================== */
window.openVoiceModal = function() {
    initVoices();
    const list = document.getElementById('voice-list');
    if (!availableEnglishVoices.length) {
        list.innerHTML = `<div class="text-sm text-slate-500 text-center py-4">משתמש בקול ברירת המחדל של הדפדפן</div>`;
    } else {
        list.innerHTML = availableEnglishVoices.slice(0, 12).map(v => {
            const isSel = selectedVoice && selectedVoice.name === v.name;
            return `
                <button onclick="selectEnglishVoice('${v.name.replace(/'/g, "\\'")}')" class="w-full text-right px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition ${isSel ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'}">
                    <span class="en-text truncate">${v.name}</span>
                    <span class="text-[11px] text-slate-400 shrink-0 mr-2">${v.lang} ${isSel ? '✓' : ''}</span>
                </button>
            `;
        }).join('');
    }
    document.getElementById('voice-modal').classList.remove('hidden');
};

window.closeVoiceModal = function() {
    document.getElementById('voice-modal').classList.add('hidden');
};

window.selectEnglishVoice = function(voiceName) {
    const match = availableEnglishVoices.find(v => v.name === voiceName);
    if (match) {
        selectedVoice = match;
        state.preferredVoiceName = match.name;
        scheduleSave();
        openVoiceModal();
        speakWord('Great choice!');
    }
};

/* ==========================================================================
   16. FULL ABC BOARD MODAL (A-Z)
   ========================================================================== */
window.openAbcModal = function() {
    document.getElementById('abc-modal').classList.remove('hidden');
    renderAbcBoard();
};

window.closeAbcModal = function() {
    document.getElementById('abc-modal').classList.add('hidden');
};

window.setAbcBoardMode = function(mode) {
    state.abcBoardMode = mode;
    playSfx('pop');
    renderAbcBoard();
};

function renderAbcBoard() {
    const btnName = document.getElementById('abc-mode-name');
    const btnSound = document.getElementById('abc-mode-sound');

    btnName.className = `px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
        state.abcBoardMode === 'name'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50'
    }`;
    btnSound.className = `px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
        state.abcBoardMode === 'sound'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50'
    }`;

    const grid = document.getElementById('abc-board-grid');
    grid.innerHTML = ALPHABET_ORDER.map(key => {
        const info = LETTER_BANK[key];
        const isLearned = state.learnedLetters.includes(key);
        const subLabel = state.abcBoardMode === 'name' ? info.hebrewName : info.hebrewSound.split(' ')[0];
        const accentCls = state.abcBoardMode === 'name'
            ? 'hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700'
            : 'hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700';

        return `
            <button onclick="tapAbcTile(this, '${key}')" class="relative bg-white border-2 ${isLearned ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'} ${accentCls} rounded-2xl p-3 flex flex-col items-center justify-center shadow-2xs transition active:scale-95 cursor-pointer">
                ${isLearned ? `<span class="absolute top-1.5 right-1.5 text-[10px] bg-emerald-500 text-white w-4 h-4 rounded-full flex items-center justify-center font-black">✓</span>` : ''}
                <div class="en-text text-2xl sm:text-3xl font-black leading-none">
                    <span class="text-slate-400">${info.upper}</span><span>${info.lower}</span>
                </div>
                <div class="font-hebrew text-xs font-extrabold mt-1.5 px-2 py-0.5 rounded-lg ${state.abcBoardMode === 'name' ? 'bg-indigo-100 text-indigo-900' : 'bg-emerald-100 text-emerald-900'}" dir="rtl">
                    ${subLabel}
                </div>
            </button>
        `;
    }).join('');
}

window.tapAbcTile = function(btnEl, key) {
    btnEl.classList.add('animate-pop');
    setTimeout(() => btnEl.classList.remove('animate-pop'), 350);
    if (state.abcBoardMode === 'name') {
        speakLetterName(key);
    } else {
        speakPhonics(key, true);
    }
};

/* ==========================================================================
   18. APP BOOTSTRAP (page is only served to a logged-in student)
   ========================================================================== */
function bootstrapApp() {
    initVoices();
    document.getElementById('app-wrapper').classList.remove('hidden');
    initCloudStorage();
    const firstOpenLevel = LEVELS.find(l => !state.completedLevels.includes(l.id));
    selectLevel(firstOpenLevel ? firstOpenLevel.id : 1);
    renderPlacementBanner();
    if (!moduleOn('daily')) {
        const dailyBtn = document.getElementById('daily-header-btn');
        if (dailyBtn) dailyBtn.remove();
    }
    showToast(`שלום ${CURRENT_USER.displayName}! 🌟`, '👋');
    loadNotices();
    setInterval(() => { if (document.visibilityState === 'visible') loadNotices(); }, 60000);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
    bootstrapApp();
}

// Flush unsaved progress if the tab is hidden/closed; resync when it comes back
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && cloudReady && (hasUnsavedChanges || dirtyWhileOffline)) {
        pushProgress({ keepalive: true });
    } else if (document.visibilityState === 'visible') {
        pollServerOnce();
    }
});

export {};
