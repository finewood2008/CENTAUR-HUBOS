import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, Square } from 'lucide-react';

// ── Props ──
interface VoiceRecorderProps {
  onClose: () => void;
  onSend: (audioBlob: Blob, duration: number) => void;
}

// ── Recording states ──
type RecordingState = 'idle' | 'recording' | 'done';

// ── Waveform CSS keyframes (injected inline) ──
const WAVEFORM_STYLES = `
@keyframes voice-bar-1 {
  0%, 100% { height: 8px; }
  50% { height: 28px; }
}
@keyframes voice-bar-2 {
  0%, 100% { height: 12px; }
  50% { height: 36px; }
}
@keyframes voice-bar-3 {
  0%, 100% { height: 6px; }
  50% { height: 32px; }
}
@keyframes voice-bar-4 {
  0%, 100% { height: 14px; }
  50% { height: 40px; }
}
@keyframes voice-bar-5 {
  0%, 100% { height: 10px; }
  50% { height: 24px; }
}
@keyframes voice-bar-6 {
  0%, 100% { height: 8px; }
  50% { height: 34px; }
}
@keyframes voice-bar-7 {
  0%, 100% { height: 12px; }
  50% { height: 20px; }
}
@keyframes voice-mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201, 100, 66, 0.4); }
  50% { box-shadow: 0 0 0 16px rgba(201, 100, 66, 0); }
}
`;

// ── Bar animation configs ──
const WAVEFORM_BARS = [
  { animation: 'voice-bar-1 1.2s ease-in-out infinite', delay: '0s' },
  { animation: 'voice-bar-2 1.0s ease-in-out infinite', delay: '0.15s' },
  { animation: 'voice-bar-3 1.4s ease-in-out infinite', delay: '0.3s' },
  { animation: 'voice-bar-4 0.9s ease-in-out infinite', delay: '0.1s' },
  { animation: 'voice-bar-5 1.3s ease-in-out infinite', delay: '0.25s' },
  { animation: 'voice-bar-6 1.1s ease-in-out infinite', delay: '0.05s' },
  { animation: 'voice-bar-7 1.5s ease-in-out infinite', delay: '0.2s' },
];

// ── Format seconds to MM:SS ──
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ── Component ──
export default function VoiceRecorder({ onClose, onSend }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  // ── Cleanup ──
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
  }, []);

  // ── Start recording ──
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        audioBlobRef.current = blob;
        setState('done');
      };

      mediaRecorder.start(100); // collect data every 100ms
      setState('recording');
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Mic access denied:', err);
      setError('无法访问麦克风，请检查权限设置');
      setState('idle');
    }
  }, []);

  // ── Stop recording ──
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Cancel ──
  const handleCancel = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // ── Send ──
  const handleSend = useCallback(() => {
    if (state === 'recording') {
      // Stop first, then send after blob is ready
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        const finalDuration = duration;
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          cleanup();
          onSend(blob, finalDuration);
        };
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    if (state === 'done' && audioBlobRef.current) {
      const blob = audioBlobRef.current;
      const finalDuration = duration;
      cleanup();
      onSend(blob, finalDuration);
    }
  }, [state, duration, cleanup, onSend]);

  // ── Auto-start on mount ──
  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Inject keyframe styles */}
      <style>{WAVEFORM_STYLES}</style>

      {/* Overlay backdrop */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: 'rgba(20, 20, 19, 0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          {/* Recorder card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="card-glass rounded-2xl p-8 w-[320px] flex flex-col items-center gap-6"
            style={{
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.15), 0 4px 24px rgba(0, 0, 0, 0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Mic icon with pulse ── */}
            <div className="relative">
              <motion.div
                animate={
                  state === 'recording'
                    ? { scale: [1, 1.05, 1] }
                    : { scale: 1 }
                }
                transition={
                  state === 'recording'
                    ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                    : {}
                }
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background:
                    state === 'recording'
                      ? 'linear-gradient(135deg, #c96442, #d97757)'
                      : state === 'done'
                        ? 'linear-gradient(135deg, #4a7c59, #5a8a5e)'
                        : '#e8e6dc',
                  animation:
                    state === 'recording'
                      ? 'voice-mic-pulse 2s ease-in-out infinite'
                      : 'none',
                }}
              >
                {state === 'recording' ? (
                  <Mic size={32} className="text-white" />
                ) : state === 'done' ? (
                  <Check size={32} className="text-white" />
                ) : (
                  <Mic size={32} className="text-stone-gray" />
                )}
              </motion.div>

              {/* Recording indicator dot */}
              {state === 'recording' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white"
                  style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
                />
              )}
            </div>

            {/* ── Waveform bars ── */}
            <div className="flex items-center justify-center gap-[3px] h-[44px]">
              {WAVEFORM_BARS.map((bar, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    width: '4px',
                    height: state === 'recording' ? undefined : '6px',
                    backgroundColor:
                      state === 'recording'
                        ? 'var(--color-terracotta)'
                        : state === 'done'
                          ? 'var(--color-sage-green)'
                          : 'var(--color-warm-sand)',
                    opacity: state === 'recording' ? 0.7 + i * 0.04 : 0.4,
                    animation:
                      state === 'recording'
                        ? bar.animation
                        : 'none',
                    animationDelay: bar.delay,
                    transition: 'background-color 0.3s ease, opacity 0.3s ease',
                  }}
                />
              ))}
            </div>

            {/* ── Duration timer ── */}
            <div className="text-center">
              <p
                className="text-[28px] font-mono font-medium tabular-nums"
                style={{
                  color:
                    state === 'recording'
                      ? 'var(--color-terracotta)'
                      : 'var(--color-near-black)',
                }}
              >
                {formatDuration(duration)}
              </p>
              <p className="text-[12px] text-stone-gray mt-1">
                {state === 'recording'
                  ? '正在录音…'
                  : state === 'done'
                    ? '录音完成'
                    : error
                      ? error
                      : '准备中…'}
              </p>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex items-center gap-6">
              {/* Cancel */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                className="w-12 h-12 rounded-full flex items-center justify-center border border-border-cream hover:border-red-300 hover:bg-red-50/50 transition-colors"
                title="取消"
              >
                <X size={20} className="text-stone-gray" />
              </motion.button>

              {/* Stop (only during recording) */}
              {state === 'recording' && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="w-14 h-14 rounded-full flex items-center justify-center bg-terracotta/10 border-2 border-terracotta hover:bg-terracotta/20 transition-colors"
                  title="停止录音"
                >
                  <Square
                    size={18}
                    className="text-terracotta fill-terracotta"
                  />
                </motion.button>
              )}

              {/* Send */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background:
                    state === 'idle'
                      ? 'var(--color-warm-sand)'
                      : 'linear-gradient(135deg, #c96442, #d97757)',
                  cursor: state === 'idle' ? 'not-allowed' : 'pointer',
                  opacity: state === 'idle' ? 0.5 : 1,
                }}
                disabled={state === 'idle'}
                title="发送"
              >
                <Check size={20} className={state === 'idle' ? 'text-stone-gray' : 'text-white'} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
