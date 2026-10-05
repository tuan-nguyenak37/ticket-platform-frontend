import { notFound } from 'next/navigation';
import { ModeratorSection } from '../../_components/ModeratorSection';
import { sectionContent, type SectionKey } from '../../_lib/moderator.mock';

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!Object.hasOwn(sectionContent, section)) notFound();
  return <ModeratorSection key={section} section={section as SectionKey} />;
}
