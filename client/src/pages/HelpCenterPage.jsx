import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HelpCircle, Search, BookOpen, Video, FileQuestion, Headphones, Info, ChevronRight, Play, MessageCircle, Mail, Phone, Clock, Keyboard } from 'lucide-react';
import api from '../services/api.js';
import WorkerAvatar from '../components/WorkerAvatar.jsx';
import { Modal, EmptyState, LoadingRows, ErrorBox } from '../components/ui/common.jsx';
import { btnPrimary } from '../components/ui/helpers.js';

const card = 'bg-white rounded-card border border-[#DEDCCF] p-5 shadow-card space-y-4';
const match = (q, ...fields) => !q || fields.some((f) => String(f || '').toLowerCase().includes(q));
const CONTACT_ICON = { whatsapp: MessageCircle, email: Mail, phone: Phone, hours: Clock };
const CONTACT_HREF = {
  whatsapp: (v) => `https://wa.me/62${v.replace(/\D/g, '').replace(/^0/, '')}`,
  email: (v) => `mailto:${v}`,
  phone: (v) => `tel:${v.replace(/\D/g, '')}`,
};

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [guide, setGuide] = useState(null);
  const [video, setVideo] = useState(null);
  const q = useQuery({ queryKey: ['help'], queryFn: async () => (await api.get('/help')).data.data });
  const term = search.trim().toLowerCase();
  const data = useMemo(() => q.data || {}, [q.data]);
  const list = (k) => data[k] || [];

  const guides = list('guide').filter((g) => match(term, g.title, g.body));
  const videos = list('video').filter((v) => match(term, v.title, v.body));
  const faqs = list('faq').filter((f) => match(term, f.title, f.body));
  const shortcuts = list('shortcut').filter((s) => match(term, s.title, s.body));
  const contacts = list('contact');
  const about = list('about');
  const nothing = term && !guides.length && !videos.length && !faqs.length && !shortcuts.length;

  const splitGuide = (g) => {
    const [summary, steps = ''] = String(g.body || '').split('\n\n');
    return { summary, steps: steps.split('\n').filter(Boolean) };
  };

  const quick = [
    { icon: BookOpen, title: 'Panduan Penggunaan', desc: 'Langkah demi langkah sistem', to: 'help-panduan' },
    { icon: Video, title: 'Video Tutorial', desc: 'Ringkasan video panduan', to: 'help-video' },
    { icon: FileQuestion, title: 'Pertanyaan Umum', desc: 'Jawaban pertanyaan umum', to: 'help-faq' },
    { icon: Headphones, title: 'Hubungi Kami', desc: 'Tim kami siap membantu', to: 'help-kontak' },
    { icon: Info, title: 'Tentang Aplikasi', desc: 'Versi & pintasan keyboard', to: 'help-tentang' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-card border border-[#DEDCCF] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-xl w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#234536] text-white flex items-center justify-center shrink-0 shadow-sm"><HelpCircle className="w-5 h-5" /></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#252922] tracking-tight">Pusat Bantuan</h1>
              <p className="text-xs text-[#625D53]">Temukan panduan, video tutorial, dan jawaban atas pertanyaan Anda.</p>
            </div>
          </div>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8C877D] absolute left-3.5 pointer-events-none" />
            <input type="text" aria-label="Cari bantuan" placeholder="Ketik pertanyaan, misalnya: tambah barang, laba rugi, atau kasbon mandor..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-20 py-3 bg-[#F7F4ED] border border-[#DEDCCF] rounded-control text-xs font-semibold text-[#252922] focus:outline-none focus:border-[#234536] focus:bg-white transition" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 text-xs text-[#8C877D] hover:text-[#252922] font-bold cursor-pointer">Reset</button>}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[#F7F4ED] p-4 rounded-card border border-[#DEDCCF] md:max-w-xs shrink-0">
          <WorkerAvatar size={56} helmet="#F4B400" />
          <div className="text-xs">
            <div className="font-extrabold text-[#252922]">Tim Bantuan StokMaterial.id</div>
            <div className="text-[11px] text-[#625D53] mt-0.5 leading-snug">Kami siap membantu Anda menggunakan sistem toko bangunan dengan lancar.</div>
          </div>
        </div>
      </div>

      {q.isLoading ? <div className={card}><LoadingRows /></div> : q.isError ? <div className={card}><ErrorBox error={q.error} onRetry={q.refetch} /></div> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quick.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.to} onClick={() => scrollTo(item.to)} className="text-left p-3.5 bg-white rounded-card border border-[#DEDCCF] shadow-card hover:border-[#234536] transition cursor-pointer flex flex-col justify-between h-28">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#234536] flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                  <div>
                    <div className="font-extrabold text-xs text-[#252922]">{item.title}</div>
                    <div className="text-[10px] text-[#8C877D] mt-0.5 leading-tight">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {nothing && <div className={card}><EmptyState icon={Search} title="Tidak ada hasil" desc={`Tidak ada bantuan yang cocok dengan "${search}". Coba kata kunci lain atau hubungi tim kami.`} /></div>}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {(!term || guides.length > 0) && (
              <div id="help-panduan" className={`scroll-mt-4 lg:col-span-7 ${card}`}>
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]"><BookOpen className="w-4 h-4 text-[#234536]" /><h3 className="font-extrabold text-sm text-[#252922]">Panduan Penggunaan</h3></div>
                {guides.length === 0 ? <EmptyState title="Belum ada panduan" /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {guides.map((g, i) => (
                      <button key={g.id} onClick={() => setGuide(g)} className="text-left p-3.5 rounded-card bg-[#F7F4ED]/60 border border-[#DEDCCF] hover:bg-[#F7F4ED] hover:border-[#234536] transition cursor-pointer flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#234536] text-white flex items-center justify-center text-xs font-black shrink-0">{String(i + 1).padStart(2, '0')}</div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-xs text-[#252922] leading-tight">{g.extra} {g.title}</div>
                          <div className="text-[11px] text-[#625D53] mt-1 leading-snug">{splitGuide(g).summary}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(!term || videos.length > 0) && (
              <div id="help-video" className={`scroll-mt-4 lg:col-span-5 ${card}`}>
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]"><Video className="w-4 h-4 text-[#234536]" /><h3 className="font-extrabold text-sm text-[#252922]">Video Tutorial</h3></div>
                {videos.length === 0 ? <EmptyState title="Belum ada video" /> : (
                  <div className="space-y-2.5">
                    {videos.map((v) => (
                      <button key={v.id} onClick={() => setVideo(v)} className="w-full text-left p-2.5 rounded-card bg-[#F7F4ED]/50 border border-[#DEDCCF] hover:bg-[#F7F4ED] transition cursor-pointer flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-lg bg-stone-200 border border-[#DEDCCF] flex items-center justify-center text-[#234536] shrink-0"><Play className="w-4 h-4 fill-current" /></span>
                          <span><span className="block font-bold text-xs text-[#252922]">{v.title}</span><span className="block text-[10px] text-[#625D53] mt-0.5">{v.body}</span></span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#DEDCCF] text-[10px] font-bold text-[#625D53] shrink-0 font-mono">{v.extra}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {(!term || faqs.length > 0) && (
              <div id="help-faq" className={`scroll-mt-4 lg:col-span-7 ${card} !space-y-3`}>
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]"><FileQuestion className="w-4 h-4 text-[#234536]" /><h3 className="font-extrabold text-sm text-[#252922]">Pertanyaan yang Sering Diajukan</h3></div>
                {faqs.length === 0 ? <EmptyState title="Belum ada pertanyaan umum" /> : faqs.map((f) => (
                  <div key={f.id} className="border border-[#DEDCCF] rounded-control overflow-hidden">
                    <button onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)} aria-expanded={openFaq === f.id} className="w-full flex items-center justify-between gap-2 p-3 bg-[#F7F4ED]/50 hover:bg-[#F7F4ED] text-left text-xs font-bold text-[#252922] cursor-pointer">
                      <span>{f.title}</span><ChevronRight className={`w-4 h-4 transition ${openFaq === f.id ? 'rotate-90' : ''}`} />
                    </button>
                    {(openFaq === f.id || !!term) && <div className="p-3 text-xs text-[#625D53] leading-relaxed border-t border-[#DEDCCF]">{f.body}</div>}
                  </div>
                ))}
              </div>
            )}

            <div id="help-kontak" className={`scroll-mt-4 lg:col-span-5 ${card}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]"><Headphones className="w-4 h-4 text-[#234536]" /><h3 className="font-extrabold text-sm text-[#252922]">Hubungi Kami</h3></div>
              {contacts.length === 0 ? <EmptyState title="Kontak belum tersedia" /> : (
                <ul className="space-y-2">
                  {contacts.map((c) => {
                    const Icon = CONTACT_ICON[c.extra] || Info;
                    const href = CONTACT_HREF[c.extra]?.(c.body);
                    const inner = (
                      <>
                        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-[#234536] flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
                        <span><span className="block text-[10px] text-[#8C877D] font-bold">{c.title}</span><span className="block text-xs font-extrabold text-[#252922]">{c.body}</span></span>
                      </>
                    );
                    return (
                      <li key={c.id}>
                        {href ? <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 rounded-control bg-[#F7F4ED]/60 border border-[#DEDCCF] hover:border-[#234536] transition">{inner}</a>
                          : <div className="flex items-center gap-3 p-2.5 rounded-control bg-emerald-50/60 border border-emerald-200/80">{inner}</div>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div id="help-tentang" className="scroll-mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {(!term || shortcuts.length > 0) && (
              <div className={`lg:col-span-7 ${card}`}>
                <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]"><Keyboard className="w-4 h-4 text-[#234536]" /><h3 className="font-extrabold text-sm text-[#252922]">Pintasan Keyboard</h3></div>
                {shortcuts.length === 0 ? <EmptyState title="Belum ada pintasan" /> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {shortcuts.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 p-2.5 rounded-control bg-[#F7F4ED]/60 border border-[#DEDCCF] text-xs">
                        <span className="text-[#625D53] font-semibold">{s.title}</span>
                        <kbd className="px-2 py-0.5 rounded bg-white border border-[#DEDCCF] font-mono font-bold text-[#234536] text-[11px]">{s.body}</kbd>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className={`lg:col-span-5 ${card}`}>
              <div className="flex items-center gap-2 pb-2 border-b border-[#DEDCCF]"><Info className="w-4 h-4 text-[#234536]" /><h3 className="font-extrabold text-sm text-[#252922]">Tentang Aplikasi</h3></div>
              <dl className="divide-y divide-[#DEDCCF]/70 text-xs">
                {about.map((a) => <div key={a.id} className="py-2 flex justify-between gap-3"><dt className="text-[#625D53]">{a.title}</dt><dd className="font-bold text-[#252922] text-right">{a.body}</dd></div>)}
              </dl>
            </div>
          </div>
        </>
      )}

      {guide && (
        <Modal title={guide.title} subtitle={splitGuide(guide).summary} onClose={() => setGuide(null)}>
          <ol className="list-decimal list-inside space-y-2 text-xs text-[#252922]">
            {splitGuide(guide).steps.map((st) => <li key={st}>{st}</li>)}
          </ol>
          <div className="flex justify-end pt-4"><button onClick={() => setGuide(null)} className={btnPrimary}>Tutup Panduan</button></div>
        </Modal>
      )}
      {video && (
        <Modal title={video.title} subtitle={`Durasi ${video.extra}`} onClose={() => setVideo(null)}>
          <p className="text-xs text-[#625D53]">{video.body}</p>
          <p className="text-[11px] text-[#8C877D] mt-3">Video belum diunggah ke server ini. Ikuti langkah terkait di bagian Panduan Penggunaan.</p>
          <div className="flex justify-end pt-4"><button onClick={() => { setVideo(null); scrollTo('help-panduan'); }} className={btnPrimary}>Lihat Panduan</button></div>
        </Modal>
      )}
    </div>
  );
}
