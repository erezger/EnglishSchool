/* Static body markup ported from the original single-file app. */
export const LEGACY_MARKUP = String.raw`

    <!-- Celebration Confetti Canvas -->
    <canvas id="confetti-canvas"></canvas>

    <!-- Toast Notification Banner -->
    <div id="toast-container" class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 opacity-0 translate-y-4">
        <div class="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm sm:text-base flex items-center gap-2 border border-slate-700">
            <span id="toast-icon">✨</span>
            <span id="toast-text">הודעה</span>
        </div>
    </div>

    <!-- MAIN APP WRAPPER -->
    <div id="app-wrapper" class="hidden max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6 pb-20">

        <!-- TOP DASHBOARD HEADER -->
        <header class="bg-white/95 backdrop-blur-md rounded-3xl shadow-md border border-indigo-100/80 p-4 sm:p-5 mb-5">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                <!-- Brand + Active Girl Profile, Avatar & Switch Button -->
                <div class="flex items-center gap-3.5">
                    <button onclick="openShopModal('app')" class="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-3xl shadow-md hover:scale-105 transition cursor-pointer shrink-0" title="החליפי דמות בחנות">
                        <span id="header-avatar">👧🏻</span>
                        <span id="header-pet" class="absolute -bottom-1.5 -left-1.5 bg-white rounded-full w-7 h-7 flex items-center justify-center text-base shadow border border-slate-200 animate-bounce-soft" title="חיית המחמד שלך">🐶</span>
                    </button>
                    <div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <h1 class="text-xl sm:text-2xl font-black bg-gradient-to-l from-indigo-700 to-purple-600 bg-clip-text text-transparent">
                                שלום, <span id="header-profile-name"></span>!
                            </h1>
                            <button onclick="switchUser()" class="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer">
                                🔄 החלפת משתמש
                            </button>
                            <span id="save-status-badge" class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                נשמר ✓
                            </span>
                        </div>
                        <p class="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                            לומדים שמות אותיות, צלילים, קוראים מהר וצוברים כסף לפרסים! 🚀
                        </p>
                    </div>
                </div>

                <!-- Wallet, Streak, ABC Board, Shop & Controls -->
                <div class="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <!-- English Bank Wallet -->
                    <button id="wallet-pill" onclick="openShopModal('parent')" class="flex items-center gap-2 bg-gradient-to-l from-amber-100 to-yellow-50 hover:from-amber-200 hover:to-yellow-100 border-2 border-amber-300 text-amber-950 px-3.5 py-2 rounded-2xl font-black text-base shadow-sm transition active:scale-95 cursor-pointer" title="בנק האנגלית שלך - לחצי לפתיחת הפרסים">
                        <span class="text-xl">🪙</span>
                        <span id="stat-coins">0</span>
                        <span class="text-xs font-bold text-amber-700">מטבעות</span>
                    </button>

                    <!-- Daily Streak -->
                    <div class="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-2xl font-extrabold text-sm" title="רצף ימי למידה">
                        <span>🔥</span>
                        <span id="stat-streak">1</span>
                        <span class="text-xs font-semibold hidden sm:inline">ימים</span>
                    </div>

                    <!-- Daily review (React page) -->
                    <button onclick="goToPractice('/practice/daily')" class="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-800 px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm transition active:scale-95 cursor-pointer" title="חזרה יומית">
                        <span>⏰</span>
                        <span>5 דקות ביום</span>
                    </button>

                    <!-- Practice hub (React pages: spelling, dictation, ...) -->
                    <button onclick="goToPractice('/practice')" class="flex items-center gap-1.5 bg-gradient-to-l from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-amber-950 px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer" title="איות, הכתבה ועוד">
                        <span>🎯</span>
                        <span>תרגולים</span>
                    </button>

                    <!-- Full ABC Board Quick Access -->
                    <button onclick="openAbcModal()" class="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm transition active:scale-95 cursor-pointer" title="לוח כל 26 האותיות A-Z">
                        <span>🔤</span>
                        <span>לוח ABC</span>
                    </button>

                    <!-- Rewards Shop Button -->
                    <button onclick="openShopModal('app')" class="flex items-center gap-1.5 bg-gradient-to-l from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer">
                        <span>🛍️</span>
                        <span>חנות פרסים</span>
                    </button>

                    <!-- Speech Speed Toggle -->
                    <button onclick="toggleSpeechSpeed()" class="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 px-3 py-2 rounded-2xl font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer" title="מהירות הקראה">
                        <span id="speed-icon">🐇</span>
                        <span id="speed-label" class="hidden sm:inline">קצב רגיל</span>
                    </button>

                    <!-- Voice Settings Button -->
                    <button onclick="openVoiceModal()" class="flex items-center justify-center w-10 h-10 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-2xl transition active:scale-95 cursor-pointer" title="בחירת קול הקראה באנגלית">
                        <span class="text-lg">🎙️</span>
                    </button>

                    <!-- SFX Mute Toggle -->
                    <button onclick="toggleSfxMute()" class="flex items-center justify-center w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-2xl transition active:scale-95 cursor-pointer" title="השתק/הפעל צלילי משחק">
                        <span id="sfx-icon" class="text-lg">🔊</span>
                    </button>

                    <!-- Parent Control & Reset Button -->
                    <button onclick="goToParentArea()" class="flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-2xl font-bold text-xs transition active:scale-95 cursor-pointer" title="אזור הורים (דורש התחברות הורה)">
                        <span>🔒</span>
                        <span class="hidden sm:inline">אזור הורים</span>
                    </button>
                </div>
            </div>

            <!-- Progress Stats Strip -->
            <div class="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <!-- Letters Mastered -->
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">Aa</div>
                    <div class="flex-1">
                        <div class="flex justify-between text-xs font-bold text-slate-600 mb-1">
                            <span>אותיות בשליטה</span>
                            <span id="stat-letters-text" class="text-indigo-600">0 / 26</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div id="bar-letters" class="h-full bg-indigo-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <!-- Words Read -->
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-base shrink-0">📖</div>
                    <div class="flex-1">
                        <div class="flex justify-between text-xs font-bold text-slate-600 mb-1">
                            <span>מילים שקראתי</span>
                            <span id="stat-words-text" class="text-teal-600">0 מילים</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div id="bar-words" class="h-full bg-teal-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>
                </div>

                <!-- Levels Completed -->
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-base shrink-0">🏆</div>
                    <div class="flex-1">
                        <div class="flex justify-between text-xs font-bold text-slate-600 mb-1">
                            <span>שלבים שהושלמו</span>
                            <span id="stat-levels-text" class="text-amber-600">0 / 7</span>
                        </div>
                        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div id="bar-levels" class="h-full bg-amber-500 rounded-full transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- 7-LEVEL SELECTOR STRIP -->
        <section class="mb-5">
            <div class="flex items-center justify-between mb-2 px-1">
                <h2 class="text-xs sm:text-sm font-extrabold text-slate-600 bg-white/80 backdrop-blur-xs px-3 py-1 rounded-full shadow-2xs">
                    🗺️ מסלול הקריאה המהיר (7 שלבים):
                </h2>
                <span id="mistake-badge-top" onclick="switchTab('challenges')" class="hidden cursor-pointer text-xs font-extrabold bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1 rounded-full transition">
                    🎯 יש לך <span id="mistake-count-top">0</span> מילים בבנק החיזוק (2x מטבעות!)
                </span>
            </div>

            <div id="level-selector" class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                <!-- Dynamically populated -->
            </div>
        </section>

        <!-- MAIN WORKSPACE CARD -->
        <main class="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-indigo-100/80 overflow-hidden">

            <!-- Dynamic Theme Level Banner -->
            <div class="theme-banner text-white p-4 sm:p-6 transition-all duration-500">
                <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span id="current-level-badge" class="bg-white/20 backdrop-blur-xs text-xs font-extrabold px-3 py-1 rounded-full">שלב 1</span>
                            <span id="current-level-done-badge" class="hidden bg-emerald-400 text-emerald-950 text-xs font-black px-2.5 py-1 rounded-full">✓ הושלם!</span>
                        </div>
                        <h2 id="current-level-title" class="text-2xl sm:text-3xl font-black">מתחילים לקרוא!</h2>
                        <p id="current-level-subtitle" class="text-white/85 text-sm sm:text-base mt-0.5 font-medium en-text tracking-wider">A • B • S • T • P</p>
                    </div>

                    <!-- 5 Learning Modes Tabs -->
                    <div id="main-tabs-bar" class="flex flex-wrap sm:flex-nowrap bg-black/20 p-1.5 rounded-2xl gap-1">
                        <button onclick="switchTab('learn')" id="tab-btn-learn" class="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                            <span>🔤</span><span>אותיות</span>
                        </button>
                        <button onclick="switchTab('blend')" id="tab-btn-blend" class="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                            <span>🧩</span><span>מכונת מילים</span>
                        </button>
                        <button onclick="switchTab('spell')" id="tab-btn-spell" class="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                            <span>✍️</span><span>בנה מילה</span>
                        </button>
                        <button onclick="switchTab('quiz')" id="tab-btn-quiz" class="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                            <span>🎯</span><span>חידון</span>
                        </button>
                        <button onclick="switchTab('challenges')" id="tab-btn-challenges" class="flex-1 sm:flex-none px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
                            <span>⚡</span><span>אתגרים</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- TAB 1: LEARN LETTERS (FLASHCARDS + DUAL ABC/PHONICS + GENIUS BONUS) -->
            <div id="tab-learn" class="p-4 sm:p-7">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h3 class="text-lg sm:text-xl font-extrabold text-slate-800">כרטיסיות אותיות חכמות (ABC + צליל קריאה)</h3>
                        <p class="text-sm text-slate-500">
                            למדי גם את <strong>שם האות</strong> וגם את <strong>הצליל שלה</strong>, וסמני "למדתי ✓" כדי להרוויח <strong class="text-amber-600">+2 🪙</strong>!
                        </p>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                        <button onclick="openAbcModal()" class="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-extrabold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer">
                            <span>🔤</span>
                            <span>לוח ה-ABC המלא</span>
                        </button>
                        <button onclick="switchTab('blend')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer">
                            <span>עברי למכונת המילים</span>
                            <span>⬅️</span>
                        </button>
                    </div>
                </div>

                <!-- Clear Mini-Explainer Badge -->
                <div class="mb-5 bg-gradient-to-l from-indigo-50 via-white to-emerald-50 border border-indigo-200/80 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-bold text-slate-700">
                    <span class="inline-flex items-center gap-1.5">
                        <span class="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                        <strong class="text-indigo-800">השם</strong> = איך קוראים לה ב-ABC (למשל B = בִּי)
                    </span>
                    <span class="text-slate-300 hidden sm:inline">|</span>
                    <span class="inline-flex items-center gap-1.5">
                        <span class="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                        <strong class="text-emerald-800">הצליל</strong> = איך היא נשמעת במילה (למשל B = בּ)
                    </span>
                </div>

                <div id="letters-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Flashcards injected by JS -->
                </div>
            </div>

            <!-- TAB 2: WORD BLENDER MACHINE -->
            <div id="tab-blend" class="hidden p-4 sm:p-7">
                <div class="max-w-3xl mx-auto">
                    <div class="text-center mb-5">
                        <h3 class="text-xl font-extrabold text-slate-800">🧩 מכונת חיבור המילים</h3>
                        <p class="text-sm text-slate-500 mt-1">לחצי על כל אות משמאל לימין לשמוע את הצליל, ואז לחצי על <strong>"חבר למילה!"</strong> (+3 🪙 לכל מילה חדשה)</p>
                    </div>

                    <!-- Quick Word Selector Pills -->
                    <div id="blender-word-pills" class="flex flex-wrap justify-center gap-2 mb-6" dir="ltr"></div>

                    <!-- Blender Stage -->
                    <div class="bg-gradient-to-b from-slate-50 to-indigo-50/70 border-2 border-indigo-100 rounded-3xl p-5 sm:p-8 text-center">
                        <div class="flex items-center justify-between text-xs font-bold text-indigo-500 mb-4">
                            <span id="blender-read-badge" class="opacity-0 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">✓ כבר קראת!</span>
                            <span class="flex items-center gap-1">קוראים משמאל לימין ➡️</span>
                            <span id="blender-counter" class="text-slate-400">1 / 12</span>
                        </div>

                        <!-- Interactive Letter Tiles -->
                        <div id="blender-tiles" class="flex items-center justify-center gap-2.5 sm:gap-4 my-5 flex-wrap" dir="ltr"></div>

                        <!-- Primary Actions -->
                        <div class="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button onclick="animateAndBlendWord()" class="w-full sm:w-auto bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-lg px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                                <span>🔊</span>
                                <span>חבר למילה!</span>
                            </button>
                            <button onclick="toggleBlenderMeaning()" id="btn-toggle-meaning" class="w-full sm:w-auto bg-white hover:bg-amber-50 border-2 border-amber-300 text-amber-800 font-bold text-base px-5 py-3.5 rounded-2xl transition active:scale-95 cursor-pointer">
                                👀 גלה פירוש
                            </button>
                        </div>

                        <!-- Meaning Reveal Box -->
                        <div id="blender-meaning-box" class="mt-6 min-h-[76px] flex items-center justify-center"></div>

                        <!-- Prev / Next Navigation -->
                        <div class="flex items-center justify-between mt-6 pt-5 border-t border-indigo-100">
                            <button onclick="stepBlenderWord(-1)" class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition active:scale-95 cursor-pointer">
                                ➡️ מילה קודמת
                            </button>
                            <button onclick="switchTab('spell')" class="hidden sm:inline-flex bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer">
                                ✍️ מוכנה לבנות מילים משמיעה?
                            </button>
                            <button onclick="stepBlenderWord(1)" class="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm transition active:scale-95 cursor-pointer">
                                מילה הבאה ⬅️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- TAB 3: SPELLING BUILDER (LISTEN & BUILD WORD) -->
            <div id="tab-spell" class="hidden p-4 sm:p-7">
                <div id="spell-container" class="max-w-2xl mx-auto">
                    <!-- Rendered dynamically by JS -->
                </div>
            </div>

            <!-- TAB 4: SMART QUIZ -->
            <div id="tab-quiz" class="hidden p-4 sm:p-7">
                <div id="quiz-container" class="max-w-2xl mx-auto">
                    <!-- Rendered dynamically by JS -->
                </div>
            </div>

            <!-- TAB 5: MISTAKE BANK & b/d/p/q CHALLENGE -->
            <div id="tab-challenges" class="hidden p-4 sm:p-7">
                <div class="max-w-4xl mx-auto space-y-8">
                    <!-- Section A: Personal Mistake Bank -->
                    <div class="bg-gradient-to-br from-rose-50/90 to-amber-50/70 border-2 border-rose-200 rounded-3xl p-5 sm:p-6">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                                <div class="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-xs font-extrabold px-3 py-1 rounded-full mb-1">
                                    <span>🎯 בנק החיזוק האישי</span>
                                    <span class="bg-amber-300 text-amber-950 px-2 py-0.5 rounded-full">2x מטבעות!</span>
                                </div>
                                <h3 class="text-xl font-black text-slate-800">מילים שמתאמנים עליהן עוד קצת</h3>
                                <p class="text-sm text-slate-600">כל מילה שטעית בה נשמרת כאן אוטומטית. כשתעני עליה נכון היא תיעלם מהבנק ותקבלי מטבעות כפולים!</p>
                            </div>
                            <button id="btn-start-mistake-quiz" onclick="startMistakePractice()" class="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-3 rounded-2xl shadow-md transition active:scale-95 cursor-pointer shrink-0">
                                🚀 תרגלי את בנק החיזוק
                            </button>
                        </div>
                        <div id="mistake-bank-content">
                            <!-- Populated by JS -->
                        </div>
                    </div>

                    <!-- Section B: b / d / p / q Master Challenge -->
                    <div class="bg-gradient-to-br from-teal-50/80 to-emerald-50/70 border-2 border-teal-200 rounded-3xl p-5 sm:p-6">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div>
                                <span class="bg-teal-100 text-teal-800 text-xs font-extrabold px-3 py-1 rounded-full">אתגר אלופות ⚡</span>
                                <h3 class="text-xl sm:text-2xl font-black text-teal-950 mt-1">אלופת ה- <span class="en-text bg-white px-2 rounded-lg border border-teal-200">b / d / p / q</span></h3>
                            </div>
                            <div class="bg-white border border-teal-200 rounded-2xl px-4 py-2 text-center self-start sm:self-auto">
                                <div class="text-[11px] text-slate-500 font-bold">שיא אישי</div>
                                <div id="bd-best-score" class="text-xl font-black text-teal-700">0 / 10</div>
                            </div>
                        </div>

                        <!-- Visual Tricks -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <!-- Bed Trick SVG -->
                            <div class="bg-white border border-amber-200 rounded-2xl p-4">
                                <div class="flex items-center justify-between mb-2">
                                    <h4 class="font-extrabold text-amber-900">🛏️ טריק המיטה (bed)</h4>
                                    <button onclick="speakWord('bed')" class="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer">🔊 bed</button>
                                </div>
                                <p class="text-xs text-slate-600 mb-3">
                                    בצד שמאל משענת הראש (<strong class="en-text text-indigo-700">b</strong>) ובצד ימין משענת הרגליים (<strong class="en-text text-teal-700">d</strong>).
                                </p>
                                <svg viewBox="0 0 260 100" class="w-full max-w-[230px] mx-auto h-auto" aria-label="איור המילה bed בצורת מיטה">
                                    <rect x="46" y="42" width="38" height="16" rx="8" fill="#bae6fd" stroke="#0284c7" stroke-width="2"/>
                                    <rect x="86" y="46" width="110" height="22" rx="6" fill="#c7d2fe" stroke="#4f46e5" stroke-width="2"/>
                                    <line x1="36" y1="82" x2="224" y2="82" stroke="#92400e" stroke-width="6" stroke-linecap="round"/>
                                    <text x="34" y="78" font-family="Nunito, sans-serif" font-weight="900" font-size="64" fill="#4f46e5">b</text>
                                    <text x="108" y="78" font-family="Nunito, sans-serif" font-weight="900" font-size="60" fill="#d97706">e</text>
                                    <text x="174" y="78" font-family="Nunito, sans-serif" font-weight="900" font-size="64" fill="#0d9488">d</text>
                                </svg>
                            </div>

                            <!-- p vs q Trick -->
                            <div class="bg-white border border-purple-200 rounded-2xl p-4 flex flex-col justify-between">
                                <div>
                                    <h4 class="font-extrabold text-purple-900 mb-2">👑 טריק ה-<span class="en-text">p</span> וה-<span class="en-text">q</span></h4>
                                    <p class="text-xs text-slate-600 mb-2">
                                        <strong class="en-text text-base text-purple-700">p</strong> (פּיצה 🍕): מסתכלת <strong>קדימה</strong> (ימינה) לכיוון האוכל!
                                    </p>
                                    <p class="text-xs text-slate-600">
                                        <strong class="en-text text-base text-rose-600">q</strong> (Queen 👑): המלכה מסתכלת <strong>אחורה</strong> (שמאלה) על הגלימה שלה.
                                    </p>
                                </div>
                                <div class="flex items-center justify-around mt-3 pt-2 border-t border-slate-100" dir="ltr">
                                    <button onclick="speakPhonics('p')" class="px-4 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-black en-text cursor-pointer">p 🔊</button>
                                    <span class="text-slate-300 font-bold text-xs">VS</span>
                                    <button onclick="speakPhonics('q')" class="px-4 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-black en-text cursor-pointer">q 🔊</button>
                                </div>
                            </div>
                        </div>

                        <!-- Rapid b/d/p/q Game Box -->
                        <div id="bd-game-area" class="bg-white border-2 border-teal-100 rounded-2xl p-5 text-center"></div>
                    </div>
                </div>
            </div>

            <!-- LEVEL 7: SENTENCE READING STUDIO -->
            <div id="tab-sentences" class="hidden p-4 sm:p-7"></div>
        </main>
    </div>

    <!-- =========================================================================
         MODAL 1: REWARDS SHOP (APP REWARDS + CUSTOM PARENT REWARDS)
         ========================================================================= -->
    <div id="shop-modal" class="fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-pop">
            <!-- Modal Header -->
            <div class="bg-gradient-to-l from-pink-500 via-purple-600 to-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">🛍️</span>
                    <div>
                        <h2 class="text-xl sm:text-2xl font-black">חנות הפרסים ובנק האנגלית</h2>
                        <p class="text-xs text-white/85">היתרה שלך: <strong id="shop-balance" class="text-amber-300 text-sm">0 🪙</strong></p>
                    </div>
                </div>
                <button onclick="closeShopModal()" class="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-lg cursor-pointer">✕</button>
            </div>

            <!-- Shop Tabs -->
            <div class="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
                <button id="shop-tab-app" onclick="switchShopTab('app')" class="px-4 py-2.5 rounded-t-2xl font-extrabold text-sm transition cursor-pointer">
                    ✨ פרסים באפליקציה
                </button>
                <button id="shop-tab-parent" onclick="switchShopTab('parent')" class="px-4 py-2.5 rounded-t-2xl font-extrabold text-sm transition cursor-pointer">
                    🎁 פרסים מאבא ואמא
                </button>
            </div>

            <!-- Shop Body -->
            <div id="shop-body" class="p-4 sm:p-6 overflow-y-auto flex-1">
                <!-- Populated dynamically -->
            </div>
        </div>
    </div>

    <!-- =========================================================================
         MODAL 2: VOICE SELECTOR MODAL
         ========================================================================= -->
    <div id="voice-modal" class="fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-pop">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-black text-slate-800">🎙️ בחירת קול הקראה באנגלית</h3>
                <button onclick="closeVoiceModal()" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer">✕</button>
            </div>
            <p class="text-xs text-slate-500 mb-4">האפליקציה בוחרת אוטומטית את הקול האנגלי הברור ביותר במכשיר. אפשר לבדוק ולבחור קול אחר אם רוצים:</p>
            <div id="voice-list" class="space-y-2 max-h-60 overflow-y-auto mb-4"></div>
            <button onclick="speakWord('Hello! You are doing amazing!')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer transition">
                🔊 בדקי את הקול הנבחר
            </button>
        </div>
    </div>

    <!-- =========================================================================
         MODAL 3: FULL ABC BOARD (A-Z)
         ========================================================================= -->
    <div id="abc-modal" class="fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-pop">
            <div class="bg-gradient-to-l from-sky-600 to-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">🔤</span>
                    <div>
                        <h2 class="text-xl sm:text-2xl font-black">לוח ה-ABC המלא (A–Z)</h2>
                        <p class="text-xs text-white/85">לחצי על כל אות לשמוע את השם שלה ב-ABC או את הצליל שלה לקריאה!</p>
                    </div>
                </div>
                <button onclick="closeAbcModal()" class="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-lg cursor-pointer">✕</button>
            </div>

            <!-- Mode Toggle Bar -->
            <div class="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-center gap-2">
                <button id="abc-mode-name" onclick="setAbcBoardMode('name')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer">
                    🔊 שם האות (ב-ABC)
                </button>
                <button id="abc-mode-sound" onclick="setAbcBoardMode('sound')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer">
                    🗣️ צליל האות (לקריאה)
                </button>
            </div>

            <!-- 26 Letters Grid -->
            <div id="abc-board-grid" class="p-4 sm:p-6 overflow-y-auto grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5" dir="ltr">
                <!-- Populated dynamically -->
            </div>
        </div>
    </div>

`;
