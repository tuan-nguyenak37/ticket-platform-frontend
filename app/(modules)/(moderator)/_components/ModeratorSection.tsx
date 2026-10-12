import { sectionContent, type SectionKey } from '../_lib/moderator.sections';

export function ModeratorSection({ section }: { section: SectionKey }) {
  const content = sectionContent[section];
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight">{content.title}</h1><p className="mt-2 text-sm text-slate-500">{content.description}</p></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><p className="text-sm text-slate-500">Chức năng này chưa được tích hợp API trên giao diện.</p></section>
  </div>;
}
