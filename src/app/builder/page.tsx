// REDIRECT: /builder -> /studio/bms/builder
// Legacy route - kept for backward compatibility.
// Remove this file after 30-day deprecation window.
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LegacyRedirect() {
  redirect('/studio/bms/builder');
}
