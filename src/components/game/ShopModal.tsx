'use client';

import { useCallback, useEffect, useState } from 'react';
import { SHOP_AVATARS, SHOP_PETS, SHOP_THEMES, type ShopItem, type ShopTheme } from '@/content/game';
import { useGame } from './GameContext';

type Category = 'avatar' | 'pet' | 'theme';
type Reward = { id: string; title: string; cost: number };
type Redemption = { id: string; title: string; cost: number; status: 'pending' | 'fulfilled' | 'cancelled'; requestedAt: string; resolvedAt: string | null };

const EQUIP_KEY: Record<Category, string> = { avatar: 'equippedAvatar', pet: 'equippedPet', theme: 'equippedTheme' };
const formatDate = (iso: string | null) => {
  try {
    return iso ? new Date(iso).toLocaleDateString('he-IL') : '';
  } catch {
    return '';
  }
};

/** Rewards shop: app items (avatars, pets, themes) + real rewards set by the parents. */
export default function ShopModal() {
  const g = useGame();
  const [tab, setTab] = useState<'app' | 'parent'>('app');
  const close = () => g.setModal(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && g.setModal(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-pop" role="dialog" aria-modal="true" aria-label="חנות הפרסים">
        <div className="bg-gradient-to-l from-pink-500 via-purple-600 to-indigo-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛍️</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black">חנות הפרסים ובנק האנגלית</h2>
              <p className="text-xs text-white/85">
                היתרה שלך: <strong className="text-amber-300 text-sm" data-testid="shop-balance">{g.coins} 🪙</strong>
              </p>
            </div>
          </div>
          <button onClick={close} aria-label="סגירה" className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center font-black text-lg cursor-pointer">
            ✕
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2">
          <button
            onClick={() => setTab('app')}
            className={`px-4 py-2.5 rounded-t-2xl font-extrabold text-sm transition cursor-pointer ${tab === 'app' ? 'bg-white text-indigo-700 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            ✨ פרסים באפליקציה
          </button>
          <button
            onClick={() => setTab('parent')}
            className={`px-4 py-2.5 rounded-t-2xl font-extrabold text-sm transition cursor-pointer ${tab === 'parent' ? 'bg-white text-pink-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            🎁 פרסים מאבא ואמא
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{tab === 'app' ? <AppItems /> : <ParentRewards />}</div>
      </div>
    </div>
  );
}

function AppItems() {
  return (
    <div className="space-y-6">
      <Section title="👧 דמויות (אווטארים)" items={SHOP_AVATARS} category="avatar" />
      <Section title="🐾 חיות מחמד מעודדות" items={SHOP_PETS} category="pet" />
      <Section title="🎨 ערכות צבעים לאתר" items={SHOP_THEMES} category="theme" />
    </div>
  );
}

function Section({ title, items, category }: { title: string; items: (ShopItem | ShopTheme)[]; category: Category }) {
  return (
    <div>
      <h3 className="font-black text-slate-800 mb-2.5">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} category={category} />
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item, category }: { item: ShopItem | ShopTheme; category: Category }) {
  const g = useGame();
  const owned = g.list('ownedItems').includes(item.id);
  const equipped = g.data[EQUIP_KEY[category]] === item.id;
  const canAfford = g.coins >= item.cost;

  function equip(withSound = true) {
    g.mutate((d) => ({ ...d, [EQUIP_KEY[category]]: item.id }));
    if (withSound) g.sfx('pop');
  }

  function buy() {
    if (g.coins < item.cost || owned) return;
    g.mutate((d) => {
      const list = Array.isArray(d.ownedItems) ? (d.ownedItems as string[]) : [];
      if (list.includes(item.id) || (Number(d.coins) || 0) < item.cost) return d;
      return { ...d, coins: (Number(d.coins) || 0) - item.cost, ownedItems: [...list, item.id], [EQUIP_KEY[category]]: item.id };
    });
    g.sfx('fanfare');
    g.confetti();
    g.toast('תתחדשי! הרכישה הושלמה 🎉', '🛍️');
  }

  return (
    <div className={`bg-slate-50 border-2 ${equipped ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200'} rounded-2xl p-3 text-center flex flex-col justify-between`} data-testid={`shop-item-${item.id}`}>
      <div>
        {'preview' in item ? (
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.preview} flex items-center justify-center text-2xl mx-auto mb-2 shadow`}>{item.icon}</div>
        ) : (
          <div className="text-4xl mb-2">{item.emoji}</div>
        )}
        <div className="font-extrabold text-xs sm:text-sm text-slate-800 mb-2">{item.name}</div>
      </div>
      {equipped ? (
        <span className="block w-full py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black">✓ פעיל עכשיו</span>
      ) : owned ? (
        <button onClick={() => equip()} className="w-full py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-extrabold cursor-pointer">
          בחרי
        </button>
      ) : (
        <button
          onClick={buy}
          disabled={!canAfford}
          className={`w-full py-1.5 rounded-xl text-xs font-extrabold transition ${canAfford ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          קני ב-{item.cost} 🪙
        </button>
      )}
    </div>
  );
}

function ParentRewards() {
  const g = useGame();
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/me/rewards', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/login?expired=1';
        return;
      }
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { rewards?: Reward[]; redemptions?: Redemption[] };
      setRewards(Array.isArray(json.rewards) ? json.rewards : []);
      setRedemptions(Array.isArray(json.redemptions) ? json.redemptions : []);
    } catch {
      g.toast('לא הצלחנו לטעון את הפרסים, נסי שוב', '⚠️');
      setRewards((r) => r ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function redeem(r: Reward) {
    if (busy || g.coins < r.cost) return;
    setBusy(true);
    try {
      await g.flush(); // the server must see our latest coins first
      const res = await fetch('/api/me/redemptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rewardId: r.id }) });
      if (res.status === 401) {
        window.location.href = '/login?expired=1';
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        g.toast(json.message || 'לא הצלחנו לממש את הפרס', '⚠️');
        return;
      }
      await g.refresh(); // take the new coin balance from the server
      g.sfx('fanfare');
      g.confetti();
      g.toast(`יש! מימשת את הפרס: ${r.title} – עכשיו מחכים להורים`, '🎁');
      await load();
    } catch {
      g.toast('לא הצלחנו לממש את הפרס, נסי שוב', '⚠️');
    } finally {
      setBusy(false);
    }
  }

  if (!rewards) return <div className="text-center text-slate-500 font-bold py-10">טוען את הפרסים... ⏳</div>;
  const pending = redemptions.filter((r) => r.status === 'pending');
  const history = redemptions.filter((r) => r.status !== 'pending').slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs sm:text-sm text-amber-950">
        <strong>🎁 איך זה עובד?</strong> ההורים מגדירים כאן פרסים אמיתיים! כשצברת מספיק מטבעות, לחצי על <strong>&quot;מימשתי פרס!&quot;</strong> – הפרס יחכה כאן עד שההורים יסמנו שקיבלת אותו.
      </div>

      {pending.length > 0 && (
        <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4" data-testid="pending-rewards">
          <h4 className="font-extrabold text-sm text-sky-900 mb-2">⏳ מחכה להורים</h4>
          <div className="space-y-1.5">
            {pending.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-xs sm:text-sm bg-white border border-sky-200 rounded-xl px-3.5 py-2 text-sky-950 font-bold">
                <span>
                  🎁 {p.title} ({Number(p.cost)} 🪙)
                </span>
                <span className="text-sky-700 font-medium">{formatDate(p.requestedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rewards.length ? (
          rewards.map((r) => {
            const cost = Number(r.cost) || 1;
            const canAfford = g.coins >= cost;
            const pct = Math.min(100, Math.round((g.coins / cost) * 100));
            return (
              <div key={r.id} className={`bg-white border-2 ${canAfford ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'} rounded-2xl p-4`} data-testid="parent-reward">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-extrabold text-slate-800 text-base">{r.title}</div>
                    <div className="text-xs font-bold text-amber-700 mt-0.5">
                      מחיר: {cost} 🪙 (התקדמות: {pct}%)
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div className={`h-full ${canAfford ? 'bg-emerald-500' : 'bg-amber-400'} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => void redeem(r)}
                      disabled={!canAfford || busy}
                      className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition ${canAfford ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      {canAfford ? '🎉 מימשתי פרס!' : `חסרים ${cost - g.coins} 🪙`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-6">עוד אין פרסים. בקשי מההורים להוסיף פרסים באזור ההורים 🎁</div>
        )}
      </div>

      {history.length > 0 && (
        <div>
          <h4 className="font-extrabold text-sm text-slate-700 mb-2">📜 היסטוריית פרסים</h4>
          <div className="space-y-1.5">
            {history.map((h) => (
              <div
                key={h.id}
                className={`flex justify-between items-center text-xs ${h.status === 'fulfilled' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'} border rounded-xl px-3.5 py-2 font-medium`}
              >
                <span>
                  {h.status === 'fulfilled' ? '🎉' : '↩️'} {h.title} ({Number(h.cost)} 🪙){h.status === 'cancelled' ? ' – בוטל, המטבעות הוחזרו' : ''}
                </span>
                <span>{formatDate(h.resolvedAt || h.requestedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
