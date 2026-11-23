// Authorization & flow tests against a RUNNING app (never point this at production).
//   BASE_URL=http://127.0.0.1:3000 ADMIN_USERNAME=admin ADMIN_PASSWORD=... node --test tests/
// Creates its own families/users with random names, so it can run repeatedly.
import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const ADMIN = { username: process.env.ADMIN_USERNAME ?? 'admin', password: process.env.ADMIN_PASSWORD ?? '' };
const rnd = () => Math.random().toString(36).slice(2, 8);

/** Minimal client with its own cookie (= one browser/device). */
const cookies = new WeakMap();
const cookieOf = async (c) => cookies.get(c)();

function client() {
  let cookie = '';
  const call = async function call(method, path, body, headers = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const set = res.headers.get('set-cookie');
    if (set) {
      const m = set.match(/ec_session=([^;]*)/);
      if (m) cookie = m[1] ? `ec_session=${m[1]}` : '';
    }
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  };
  cookies.set(call, () => cookie);
  return call;
}

async function login(username, secret) {
  const c = client();
  const r = await c('POST', '/api/auth/login', { username, secret });
  assert.equal(r.status, 200, `login ${username}: ${JSON.stringify(r.json)}`);
  return c;
}

let admin, parentA, parentB, kidA, kidAId, kidB, kidBId;
const famA = { parent: `pa_${rnd()}`, pw: 'parentA-pass-1', kid: `ka_${rnd()}`, pin: '1234' };
const famB = { parent: `pb_${rnd()}`, pw: 'parentB-pass-1', kid: `kb_${rnd()}`, pin: '4321' };

before(async () => {
  assert.ok(ADMIN.password, 'set ADMIN_PASSWORD');
  admin = await login(ADMIN.username, ADMIN.password);
  for (const [f, name] of [
    [famA, 'Test A'],
    [famB, 'Test B'],
  ]) {
    const r = await admin('POST', '/api/admin/families', {
      name: `${name} ${rnd()}`,
      parent: { username: f.parent, displayName: `Parent ${name}`, password: f.pw },
    });
    assert.equal(r.status, 201, JSON.stringify(r.json));
  }
  parentA = await login(famA.parent, famA.pw);
  parentB = await login(famB.parent, famB.pw);
  let r = await parentA('POST', '/api/family/students', { username: famA.kid, displayName: 'Kid A', pin: famA.pin });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  kidAId = r.json.id;
  r = await parentB('POST', '/api/family/students', { username: famB.kid, displayName: 'Kid B', pin: famB.pin });
  assert.equal(r.status, 201);
  kidBId = r.json.id;
  kidA = await login(famA.kid, famA.pin);
  kidB = await login(famB.kid, famB.pin);
});

describe('authentication', () => {
  test('anonymous requests are rejected', async () => {
    const anon = client();
    for (const path of ['/api/family', '/api/me/progress', '/api/me/rewards', '/api/admin/families', '/api/auth/me']) {
      assert.equal((await anon('GET', path)).status, 401, path);
    }
  });

  test('wrong secret gives one generic error (no username probing)', async () => {
    const c = client();
    const wrongPw = await c('POST', '/api/auth/login', { username: famA.parent, secret: 'nope-nope' });
    const noUser = await c('POST', '/api/auth/login', { username: `ghost_${rnd()}`, secret: 'nope-nope' });
    assert.equal(wrongPw.status, 401);
    assert.equal(noUser.status, 401);
    assert.equal(wrongPw.json.message, noUser.json.message);
  });

  test('usernames are case-insensitive and unique', async () => {
    await login(famA.kid.toUpperCase(), famA.pin);
    const r = await parentB('POST', '/api/family/students', { username: famA.kid.toUpperCase(), displayName: 'dup', pin: '1111' });
    assert.equal(r.status, 409);
  });

  test('PIN must be exactly 4 digits', async () => {
    for (const pin of ['123', '12345', 'abcd', '']) {
      const r = await parentA('POST', '/api/family/students', { username: `x_${rnd()}`, displayName: 'x', pin });
      assert.equal(r.status, 400, pin);
    }
  });

  test('lockout after 5 wrong PINs, parent can unlock', async () => {
    const r0 = await parentA('POST', '/api/family/students', { username: `lk_${rnd()}`, displayName: 'Lock', pin: '2468' });
    const name = (await parentA('GET', '/api/family')).json.students.find((s) => s.id === r0.json.id).username;
    const c = client();
    for (let i = 0; i < 5; i++) assert.equal((await c('POST', '/api/auth/login', { username: name, secret: '0000' })).status, 401);
    assert.equal((await c('POST', '/api/auth/login', { username: name, secret: '2468' })).status, 423, 'locked even with right PIN');
    assert.equal((await parentA('POST', `/api/family/students/${r0.json.id}/unlock`)).status, 200);
    assert.equal((await c('POST', '/api/auth/login', { username: name, secret: '2468' })).status, 200);
  });

  test('cross-site writes are blocked (Origin check)', async () => {
    const r = await parentA('POST', '/api/family/students', { username: `o_${rnd()}`, displayName: 'o', pin: '1111' }, {
      Origin: 'https://evil.example',
    });
    assert.equal(r.status, 403);
  });

  test('logout ends the session', async () => {
    const c = await login(famA.kid, famA.pin);
    assert.equal((await c('POST', '/api/auth/logout')).status, 200);
    assert.equal((await c('GET', '/api/me/progress')).status, 401);
  });
});

describe('student permissions', () => {
  test('student cannot use any guardian/admin endpoint', async () => {
    const calls = [
      ['GET', '/api/family'],
      ['POST', `/api/family/students/${kidAId}/reset`, { confirmPassword: famA.pin }],
      ['POST', `/api/family/students/${kidAId}/pin`, { pin: '9999', confirmPassword: famA.pin }],
      ['POST', `/api/family/students/${kidAId}/rewards`, { title: 'free stuff', cost: 1 }],
      ['DELETE', `/api/family/students/${kidAId}`, { confirmPassword: famA.pin }],
      ['POST', '/api/family/students', { username: `s_${rnd()}`, displayName: 's', pin: '1111' }],
      ['GET', '/api/admin/families'],
      ['POST', '/api/me/password', { currentPassword: famA.pin, newPassword: '12345678' }],
    ];
    for (const [m, p, b] of calls) assert.equal((await kidA(m, p, b)).status, 403, `${m} ${p}`);
  });

  test('student progress: own only, versioned, server-owned fields stripped', async () => {
    const { json: p } = await kidA('GET', '/api/me/progress');
    assert.equal(p.data.coins, 0);
    const save = await kidA('PUT', '/api/me/progress', {
      data: { ...p.data, coins: 300, parentRewards: [{ title: 'hack', cost: 1 }] },
      baseVersion: p.version,
    });
    assert.equal(save.status, 200);
    const stale = await kidA('PUT', '/api/me/progress', { data: { ...p.data, coins: 1 }, baseVersion: p.version });
    assert.equal(stale.status, 409, 'stale write rejected');
    assert.equal(stale.json.current.data.coins, 300);
    assert.equal(stale.json.current.data.parentRewards, undefined);
  });
});

describe('family isolation', () => {
  test("parent cannot see or touch another family's kid", async () => {
    const own = await parentB('GET', `/api/family?familyId=${(await parentA('GET', '/api/family')).json.family.id}`);
    assert.ok(own.json.students.every((s) => s.id !== kidAId), 'familyId param is ignored for parents');
    for (const [m, p, b] of [
      ['POST', `/api/family/students/${kidAId}/reset`, { confirmPassword: famB.pw }],
      ['POST', `/api/family/students/${kidAId}/pin`, { pin: '0000', confirmPassword: famB.pw }],
      ['POST', `/api/family/students/${kidAId}/rewards`, { title: 'x', cost: 5 }],
      ['PATCH', `/api/family/students/${kidAId}`, { displayName: 'hacked' }],
      ['DELETE', `/api/family/students/${kidAId}`, { confirmPassword: famB.pw }],
      ['POST', `/api/family/students/${kidAId}/unlock`],
    ]) {
      assert.equal((await parentB(m, p, b)).status, 404, `${m} ${p}`);
    }
  });

  test('admin can manage any family', async () => {
    const famId = (await parentB('GET', '/api/family')).json.family.id;
    const r = await admin('GET', `/api/family?familyId=${famId}`);
    assert.equal(r.status, 200);
    assert.ok(r.json.students.some((s) => s.id === kidBId));
  });
});

describe('parent actions', () => {
  test('reset requires the parent password and zeroes progress', async () => {
    assert.equal((await parentA('POST', `/api/family/students/${kidAId}/reset`, { confirmPassword: 'wrong' })).status, 403);
    assert.equal((await parentA('POST', `/api/family/students/${kidAId}/reset`, { confirmPassword: famA.pw })).status, 200);
    const { json } = await kidA('GET', '/api/me/progress');
    assert.equal(json.data.coins, 0);
  });

  test('redeem -> pending -> fulfilled; cancel refunds', async () => {
    const reward = await parentA('POST', `/api/family/students/${kidAId}/rewards`, { title: 'Pizza 🍕', cost: 40 });
    assert.equal(reward.status, 201);

    // not enough coins
    assert.equal((await kidA('POST', '/api/me/redemptions', { rewardId: reward.json.id })).status, 409);

    let { json: p } = await kidA('GET', '/api/me/progress');
    await kidA('PUT', '/api/me/progress', { data: { ...p.data, coins: 100 }, baseVersion: p.version });

    const r1 = await kidA('POST', '/api/me/redemptions', { rewardId: reward.json.id });
    assert.equal(r1.status, 200);
    assert.equal(r1.json.coins, 60);
    const r2 = await kidA('POST', '/api/me/redemptions', { rewardId: reward.json.id });
    assert.equal(r2.json.coins, 20);

    // other family's kid can't redeem this reward
    assert.equal((await kidB('POST', '/api/me/redemptions', { rewardId: reward.json.id })).status, 404);

    const mine = await kidA('GET', '/api/me/rewards');
    assert.equal(mine.json.redemptions.filter((d) => d.status === 'pending').length, 2);

    // other family's parent can't resolve it
    assert.equal((await parentB('POST', `/api/family/redemptions/${r1.json.redemptionId}`, { action: 'fulfill' })).status, 404);

    assert.equal((await parentA('POST', `/api/family/redemptions/${r1.json.redemptionId}`, { action: 'fulfill' })).status, 200);
    assert.equal((await parentA('POST', `/api/family/redemptions/${r1.json.redemptionId}`, { action: 'cancel' })).status, 409);
    assert.equal((await parentA('POST', `/api/family/redemptions/${r2.json.redemptionId}`, { action: 'cancel' })).status, 200);
    ({ json: p } = await kidA('GET', '/api/me/progress'));
    assert.equal(p.data.coins, 60, 'cancel refunded 40');
  });

  test('changing a PIN logs the kid out everywhere', async () => {
    const c = await login(famA.kid, famA.pin);
    assert.equal((await parentA('POST', `/api/family/students/${kidAId}/pin`, { pin: '5555', confirmPassword: famA.pw })).status, 200);
    assert.equal((await c('GET', '/api/me/progress')).status, 401);
    await login(famA.kid, '5555');
  });

  test('guardians: add, cannot remove self or the last one', async () => {
    const me = (await parentB('GET', '/api/family')).json.guardians[0];
    assert.equal((await parentB('DELETE', `/api/family/guardians/${me.id}`, { confirmPassword: famB.pw })).status, 400);
    const g = await parentB('POST', '/api/family/guardians', { username: `t_${rnd()}`, displayName: 'Teacher', password: 'teacher-pass-1' });
    assert.equal(g.status, 201);
    assert.equal((await parentB('DELETE', `/api/family/guardians/${g.json.id}`, { confirmPassword: famB.pw })).status, 200);
  });
});

describe('word lists & spelling', () => {
  let listId;

  // an earlier test changes Kid A's PIN to 5555, which logs the old session out
  before(async () => {
    kidA = await login(famA.kid, '5555');
  });

  test('parent creates a list and pastes words (with meanings, duplicates, invalid lines)', async () => {
    const r = await parentA('POST', '/api/family/word-lists', { title: 'Unit 3', studentId: null });
    assert.equal(r.status, 201);
    listId = r.json.id;
    const add = await parentA('POST', `/api/family/word-lists/${listId}/words`, {
      text: 'apple - תפוח\nbanana\nBanana\nice cream = גלידה\nשלום\nbecause',
    });
    assert.equal(add.status, 201);
    assert.equal(add.json.added, 4); // apple, banana, ice cream, because
    assert.deepEqual(add.json.invalid, ['שלום']);
    const again = await parentA('POST', `/api/family/word-lists/${listId}/words`, { text: 'apple' });
    assert.equal(again.json.duplicates, 1);
    const { json } = await parentA('GET', '/api/family/word-lists');
    const list = json.lists.find((l) => l.id === listId);
    assert.deepEqual(list.words.map((w) => w.word), ['apple', 'banana', 'ice cream', 'because']);
    assert.equal(list.words[0].hebrew, 'תפוח');
  });

  test("lists are private to the family; students can't manage them", async () => {
    const other = await parentB('GET', '/api/family/word-lists');
    assert.ok(other.json.lists.every((l) => l.id !== listId));
    assert.equal((await parentB('POST', `/api/family/word-lists/${listId}/words`, { text: 'hack' })).status, 404);
    assert.equal((await parentB('DELETE', `/api/family/word-lists/${listId}`)).status, 404);
    const word = (await parentA('GET', '/api/family/word-lists')).json.lists.find((l) => l.id === listId).words[0];
    assert.equal((await parentB('PATCH', `/api/family/words/${word.id}`, { hebrew: 'x' })).status, 404);
    assert.equal((await kidA('GET', '/api/family/word-lists')).status, 403);
    assert.equal((await kidA('POST', '/api/family/word-lists', { title: 'mine' })).status, 403);
  });

  test('AI completion fills only empty fields and is marked for review (or is cleanly disabled)', async () => {
    const { json: before } = await parentA('GET', '/api/family/word-lists');
    const r = await parentA('POST', `/api/family/word-lists/${listId}/enrich`);
    if (!before.aiEnabled) {
      assert.equal(r.status, 503);
      return;
    }
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.remaining, 0);
    const list = (await parentA('GET', '/api/family/word-lists')).json.lists.find((l) => l.id === listId);
    const apple = list.words.find((w) => w.word === 'apple');
    assert.equal(apple.hebrew, 'תפוח', "parent's meaning kept");
    assert.ok(apple.exampleEn && apple.aiGenerated);
    // a parent edit/approve clears the AI flag
    assert.equal((await parentA('PATCH', `/api/family/words/${apple.id}`, { hebrew: 'תפוח עץ' })).status, 200);
    const after = (await parentA('GET', '/api/family/word-lists')).json.lists.find((l) => l.id === listId);
    const apple2 = after.words.find((w) => w.word === 'apple');
    assert.equal(apple2.hebrew, 'תפוח עץ');
    assert.equal(apple2.aiGenerated, false);
  });

  test('word validation: English only, no duplicates on rename', async () => {
    const list = (await parentA('GET', '/api/family/word-lists')).json.lists.find((l) => l.id === listId);
    const [a, b] = list.words;
    assert.equal((await parentA('PATCH', `/api/family/words/${a.id}`, { word: 'שלום' })).status, 400);
    assert.equal((await parentA('PATCH', `/api/family/words/${a.id}`, { word: b.word.toUpperCase() })).status, 409);
  });

  test('grade: parent can set it, validated', async () => {
    assert.equal((await parentA('PATCH', `/api/family/students/${kidAId}`, { grade: 4 })).status, 200);
    assert.equal((await parentA('PATCH', `/api/family/students/${kidAId}`, { grade: 13 })).status, 400);
    const kid = (await parentA('GET', '/api/family')).json.students.find((s) => s.id === kidAId);
    assert.equal(kid.grade, 4);
    assert.equal(kid.displayName, 'Kid A', 'grade-only update keeps the name');
  });

  test('list assigned to one kid is visible only to that kid', async () => {
    const r = await parentA('POST', '/api/family/students', { username: `sib_${rnd()}`, displayName: 'Sibling', pin: '1357' });
    const sibling = await login((await parentA('GET', '/api/family')).json.students.find((s) => s.id === r.json.id).username, '1357');
    const own = await parentA('POST', '/api/family/word-lists', { title: `OnlyForKidA_${rnd()}`, studentId: kidAId });
    await parentA('POST', `/api/family/word-lists/${own.json.id}/words`, { text: 'secret' });
    const title = (await parentA('GET', '/api/family/word-lists')).json.lists.find((l) => l.id === own.json.id).title;
    const pageFor = async (c) => {
      const res = await fetch(BASE + '/practice/spell', { headers: { Cookie: await cookieOf(c) } });
      return res.text();
    };
    assert.ok((await pageFor(kidA)).includes(title));
    assert.ok(!(await pageFor(sibling)).includes(title));
    // can't assign a list to another family's kid
    assert.equal((await parentA('POST', '/api/family/word-lists', { title: 'x', studentId: kidBId })).status, 400);
  });

  test('spelling stats survive saves from the game (unknown fields preserved)', async () => {
    const { json: p } = await kidA('GET', '/api/me/progress');
    const stats = { apple: { c: 1, w: 0, s: 1, t: 1 } };
    const r = await kidA('PUT', '/api/me/progress', { data: { ...p.data, spellingStats: stats }, baseVersion: p.version });
    assert.equal(r.status, 200);
    const { json: p2 } = await kidA('GET', '/api/me/progress');
    assert.deepEqual(p2.data.spellingStats, stats);
    const kid = (await parentA('GET', '/api/family')).json.students.find((s) => s.id === kidAId);
    assert.equal(kid.progress.spellingPracticed, 1);
  });
});

describe('mastery checks & coin adjustments', () => {
  // Correct answers from the game content (src/content/phonics.ts)
  const LETTER_NAMES = { a: 'אֵיי', b: 'בִּי', s: 'אֶס' };
  const MEANINGS = { bat: 'עטלף', sat: 'ישב' };
  const decode = (audio) => Buffer.from(audio, 'base64').toString('utf8').split('').reverse().join('');
  const answerFor = (q, correct) => {
    if (!correct) return q.type === 'spell' ? 'zzz' : q.options.find((o) => o !== LETTER_NAMES[q.letter] && o !== MEANINGS[q.word]);
    if (q.type === 'letter') return LETTER_NAMES[q.letter];
    if (q.type === 'meaning') return MEANINGS[q.word];
    return decode(q.audio);
  };
  let kid;

  before(async () => {
    kid = await login(famA.kid, '5555');
    const { json: p } = await kid('GET', '/api/me/progress');
    const data = {
      ...p.data,
      coins: 10,
      learnedLetters: ['a', 'b', 's'],
      readWords: ['bat', 'sat'],
      mistakes: [],
      spellingStats: { cat: { c: 3, w: 0, s: 3, t: 1 } },
    };
    assert.equal((await kid('PUT', '/api/me/progress', { data, baseVersion: p.version })).status, 200);
  });

  test('parent sends a check; only one open at a time; answers never sent to the kid', async () => {
    const fam = (await parentA('GET', '/api/family')).json;
    assert.deepEqual(fam.students.find((s) => s.id === kidAId).checkable, { letters: 3, words: 2, spelling: 1 });
    const r = await parentA('POST', `/api/family/students/${kidAId}/checks`, { scopes: ['letters', 'words', 'spelling'], size: 10 });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.total, 6);
    assert.equal((await parentA('POST', `/api/family/students/${kidAId}/checks`, { scopes: ['letters'], size: 5 })).status, 409);
    const { json } = await kid('GET', '/api/me/check');
    assert.equal(json.check.questions.length, 6);
    assert.ok(!JSON.stringify(json.check).includes('"answer"'), 'no answers in the payload');
    assert.ok(!JSON.stringify(json.check).includes('"cat"'), 'spelling word not in plain text');
    assert.equal((await kid('GET', '/api/me/notices')).json.openCheck.total, 6);
  });

  test('permissions: other kids and families cannot touch it, kids cannot create or cancel', async () => {
    const { json } = await kid('GET', '/api/me/check');
    const id = json.check.id;
    assert.equal((await kidB('POST', `/api/me/check/${id}/answer`, { index: 0, answer: 'x' })).status, 404);
    assert.equal((await kidB('POST', `/api/me/check/${id}/finish`)).status, 404);
    assert.equal((await parentB('DELETE', `/api/family/checks/${id}`)).status, 404);
    assert.equal((await parentB('POST', `/api/family/students/${kidAId}/checks`, { scopes: ['letters'], size: 5 })).status, 404);
    assert.equal((await kid('POST', `/api/family/students/${kidAId}/checks`, { scopes: ['letters'], size: 5 })).status, 403);
    assert.equal((await kid('POST', `/api/family/students/${kidAId}/coins`, { amount: 1000, reason: 'me' })).status, 403);
  });

  test('all wrong: graded on server, failed items go back to practice, first answer counts', async () => {
    const { json } = await kid('GET', '/api/me/check');
    const { id, questions } = json.check;
    for (const [i, q] of questions.entries()) {
      assert.equal((await kid('POST', `/api/me/check/${id}/answer`, { index: i, answer: answerFor(q, false) })).status, 200);
      // a second (correct) answer is ignored
      await kid('POST', `/api/me/check/${id}/answer`, { index: i, answer: answerFor(q, true) });
    }
    const fin = await kid('POST', `/api/me/check/${id}/finish`);
    assert.equal(fin.status, 200);
    assert.equal(fin.json.score, 0);
    assert.equal(fin.json.coins, 0);
    assert.equal((await kid('POST', `/api/me/check/${id}/finish`)).status, 404, 'cannot finish twice');
    const { json: p } = await kid('GET', '/api/me/progress');
    assert.deepEqual(p.data.learnedLetters, [], 'failed letters un-marked');
    assert.deepEqual([...p.data.mistakes].sort(), ['bat', 'sat']);
    assert.equal(p.data.spellingStats.cat.s, 0);
    assert.equal(p.data.coins, 10);
    const fam = (await parentA('GET', '/api/family')).json.students.find((s) => s.id === kidAId);
    assert.equal(fam.checks[0].score, 0);
    assert.equal(fam.checks[0].failed.length, 6);
  });

  test('all correct: +1 per answer and +5 bonus', async () => {
    const { json: p } = await kid('GET', '/api/me/progress');
    await kid('PUT', '/api/me/progress', {
      data: { ...p.data, learnedLetters: ['a', 'b', 's'], spellingStats: { cat: { c: 3, w: 1, s: 3, t: 1 } } },
      baseVersion: p.version,
    });
    const r = await parentA('POST', `/api/family/students/${kidAId}/checks`, { scopes: ['letters', 'words', 'spelling'], size: 10 });
    assert.equal(r.status, 201);
    const { json } = await kid('GET', '/api/me/check');
    for (const [i, q] of json.check.questions.entries()) {
      await kid('POST', `/api/me/check/${json.check.id}/answer`, { index: i, answer: answerFor(q, true) });
    }
    const fin = await kid('POST', `/api/me/check/${json.check.id}/finish`);
    assert.equal(fin.json.score, 6);
    assert.equal(fin.json.coins, 11);
    const { json: p2 } = await kid('GET', '/api/me/progress');
    assert.equal(p2.data.coins, 21);
    assert.equal(p2.data.spellingStats.cat.s, 4);
  });

  test('cancel an open check', async () => {
    const r = await parentA('POST', `/api/family/students/${kidAId}/checks`, { scopes: ['letters'], size: 5 });
    assert.equal((await parentA('DELETE', `/api/family/checks/${r.json.id}`)).status, 200);
    assert.equal((await kid('GET', '/api/me/check')).json.check, null);
  });

  test('parent removes/adds coins with a reason; never below zero; kid gets a notice once', async () => {
    assert.equal((await parentA('POST', `/api/family/students/${kidAId}/coins`, { amount: -5, reason: '' })).status, 400);
    assert.equal((await parentA('POST', `/api/family/students/${kidAId}/coins`, { amount: 0, reason: 'x' })).status, 400);
    const r1 = await parentA('POST', `/api/family/students/${kidAId}/coins`, { amount: -5, reason: 'סימנת בלי ללמוד' });
    assert.equal(r1.json.coins, 16);
    const r2 = await parentA('POST', `/api/family/students/${kidAId}/coins`, { amount: -1000, reason: 'test floor' });
    assert.equal(r2.json.coins, 0);
    assert.equal(r2.json.applied, -16);
    await parentA('POST', `/api/family/students/${kidAId}/coins`, { amount: 3, reason: 'כל הכבוד' });
    assert.equal((await parentB('POST', `/api/family/students/${kidAId}/coins`, { amount: 5, reason: 'x' })).status, 404);
    const n = (await kid('GET', '/api/me/notices')).json.adjustments;
    assert.deepEqual(n.map((a) => a.amount), [-5, -16, 3]);
    await kid('POST', '/api/me/notices/seen', { ids: n.map((a) => a.id) });
    assert.equal((await kid('GET', '/api/me/notices')).json.adjustments.length, 0);
    const fam = (await parentA('GET', '/api/family')).json.students.find((s) => s.id === kidAId);
    assert.equal(fam.coinAdjustments[0].seen, true);
  });
});

describe('daily review (spaced repetition)', () => {
  let kid;
  before(async () => {
    kid = await login(famA.kid, '5555');
  });

  test('today counts learned items; items due in the future are skipped', async () => {
    const { json: p } = await kid('GET', '/api/me/progress');
    const base = { ...p.data, learnedLetters: ['a', 'b'], readWords: ['bat'], mistakes: [], spellingStats: {}, reviewStats: {}, dailyReview: {} };
    assert.equal((await kid('PUT', '/api/me/progress', { data: base, baseVersion: p.version })).status, 200);
    let review = (await kid('GET', '/api/me/notices')).json.review;
    assert.equal(review.count, 3);
    assert.equal(review.doneToday, false);

    const { json: p2 } = await kid('GET', '/api/me/progress');
    const reviewStats = { 'letter:a': { box: 3, due: '2999-01-01' }, 'letter:b': { box: 1, due: '2000-01-01' } };
    await kid('PUT', '/api/me/progress', { data: { ...p2.data, reviewStats }, baseVersion: p2.version });
    review = (await kid('GET', '/api/me/notices')).json.review;
    assert.equal(review.count, 2, 'b is due, bat is new, a is not due yet');
  });

  test('daily page: kids only', async () => {
    const kidPage = await fetch(BASE + '/practice/daily', { headers: { Cookie: await cookieOf(kid) } });
    assert.equal(kidPage.status, 200);
    assert.ok((await kidPage.text()).includes('5 דקות ביום'));
    const parentPage = await fetch(BASE + '/practice/daily', { headers: { Cookie: await cookieOf(parentA) }, redirect: 'manual' });
    assert.ok([303, 307, 308].includes(parentPage.status));
  });

  test('parent dashboard shows review summary', async () => {
    const s = (await parentA('GET', '/api/family')).json.students.find((x) => x.id === kidAId);
    assert.equal(s.progress.reviewTracked, 2);
    assert.equal(s.progress.reviewDue, 1);
  });
});

describe('placement test', () => {
  test('placement page: kids only; parent summary shows the result', async () => {
    const kid = await login(famA.kid, '5555');
    const page = await fetch(BASE + '/practice/placement', { headers: { Cookie: await cookieOf(kid) } });
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes('מבחן מיקום'));
    const asParent = await fetch(BASE + '/practice/placement', { headers: { Cookie: await cookieOf(parentA) }, redirect: 'manual' });
    assert.ok([303, 307, 308].includes(asParent.status));

    const { json: p } = await kid('GET', '/api/me/progress');
    await kid('PUT', '/api/me/progress', { data: { ...p.data, placement: { date: '2026-11-22', passedThrough: 3 } }, baseVersion: p.version });
    const s = (await parentA('GET', '/api/family')).json.students.find((x) => x.id === kidAId);
    assert.deepEqual(s.progress.placement, { date: '2026-11-22', passedThrough: 3 });
  });
});

describe('dictation & practice hub', () => {
  test('pages are for kids only and list the sources', async () => {
    const kid = await login(famA.kid, '5555');
    const hub = await fetch(BASE + '/practice', { headers: { Cookie: await cookieOf(kid) } });
    assert.equal(hub.status, 200);
    const hubHtml = await hub.text();
    assert.ok(hubHtml.includes('הכתבה') && hubHtml.includes('שומעים ומאייתים'));
    const page = await fetch(BASE + '/practice/dictation', { headers: { Cookie: await cookieOf(kid) } });
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes('משפטים לכיתה'));
    for (const path of ['/practice', '/practice/dictation']) {
      const r = await fetch(BASE + path, { headers: { Cookie: await cookieOf(parentA) }, redirect: 'manual' });
      assert.ok([303, 307, 308].includes(r.status), path);
    }
  });

  test('dictation stats survive and show in the parent summary', async () => {
    const kid = await login(famA.kid, '5555');
    const { json: p } = await kid('GET', '/api/me/progress');
    const dictationStats = { 'd4-1': { c: 1, w: 0, t: 1 }, 'd4-2': { c: 0, w: 2, t: 1 } };
    assert.equal((await kid('PUT', '/api/me/progress', { data: { ...p.data, dictationStats }, baseVersion: p.version })).status, 200);
    const s = (await parentA('GET', '/api/family')).json.students.find((x) => x.id === kidAId);
    assert.equal(s.progress.dictationTried, 2);
    assert.equal(s.progress.dictationPerfect, 1);
  });
});

describe('grammar', () => {
  test('page is for kids; best scores show for parents', async () => {
    const kid = await login(famA.kid, '5555');
    const page = await fetch(BASE + '/practice/grammar', { headers: { Cookie: await cookieOf(kid) } });
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes('am / is / are'));
    const asParent = await fetch(BASE + '/practice/grammar', { headers: { Cookie: await cookieOf(parentA) }, redirect: 'manual' });
    assert.ok([303, 307, 308].includes(asParent.status));
    const { json: p } = await kid('GET', '/api/me/progress');
    await kid('PUT', '/api/me/progress', { data: { ...p.data, grammarStats: { be: { c: 7, w: 1, best: 88, t: 1 } } }, baseVersion: p.version });
    const s = (await parentA('GET', '/api/family')).json.students.find((x) => x.id === kidAId);
    assert.deepEqual(s.progress.grammar, { be: 88 });
  });
});

describe('reading comprehension', () => {
  test('page is for kids; parent summary shows stories and average', async () => {
    const kid = await login(famA.kid, '5555');
    const page = await fetch(BASE + '/practice/reading', { headers: { Cookie: await cookieOf(kid) } });
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes('קוראים ומבינים'));
    const asParent = await fetch(BASE + '/practice/reading', { headers: { Cookie: await cookieOf(parentA) }, redirect: 'manual' });
    assert.ok([303, 307, 308].includes(asParent.status));
    const { json: p } = await kid('GET', '/api/me/progress');
    const readingStats = { 'g4-zoo': { best: 100, reads: 1, t: 1 }, 'g4-rain': { best: 60, reads: 2, t: 1 } };
    await kid('PUT', '/api/me/progress', { data: { ...p.data, readingStats }, baseVersion: p.version });
    const s = (await parentA('GET', '/api/family')).json.students.find((x) => x.id === kidAId);
    assert.equal(s.progress.storiesRead, 2);
    assert.equal(s.progress.storiesAvg, 80);
  });
});

describe('speaking', () => {
  test('page is for kids; parent summary shows words said correctly', async () => {
    const kid = await login(famA.kid, '5555');
    const page = await fetch(BASE + '/practice/speaking', { headers: { Cookie: await cookieOf(kid) } });
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes('אומרים בקול'));
    const asParent = await fetch(BASE + '/practice/speaking', { headers: { Cookie: await cookieOf(parentA) }, redirect: 'manual' });
    assert.ok([303, 307, 308].includes(asParent.status));
    const { json: p } = await kid('GET', '/api/me/progress');
    const speakingStats = { cat: { ok: 1, tries: 1, t: 1 }, dog: { ok: 0, tries: 3, t: 1 } };
    await kid('PUT', '/api/me/progress', { data: { ...p.data, speakingStats }, baseVersion: p.version });
    const s = (await parentA('GET', '/api/family')).json.students.find((x) => x.id === kidAId);
    assert.equal(s.progress.speakingTried, 2);
    assert.equal(s.progress.speakingOk, 1);
  });
});

describe('per-kid module settings', () => {
  test('parent turns modules off: pages redirect, hub hides them, daily banner off; other families cannot', async () => {
    const kid = await login(famA.kid, '5555');
    const page = async (path) => fetch(BASE + path, { headers: { Cookie: await cookieOf(kid) }, redirect: 'manual' });

    assert.equal((await page('/practice/speaking')).status, 200);
    const r = await parentA('PATCH', `/api/family/students/${kidAId}`, { settings: { disabledModules: ['speaking', 'daily', 'not-a-module'] } });
    assert.equal(r.status, 200);
    const s = (await parentA('GET', '/api/family')).json.students.find((x) => x.id === kidAId);
    assert.deepEqual(s.settings.disabledModules, ['speaking', 'daily'], 'unknown ids dropped');
    assert.equal(s.displayName, 'Kid A', 'settings-only update keeps the name');

    const blocked = await page('/practice/speaking');
    assert.ok([303, 307, 308].includes(blocked.status));
    assert.ok((blocked.headers.get('location') || '').includes('/practice?off=1'));
    assert.ok([303, 307, 308].includes((await page('/practice/daily')).status));
    assert.equal((await page('/practice/grammar')).status, 200, 'other modules still open');

    const hub = await (await page('/practice')).text();
    assert.ok(!hub.includes('/practice/speaking') && !hub.includes('/practice/daily'));
    assert.ok(hub.includes('/practice/grammar'));

    assert.equal((await kid('GET', '/api/me/notices')).json.review.count, 0);
    assert.equal((await kid('PATCH', `/api/family/students/${kidAId}`, { settings: { disabledModules: [] } })).status, 403);
    assert.equal((await parentB('PATCH', `/api/family/students/${kidAId}`, { settings: { disabledModules: [] } })).status, 404);

    // turn everything back on
    await parentA('PATCH', `/api/family/students/${kidAId}`, { settings: { disabledModules: [] } });
    assert.equal((await page('/practice/speaking')).status, 200);
  });
});
