import { permanentRedirect } from 'next/navigation';
import { APP_ROUTES } from '@/lib/routes';

export default function TrackerIndex() {
  permanentRedirect(APP_ROUTES.today);
}
