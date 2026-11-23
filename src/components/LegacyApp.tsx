'use client';

import { useEffect } from 'react';
import { LEGACY_MARKUP } from '@/legacy/markup';
import type { KidSettings } from '@/lib/modules';
import type { Progress } from '@/lib/progress';

export type LegacyBoot = {
  user: { id: string; username: string; displayName: string };
  progress: Progress | null;
  settings: KidSettings;
};

declare global {
  interface Window {
    __EC_BOOT__?: LegacyBoot;
  }
}

/**
 * The game: renders the original app's markup as-is and boots its client logic
 * (src/legacy/app.js) for the logged-in student passed in `boot`.
 * The script relies on inline onclick handlers and window.* functions, so the
 * markup is injected verbatim. Switching user always does a full page load,
 * so the module (which runs once) always starts with the right student.
 */
export default function LegacyApp({ boot }: { boot: LegacyBoot }) {
  useEffect(() => {
    window.__EC_BOOT__ = boot;
    import('@/legacy/app.js').catch((err) => {
      console.error('Failed to start the app', err);
    });
    // boot is fixed for the lifetime of this page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id="legacy-root" dangerouslySetInnerHTML={{ __html: LEGACY_MARKUP }} />;
}
