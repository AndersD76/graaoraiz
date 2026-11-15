import type { ReactNode } from 'react';
import { MolduraSite } from '@/components/moldura-site';

export default function LayoutSite({ children }: { children: ReactNode }) {
  return <MolduraSite>{children}</MolduraSite>;
}
