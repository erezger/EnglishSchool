'use client';

import { useEffect } from 'react';
import { LEGACY_MARKUP } from '@/legacy/markup';

/**
 * Stage 1 of the migration: renders the original app's markup as-is and boots
 * its client logic (src/legacy/app.js). The script relies on inline onclick
 * handlers and window.* functions, so the markup is injected verbatim.
 * Next stage: split this into real React components.
 */
export default function LegacyApp() {
  useEffect(() => {
    // Dynamic import runs the module exactly once (it is cached afterwards),
    // so React Strict Mode's double effect in dev is harmless.
    import('@/legacy/app.js').catch((err) => {
      console.error('Failed to start the app', err);
    });
  }, []);

  return <div id="legacy-root" dangerouslySetInnerHTML={{ __html: LEGACY_MARKUP }} />;
}
