// Authorization & flow tests against a RUNNING app (never point this at production).
//   BASE_URL=http://127.0.0.1:3000 ADMIN_USERNAME=admin ADMIN_PASSWORD=... node --test tests/
// Creates its own families/users with random names, so it can run repeatedly.
import assert from 'node:assert/strict';
import { before, describe, test } from 'node:test';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const ADMIN = { username: process.env.ADMIN_USERNAME ?? 'admin', password: process.env.ADMIN_PASSWORD ?? '' };
const rnd = () => Math.random().toString(36).slice(2, 8);

/** Minimal client with its own cookie (= one browser/device). */
function client() {
  let cookie = '';
  return async function call(method, path, body, headers = {}) {
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
