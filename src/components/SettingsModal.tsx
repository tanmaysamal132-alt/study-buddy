import React, { useState } from 'react';
import {
  X,
  Key,
  Database,
  Download,
  Upload,
  RotateCcw,
  Zap,
  Check,
  ShieldAlert,
  Moon,
  Sun,
  Target,
  Clock,
} from 'lucide-react';
import { UserSettings } from '../types';
import { resetToSampleData } from '../services/storage';

function formatGoalMinutes(mins: number): string {
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  if (hrs > 0 && m > 0) return `${hrs}h ${m}m (${mins}m)`;
  if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''} (${mins}m)`;
  return `${mins} minutes`;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onExportData,
  onImportData,
  onResetData,
}) => {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [quotaUsed, setQuotaUsed] = useState(settings.dailyAiQuotaUsed);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(settings.dailyGoalMinutes || 60);
  const [dailyStudyTimeOfDay, setDailyStudyTimeOfDay] = useState(settings.dailyStudyTimeOfDay || '18:00');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      apiKey: apiKey.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      dailyAiQuotaUsed: quotaUsed,
      dailyGoalMinutes: Math.max(5, dailyGoalMinutes),
      dailyStudyTimeOfDay,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleResetQuota = () => {
    setQuotaUsed(0);
    onSaveSettings({
      ...settings,
      dailyAiQuotaUsed: 0,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportData(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Study Buddy Settings
            </h3>
            <p className="text-xs text-slate-500">
              Manage AI credentials, Supabase sync, and local data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Daily Study Goal Duration & Scheduled Time */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
            {/* Target Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Daily Study Goal Duration</span>
                </label>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800">
                  {formatGoalMinutes(dailyGoalMinutes)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Choose how much focused time you plan to study each day. Unlocks the &ldquo;Daily Achiever&rdquo; achievement badge.
              </p>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[15, 30, 45, 60, 90, 120, 180].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      dailyGoalMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>

              {/* Slider & Custom input */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="range"
                  min="15"
                  max="360"
                  step="15"
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(parseInt(e.target.value, 10))}
                  className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={dailyGoalMinutes}
                    onChange={(e) => setDailyGoalMinutes(Math.max(5, parseInt(e.target.value, 10) || 5))}
                    className="w-16 px-2 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-400">mins</span>
                </div>
              </div>
            </div>

            {/* Scheduled Time of Day for Study */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Preferred Daily Study Time (Schedule)</span>
                </label>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {dailyStudyTimeOfDay}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pick a designated time of day for your study sessions to build a consistent habit.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {[
                  { label: '🌅 Morning', time: '08:00' },
                  { label: '☀️ Afternoon', time: '14:00' },
                  { label: '🌆 Evening', time: '18:30' },
                  { label: '🌙 Night', time: '21:00' },
                ].map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setDailyStudyTimeOfDay(slot.time)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      dailyStudyTimeOfDay === slot.time
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    {slot.label} ({slot.time})
                  </button>
                ))}

                <input
                  type="time"
                  value={dailyStudyTimeOfDay}
                  onChange={(e) => setDailyStudyTimeOfDay(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ml-auto"
                />
              </div>
            </div>
          </div>

          {/* AI Connection & Custom Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-500" />
                <span>Custom Gemini API Key (Optional)</span>
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                Server-side Gemini 3.6 Flash Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Google AI Studio keys starting with <code>AQ.</code> or <code>AIza...</code> are handled with the <code>x-goog-api-key</code> HTTP header. Leave blank to use server environment default.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AQ.Ab8RN6LH... or AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Supabase Config */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>Supabase Cloud Database & Auth</span>
            </label>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Project URL
              </span>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Anon Public Key
              </span>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="sb_publishable_..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Data Backup & Restore */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Data Management & Backup
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-500" />
                <span>Export JSON</span>
              </button>

              <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all subjects, topics, and study progress? This starts your workspace fresh.')) {
                    onResetData();
                  }
                }}
                className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
              <span>{isSaved ? 'Saved Successfully' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
