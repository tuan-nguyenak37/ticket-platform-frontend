import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface Props {
  names: string[]; index: number; paused: boolean; reducedMotion: boolean;
  onSelect: (index: number) => void; onToggle: () => void;
}
const control = 'flex size-10 items-center justify-center rounded-full border border-white/25 bg-slate-950/65 text-white shadow-lg shadow-violet-500/20 backdrop-blur transition-all duration-300 hover:border-fuchsia-300/70 hover:bg-slate-950/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 motion-reduce:transition-none sm:size-12';

export function CarouselControls({ names, index, paused, reducedMotion, onSelect, onToggle }: Props) {
  return <>
    <button type="button" aria-label="Sự kiện trước" onClick={() => onSelect(index - 1)} className={`absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-5 ${control}`}><ChevronLeft size={22} aria-hidden="true" /></button>
    <button type="button" aria-label="Sự kiện tiếp theo" onClick={() => onSelect(index + 1)} className={`absolute right-3 top-1/2 z-20 -translate-y-1/2 sm:right-5 ${control}`}><ChevronRight size={22} aria-hidden="true" /></button>
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/20 bg-slate-950/65 px-3 backdrop-blur sm:bottom-5" aria-label="Chọn sự kiện nổi bật">
      {names.map((name, i) => <button type="button" key={`${i}-${name}`} aria-label={`Chọn sự kiện ${i + 1}: ${name}`} aria-current={i === index ? 'true' : undefined} onClick={() => onSelect(i)} className="flex size-9 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-violet-300"><span className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${i === index ? 'w-6 bg-fuchsia-300' : 'w-2 bg-white/60'}`} /></button>)}
    </div>
    {!reducedMotion && <button type="button" aria-label={paused ? 'Bật tự chuyển sự kiện' : 'Dừng tự chuyển sự kiện'} onClick={onToggle} className={`absolute bottom-3 right-3 z-20 sm:bottom-5 sm:right-5 ${control}`}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>}
  </>;
}
