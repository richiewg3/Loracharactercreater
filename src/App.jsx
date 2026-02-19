import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Info,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';

const DEFAULT_MODIFIERS = {
  hair: 'shoulder-length wavy dark brown hair',
  outfit: 'mustard-yellow raglan t-shirt with heather-gray sleeves',
  expression: 'neutral expression',
  accessory: 'red paisley bandana',
  activeModifiers: ['hair', 'outfit', 'expression', 'accessory'],
};

const DEFAULT_PROMPTS = [
  `WHO/WHAT/WHERE: A young adult male with light-medium tan skin and faint freckles, brown almond eyes, thick eyebrows, clean-shaven face, shoulder-length wavy dark brown hair, wearing a red paisley bandana tied across his forehead and a fitted mustard-yellow raglan t-shirt with heather-gray sleeves (no logos). The exact frozen instant is him facing the camera head-on with a relaxed neutral expression and lips gently closed. He is centered in frame, standing 6 feet from a seamless medium-gray studio backdrop; visible anchors: smooth paper sweep behind him, subtle floor-to-backdrop curve line, soft shadow under chin, faint shadow falloff behind shoulders, and a catchlight in both eyes. Micro-details/textures: visible skin pores; tiny freckles across cheeks; individual hair strands around temples; bandana cotton weave and paisley print edges; shirt collar rib knit; slight fabric wrinkles at shoulders; subtle lip texture; tiny eyebrow hairs. Camera: 85mm portrait lens, eye-level, tight head-and-shoulders crop, f/2.8, sharp focus on irises, shallow depth of field, high resolution. Lighting: softbox key light 45° camera-left, gentle fill camera-right, faint rim light separating hair from background, neutral 5200K, soft shadows.`,
];

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

const App = () => {
  const [prompts, setPrompts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);

  // Global Modifiers
  const [modifiers, setModifiers] = useState(DEFAULT_MODIFIERS);

  // Handle Initial Load
  useEffect(() => {
    const saved = localStorage.getItem('lora-prompts');
    if (saved) {
      const parsed = safeParseJson(saved, []);
      if (Array.isArray(parsed)) setPrompts(parsed);
    }
  }, []);

  const saveToLocal = (data) => {
    localStorage.setItem('lora-prompts', JSON.stringify(data));
  };

  const parsePrompts = () => {
    const rawBlocks = inputText.split(/\d+\)/).filter((b) => b.trim().length > 10);
    const newPrompts = rawBlocks.map((text, i) => {
      const cleanText = text.trim();
      return {
        id: i + 1,
        original: cleanText,
        variables: { ...DEFAULT_MODIFIERS, ...modifiers },
      };
    });
    setPrompts(newPrompts);
    saveToLocal(newPrompts);
    setInputText('');
  };

  const updatePrompt = (idx, key, value) => {
    setPrompts((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        variables: { ...updated[idx].variables, [key]: value },
      };
      saveToLocal(updated);
      return updated;
    });
  };

  const applyGlobal = (key) => {
    const updated = prompts.map((p) => ({
      ...p,
      variables: { ...p.variables, [key]: modifiers[key] },
    }));
    setPrompts(updated);
    saveToLocal(updated);
  };

  const getFinalText = (p) => {
    let text = p.original;
    const active = new Set(p.variables?.activeModifiers || DEFAULT_MODIFIERS.activeModifiers);

    const replacements = [
      {
        key: 'hair',
        search: /shoulder-length wavy dark brown hair/gi,
        replace: p.variables.hair,
      },
      {
        key: 'outfit',
        search: /mustard-yellow raglan t-shirt with heather-gray sleeves/gi,
        replace: p.variables.outfit,
      },
      { key: 'expression', search: /relaxed neutral expression/gi, replace: p.variables.expression },
      { key: 'expression', search: /neutral expression/gi, replace: p.variables.expression },
      { key: 'accessory', search: /red paisley bandana/gi, replace: p.variables.accessory },
    ];

    replacements.forEach((r) => {
      if (!active.has(r.key)) return;
      if (!r.replace) return;
      text = text.replace(r.search, r.replace);
    });

    return text;
  };

  const generateCaption = (p) => {
    const v = p.variables;
    return `Young adult male, ${v.hair}, wearing ${v.outfit}${v.accessory ? ` and ${v.accessory}` : ''}, ${v.expression}, high resolution, studio portrait.`;
  };

  const copyToClipboard = async (text, id) => {
    try {
      await copyText(text);
      setCopyStatus(id);
      setTimeout(() => setCopyStatus(null), 2000);
    } catch {
      // no-op: browsers may block clipboard without user gesture
    }
  };

  const copyAll = () => {
    const all = prompts
      .map((p) => {
        const promptText = getFinalText(p);
        const captionText = generateCaption(p);
        return `Prompt: ${promptText}\nCaption: ${captionText}\n---`;
      })
      .join('\n');
    copyToClipboard(all, 'all');
  };

  const placeholderText = useMemo(() => {
    return DEFAULT_PROMPTS.map((p, idx) => `${idx + 1}) ${p}`).join('\n\n');
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="text-yellow-400" /> LoRA Prompt Ad-Lib
          </h1>
          <p className="text-slate-400">Customize and caption your training dataset efficiently.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyAll}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            {copyStatus === 'all' ? <Check size={18} /> : <Copy size={18} />}
            Copy All Prompts & Captions
          </button>
          <button
            onClick={() => {
              if (confirm('Clear everything?')) {
                setPrompts([]);
                localStorage.removeItem('lora-prompts');
              }
            }}
            className="p-2 bg-slate-800 hover:bg-red-900/40 rounded-lg text-slate-400 hover:text-red-400 transition-all"
            aria-label="Clear prompts"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Global Settings */}
        <aside className="lg:col-span-4 space-y-6">
          <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <div className="flex items-center gap-2 mb-4 text-blue-400 font-bold uppercase text-xs tracking-widest">
              <Settings size={16} /> Global Modifiers
            </div>

            <div className="space-y-4">
              {['hair', 'outfit', 'expression', 'accessory'].map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium text-slate-300 capitalize flex justify-between">
                    {key}
                    <button
                      onClick={() => applyGlobal(key)}
                      className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 rounded flex items-center gap-1 transition-colors"
                      type="button"
                    >
                      <RefreshCw size={10} /> Apply to All
                    </button>
                  </label>
                  <input
                    type="text"
                    value={modifiers[key]}
                    onChange={(e) => setModifiers({ ...modifiers, [key]: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={`Define ${key}...`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-2 mb-4 text-purple-400 font-bold uppercase text-xs tracking-widest">
                <Info size={16} /> Quick Tips
              </div>
              <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                <li>Paste prompts in "1) [Text]" format.</li>
                <li>Edits will replace common keywords in the original prompt.</li>
                <li>Captions are generated automatically based on your overrides.</li>
              </ul>
            </div>
          </section>

          {prompts.length === 0 && (
            <section className="bg-blue-900/20 p-6 rounded-2xl border border-blue-500/30">
              <h3 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                <FileText size={18} /> Import Prompts
              </h3>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={placeholderText || 'Paste your prompts here...'}
                className="w-full h-40 bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm mb-3 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={parsePrompts}
                disabled={!inputText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Initialize Dataset
              </button>
            </section>
          )}
        </aside>

        {/* Main Content: Prompt List */}
        <div className="lg:col-span-8 space-y-4">
          {prompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-700 rounded-3xl text-slate-500">
              <User size={48} className="mb-4 opacity-20" />
              <p>No prompts loaded yet.</p>
            </div>
          ) : (
            prompts.map((p, idx) => {
              const isOpen = selectedPromptIdx === idx;
              const finalText = getFinalText(p);
              const finalCaption = generateCaption(p);

              return (
                <div
                  key={idx}
                  className={`bg-slate-800 rounded-2xl border transition-all overflow-hidden ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-700 hover:border-slate-600'}`}
                >
                  {/* Collapsed View */}
                  <div
                    onClick={() => setSelectedPromptIdx(isOpen ? null : idx)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedPromptIdx(isOpen ? null : idx);
                    }}
                  >
                    <div className="flex items-center gap-4 truncate">
                      <span className="bg-slate-700 text-blue-400 font-bold w-8 h-8 rounded-full flex items-center justify-center text-xs">
                        {p.id}
                      </span>
                      <div className="truncate">
                        <p className="text-sm font-semibold truncate text-slate-200">{finalCaption}</p>
                        <p className="text-xs text-slate-500 truncate mt-1">{finalText}</p>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="text-slate-500" />
                    ) : (
                      <ChevronRight className="text-slate-500" />
                    )}
                  </div>

                  {/* Expanded View */}
                  {isOpen && (
                    <div className="p-6 pt-0 border-t border-slate-700/50 bg-slate-800/50 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                            <Settings size={14} /> Individual Overrides
                          </h4>
                          {['hair', 'outfit', 'expression', 'accessory'].map((key) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-[10px] w-20 text-slate-500 uppercase">{key}</span>
                              <input
                                type="text"
                                value={p.variables[key]}
                                onChange={(e) => updatePrompt(idx, key, e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs outline-none focus:border-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                            <Check size={14} /> Live Output
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Modified Prompt</span>
                                <button
                                  onClick={() => copyToClipboard(finalText, `p-${idx}`)}
                                  className="text-slate-500 hover:text-blue-400"
                                  type="button"
                                >
                                  {copyStatus === `p-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                              <p className="text-xs leading-relaxed text-slate-300">{finalText}</p>
                            </div>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Auto Caption</span>
                                <button
                                  onClick={() => copyToClipboard(finalCaption, `c-${idx}`)}
                                  className="text-slate-500 hover:text-green-400"
                                  type="button"
                                >
                                  {copyStatus === `c-${idx}` ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                              <p className="text-xs italic text-green-300/80">{finalCaption}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>
    </div>
  );
};

export default App;

