import { redirect } from 'next/navigation';

/** Old address of the React game while it was being built — the game now lives at "/". */
export default function PlayPage() {
  redirect('/');
}
