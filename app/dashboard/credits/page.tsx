import { redirect } from 'next/navigation';

export default function DeprecatedCreditsPage() {
  redirect('/ledger');
}
