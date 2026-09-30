import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  Code,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowRight,
  Maximize2,
  X,
  FileText,
  Clock,
  Layers,
  Terminal,
  Share2,
} from 'lucide-react';

interface NoteRendererProps {
  content: string;
  topicTitle: string;
  subjectName?: string;
  depthLevel?: string;
}

// Simple syntax highlighter for code snippets
function renderSyntaxHighlightedCode(code: string, language: string) {
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    // Quick token styling
    const isComment = line.trim().startsWith('#') || line.trim().startsWith('//');
    if (isComment) {
      return (
        <div key={lineIdx} className="text-slate-400 dark:text-slate-500 italic">
          {line || ' '}
        </div>
      );
    }

    return (
      <div key={lineIdx} className="leading-relaxed">
        {line || ' '}
      </div>
    );
  });
}

// Parses visual flowchart syntax like [Node A] --> [Node B] --> [Node C]
interface FlowNode {
  id: string;
  label: string;
  arrowLabel?: string;
}

function parseFlowchartLines(text: string): FlowNode[][] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const rows: FlowNode[][] = [];

  for (const line of lines) {
    if (line.includes('-->') || line.includes('->')) {
      const parts = line.split(/-->|->/);
      const row: FlowNode[] = parts.map((part, idx) => {
        let label = part.trim().replace(/^\[|\]$/g, '').replace(/^\(|\)$/g, '');
        return {
          id: `node_${idx}_${label.slice(0, 10)}`,
          label: label || 'Step',
        };
      });
      if (row.length > 1) {
        rows.push(row);
      }
    }
  }

  return rows;
}

export const NoteRenderer: React.FC<NoteRendererProps> = ({
  content,
  topicTitle,
  subjectName,
  depthLevel = 'Standard',
}) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [zoomedImage, setZoomedImage] = useState<{ src: string; alt: string } | null>(null);
  const [activeDiagramView, setActiveDiagramView] = useState<Record<number, 'visual' | 'code'>>({});

  // Reading time estimate (approx 200 wpm)
  const wordsCount = content.split(/\s+/).length;
  const readTimeMin = Math.max(1, Math.round(wordsCount / 180));

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const toggleReveal = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Split into major markdown sections
  const sections = content.split(/\n(?=## )/);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Visual Study Note Header / Cover */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-indigo-500/20 shadow-xl shadow-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide uppercase">
                {subjectName || 'Study Buddy'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                Level: {depthLevel.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{readTimeMin} min read</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Structured Notes</span>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {topicTitle}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-2xl">
              Comprehensive high-retention study breakdown featuring conceptual diagrams, code blocks, visual illustrations, and self-checks.
            </p>
          </div>
        </div>
      </div>

      {/* Render Note Sections */}
      <div className="space-y-6">
        {sections.map((section, sIdx) => {
          const lines = section.trim().split('\n');
          const headerLine = lines[0] || '';
          const bodyLines = lines.slice(1).join('\n').trim();

          const isOverview = headerLine.includes('Overview') || headerLine.includes('Executive Summary');
          const isDiagram = headerLine.includes('Diagram') || headerLine.includes('Flowchart');
          const isPrinciples = headerLine.includes('Principles') || headerLine.includes('Breakdown') || headerLine.includes('Mechanism');
          const isCode = headerLine.includes('Code') || headerLine.includes('Formula') || headerLine.includes('Implementation');
          const isPicture = headerLine.includes('Visual') || headerLine.includes('Picture') || headerLine.includes('Illustration');
          const isAnalogy = headerLine.includes('Analogy') || headerLine.includes('Metaphor');
          const isPitfalls = headerLine.includes('Pitfalls') || headerLine.includes('Misconceptions') || headerLine.includes('Traps');
          const isSelfCheck = headerLine.includes('Self-Check') || headerLine.includes('Challenge') || headerLine.includes('Question');

          const cleanHeader = headerLine.replace(/^##\s*/, '').trim();

          // Section 1: Overview Card
          if (isOverview) {
            return (
              <div
                key={sIdx}
                className="p-5 sm:p-6 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs space-y-3"
              >
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3>{cleanHeader}</h3>
                </div>
                <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-2">
                  {bodyLines.split('\n\n').map((p, pIdx) => (
                    <p key={pIdx}>{p.replace(/^[-*]\s*/, '')}</p>
                  ))}
                </div>
              </div>
            );
          }

          // Section 2: Visual Diagram / Flowchart
          if (isDiagram || bodyLines.includes('```diagram') || bodyLines.includes('```mermaid')) {
            // Extract diagram text inside code fences if present
            const match = bodyLines.match(/```(?:diagram|mermaid|flowchart)?([\s\S]*?)```/);
            const diagramCode = match ? match[1].trim() : bodyLines;
            const flowRows = parseFlowchartLines(diagramCode);
            const viewMode = activeDiagramView[sIdx] || (flowRows.length > 0 ? 'visual' : 'code');

            return (
              <div
                key={sIdx}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/60 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400 font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-violet-600 text-white">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3>{cleanHeader || 'Visual Concept Diagram'}</h3>
                  </div>

                  {flowRows.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                      <button
                        onClick={() => setActiveDiagramView((p) => ({ ...p, [sIdx]: 'visual' }))}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          viewMode === 'visual'
                            ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-2xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Visual Nodes
                      </button>
                      <button
                        onClick={() => setActiveDiagramView((p) => ({ ...p, [sIdx]: 'code' }))}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                          viewMode === 'code'
                            ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-2xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Text Tree
                      </button>
                    </div>
                  )}
                </div>

                {/* Visual Flow Renderer */}
                {viewMode === 'visual' && flowRows.length > 0 ? (
                  <div className="py-4 px-2 space-y-4 overflow-x-auto">
                    {flowRows.map((row, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 min-w-max">
                        {row.map((node, nIdx) => (
                          <React.Fragment key={node.id}>
                            <div className="px-3.5 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-300 dark:border-violet-700 text-violet-900 dark:text-violet-200 text-xs font-bold shadow-xs">
                              {node.label}
                            </div>
                            {nIdx < row.length - 1 && (
                              <div className="flex items-center gap-1 text-violet-400 dark:text-violet-500 font-bold text-xs shrink-0">
                                <span className="h-0.5 w-4 bg-violet-300 dark:bg-violet-700" />
                                <ArrowRight className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ASCII / Text Diagram */
                  <div className="p-4 rounded-xl bg-slate-900 text-violet-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                    <pre>{diagramCode}</pre>
                  </div>
                )}
              </div>
            );
          }

          // Section 3: Code Implementation / Formula
          if (isCode || bodyLines.includes('```')) {
            const codeBlockRegex = /```(\w+)?([\s\S]*?)```/g;
            const matches = [...bodyLines.matchAll(codeBlockRegex)];

            if (matches.length > 0) {
              return (
                <div key={sIdx} className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                      <Code className="w-4 h-4" />
                    </div>
                    <h3>{cleanHeader || 'Code & Formula Implementation'}</h3>
                  </div>

                  {/* Render preamble if any */}
                  {bodyLines.split('```')[0].trim() && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {bodyLines.split('```')[0].trim()}
                    </p>
                  )}

                  {matches.map((m, mIdx) => {
                    const lang = m[1] || 'code';
                    const code = m[2].trim();
                    const codeId = sIdx * 100 + mIdx;

                    return (
                      <div
                        key={mIdx}
                        className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md text-slate-200"
                      >
                        {/* Terminal Window Header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                            </div>
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 ml-2">
                              {lang}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyCode(code, codeId)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            {copiedCodeIdx === codeId ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Code Content */}
                        <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed bg-slate-950 text-emerald-300">
                          {renderSyntaxHighlightedCode(code, lang)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }
          }

          // Section 4: Picture / Visual Illustration
          if (isPicture || bodyLines.includes('![')) {
            // Extract markdown images ![Alt](url)
            const imgMatch = bodyLines.match(/!\[(.*?)\]\((.*?)\)/);
            const imgSrc = imgMatch ? imgMatch[2] : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';
            const imgAlt = imgMatch ? imgMatch[1] : `${topicTitle} Conceptual Visual`;
            const cleanText = bodyLines.replace(/!\[(.*?)\]\((.*?)\)/g, '').trim();

            return (
              <div
                key={sIdx}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-cyan-600 text-white">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h3>{cleanHeader || 'Visual Concept & Illustration'}</h3>
                </div>

                <div className="relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40">
                  <img
                    src={imgSrc}
                    alt={imgAlt}
                    className="w-full max-h-72 object-cover object-center group-hover:scale-102 transition-transform duration-300 cursor-pointer"
                    onClick={() => setZoomedImage({ src: imgSrc, alt: imgAlt })}
                    loading="lazy"
                  />
                  <button
                    onClick={() => setZoomedImage({ src: imgSrc, alt: imgAlt })}
                    className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 italic text-center">
                  {imgAlt}
                </p>

                {cleanText && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {cleanText}
                  </p>
                )}
              </div>
            );
          }

          // Section 5: Real-World Analogy (Sticky Note style!)
          if (isAnalogy) {
            return (
              <div
                key={sIdx}
                className="p-5 sm:p-6 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 shadow-xs space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <h3>{cleanHeader}</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                    Mental Model
                  </span>
                </div>
                <div className="text-sm leading-relaxed text-amber-950 dark:text-amber-100 pt-1">
                  {bodyLines}
                </div>
              </div>
            );
          }

          // Section 6: Common Pitfalls
          if (isPitfalls) {
            return (
              <div
                key={sIdx}
                className="p-5 sm:p-6 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 shadow-xs space-y-3"
              >
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                  <div className="p-1.5 rounded-lg bg-rose-600 text-white">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3>{cleanHeader}</h3>
                </div>
                <div className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
                  {bodyLines.split('\n').map((line, lIdx) => (
                    <div key={lIdx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                      <span>{line.replace(/^[-*]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Section 7: Self-Check Question
          if (isSelfCheck) {
            const isRevealed = !!revealedAnswers[sIdx];
            const parts = bodyLines.split(/>\s*\*\*Answer:\*\*/i);
            const question = parts[0]?.trim();
            const answer = parts[1]?.trim();

            return (
              <div
                key={sIdx}
                className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/90 dark:border-indigo-900/60 shadow-xs space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <h3>{cleanHeader}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    Active Recall
                  </span>
                </div>

                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {question}
                </div>

                {answer && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => toggleReveal(sIdx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold transition-colors"
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isRevealed ? 'Hide Answer' : 'Reveal Answer'}</span>
                    </button>

                    {isRevealed && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed animate-fade-in">
                        <strong>Explanation: </strong>
                        {answer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          // Default Note Section
          return (
            <div
              key={sIdx}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              {cleanHeader && (
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>{cleanHeader}</span>
                </h3>
              )}
              <div className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {bodyLines.split('\n\n').map((para, pIdx) => {
                  if (para.startsWith('1. ') || para.startsWith('2. ') || para.startsWith('3. ')) {
                    return (
                      <div key={pIdx} className="space-y-1.5 pl-1">
                        {para.split('\n').map((item, iIdx) => (
                          <div key={iIdx} className="flex items-start gap-2">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                              {iIdx + 1}.
                            </span>
                            <span>{item.replace(/^\d+\.\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (para.startsWith('- ') || para.startsWith('* ')) {
                    return (
                      <ul key={pIdx} className="list-disc list-inside space-y-1 text-sm pl-1">
                        {para.split('\n').map((item, iIdx) => (
                          <li key={iIdx}>{item.replace(/^[-*]\s*/, '')}</li>
                        ))}
                      </ul>
                    );
                  }

                  return <p key={pIdx}>{para}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom Modal for Pictures & Diagrams */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-300 py-2 font-medium">
              {zoomedImage.alt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
