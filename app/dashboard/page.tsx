import PlatformShell from '@/components/platform/PlatformShell';
import DashboardVisuals from '@/components/platform/DashboardVisuals';
import { getDashboardData } from '@/lib/server/platformData';

export default function DashboardPage() {
  const data = getDashboardData();

  return (
    <PlatformShell title="Ana Sayfa">
      <DashboardVisuals data={data} />
    </PlatformShell>
  );
}
