'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { pushToDataLayer } from '@/lib/datalayer';

/* ── DataLayer helper ───────────────────────────────────────── */
function pushEvent(event: string, params: Record<string, unknown> = {}) {
  pushToDataLayer({ event, ...params });
}

/* ── Types ──────────────────────────────────────────────────── */
type InputMethod = 'url' | 'upload';
type Step = 'input' | 'loading' | 'result';

interface FormState {
  inputMethod: InputMethod;
  productUrl: string;
  productFile: File | null;
  productPreview: string | null;
  productName: string;
  productSize: string;
  userPhoto: File | null;
  userPhotoPreview: string | null;
  heightCm: string;
  weightKg: string;
}

const EMPTY_FORM: FormState = {
  inputMethod: 'url',
  productUrl: '',
  productFile: null,
  productPreview: null,
  productName: '',
  productSize: '',
  userPhoto: null,
  userPhotoPreview: null,
  heightCm: '',
  weightKg: '',
};

const LOADING_MESSAGES = [
  'Kıyafetiniz dikiliyor...',
  'Vücut ölçüleriniz analiz ediliyor...',
  'Kumaş dokusu işleniyor...',
  'AI modeli çalışıyor...',
  'Son rötuşlar yapılıyor...',
];

/* ── Icons ──────────────────────────────────────────────────── */
const IconLink = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IconUpload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconCamera = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconSparkle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 5h5l-4 3 1.5 5L12 13l-4 3 1.5-5-4-3h5z"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/* ── Step indicator ─────────────────────────────────────────── */
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Ürün' },
    { n: 2, label: 'Profil' },
    { n: 3, label: 'Sonuç' },
  ] as const;
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => {
        const state = s.n < current ? 'done' : s.n === current ? 'active' : 'idle';
        return (
          <React.Fragment key={s.n}>
            <div className={`step-pill ${state}`}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: state === 'active' ? 'var(--accent)' : state === 'done' ? 'var(--success)' : 'var(--border)',
                fontSize: 12, fontWeight: 700,
              }}>
                {state === 'done' ? <IconCheck /> : s.n}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 24, height: 1, background: s.n < current ? 'var(--success)' : 'var(--border)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Image upload box ───────────────────────────────────────── */
function ImageUploadBox({
  preview,
  onFile,
  onClear,
  accept,
  label,
  sublabel,
  icon,
  tall,
}: {
  preview: string | null;
  onFile: (f: File) => void;
  onClear: () => void;
  accept: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  tall?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div
      className={`drop-zone relative cursor-pointer ${drag ? 'drag-over' : ''}`}
      style={{ minHeight: tall ? 240 : 160 }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {preview ? (
        <>
          <img
            src={preview}
            alt="preview"
            style={{ width: '100%', height: tall ? 240 : 160, objectFit: 'contain', borderRadius: 14, display: 'block' }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(0,0,0,0.7)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '4px 8px', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13,
            }}
          >
            <IconX /> Kaldır
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: tall ? 240 : 160, gap: 12, padding: 24 }}>
          <div style={{ color: 'var(--text-dim)' }}>{icon}</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{sublabel}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function VirtualTryOn() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [step, setStep] = useState<Step>('input');
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const productReady = form.inputMethod === 'url'
    ? form.productUrl.trim().length > 8
    : form.productFile !== null;

  const userReady = form.userPhoto !== null && form.heightCm !== '' && form.weightKg !== '';
  const canTry = productReady && userReady;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleProductFile(file: File) {
    const url = URL.createObjectURL(file);
    setField('productFile', file);
    setField('productPreview', url);
  }

  function handleUserPhoto(file: File) {
    const url = URL.createObjectURL(file);
    setField('userPhoto', file);
    setField('userPhotoPreview', url);
  }

  function handleInputMethodChange(method: InputMethod) {
    setField('inputMethod', method);
    pushEvent('product_input_method', { method });
  }

  function handleTryOn() {
    if (!canTry) return;
    pushEvent('try_on_click', {
      input_method: form.inputMethod,
      has_height: !!form.heightCm,
      has_weight: !!form.weightKg,
    });
    setStep('loading');
    setLoadingProgress(0);
    setLoadingMsgIdx(0);

    let progress = 0;
    let msgIdx = 0;
    loadingInterval.current = setInterval(() => {
      progress += Math.random() * 12 + 4;
      if (progress >= 100) progress = 100;
      setLoadingProgress(Math.min(progress, 100));
      msgIdx = Math.min(Math.floor((progress / 100) * LOADING_MESSAGES.length), LOADING_MESSAGES.length - 1);
      setLoadingMsgIdx(msgIdx);
    }, 400);

    // Simulate AI generation (10s)
    setTimeout(() => {
      if (loadingInterval.current) clearInterval(loadingInterval.current);
      setLoadingProgress(100);

      // Use the user's own photo as mock result (in real impl: API call)
      const mockResult = form.userPhotoPreview;
      setResultImage(mockResult);

      pushEvent('generation_success_rate', { success: true });
      setTimeout(() => {
        setStep('result');
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }, 10000);
  }

  function handleRegenerate() {
    pushEvent('regenerate_click');
    if (loadingInterval.current) clearInterval(loadingInterval.current);
    setStep('input');
    setForm(EMPTY_FORM);
    setResultImage(null);
    setLoadingProgress(0);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    return () => { if (loadingInterval.current) clearInterval(loadingInterval.current); };
  }, []);

  const currentStep: 1 | 2 | 3 = step === 'result' ? 3 : 1;

  return (
    <div className="fitai-embed" style={{ minHeight: '100%', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconSparkle />
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>FitAI</span>
          </div>
          {step !== 'result' && <StepIndicator current={currentStep} />}
          <div style={{ fontSize: 13, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            AI Hazır
          </div>
        </div>
      </header>

      <div ref={topRef} />

      {/* ── Loading screen ───────────────────────────────────── */}
      {step === 'loading' && (
        <div className="animate-fade-in" style={{
          minHeight: 'calc(100% - 64px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 40, padding: 40,
        }}>
          {/* Garment animation */}
          <div style={{ position: 'relative', width: 120, height: 160 }}>
            <div className="animate-float" style={{
              width: 120, height: 160,
              background: 'linear-gradient(135deg, var(--surface2), var(--surface))',
              borderRadius: 24, border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 64,
            }}>
              👗
            </div>
            <div style={{
              position: 'absolute', inset: -2, borderRadius: 26,
              border: '2px solid var(--accent)', opacity: 0.5,
              animation: 'pulse-glow 2s ease-in-out infinite',
            }} />
          </div>

          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>
              {LOADING_MESSAGES[loadingMsgIdx]}
            </div>
            <div style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32 }}>
              Bu işlem genellikle 8–12 saniye sürer
            </div>

            {/* Progress bar */}
            <div style={{ background: 'var(--surface2)', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%', borderRadius: 6,
                background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
                width: `${loadingProgress}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{Math.round(loadingProgress)}%</div>
          </div>

          {/* Processing steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340 }}>
            {['Ürün görseli analiz ediliyor', 'Vücut postürü işleniyor', 'Kıyafet yerleştiriliyor', 'Görüntü oluşturuluyor'].map((label, i) => {
              const done = loadingProgress > (i + 1) * 22;
              const active = !done && loadingProgress > i * 22;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', borderRadius: 10,
                  background: done ? 'rgba(34,197,94,0.08)' : active ? 'rgba(124,92,252,0.08)' : 'var(--surface)',
                  border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : active ? 'var(--border-hover)' : 'var(--border)'}`,
                  transition: 'all 0.3s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--border)',
                    fontSize: 11,
                  }}>
                    {done ? <IconCheck /> : active
                      ? <div className="animate-spin" style={{ width: 10, height: 10, border: '2px solid transparent', borderTopColor: 'white', borderRadius: '50%' }} />
                      : null
                    }
                  </div>
                  <span style={{ fontSize: 14, color: done ? 'var(--success)' : active ? 'var(--text)' : 'var(--text-dim)' }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* KVKK note */}
          <div style={{
            fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', maxWidth: 360,
            padding: '12px 16px', borderRadius: 10, background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}>
            🔒 Fotoğraflarınız sunucuda kalıcı olarak saklanmaz. İşlem tamamlandıktan sonra otomatik silinir.
          </div>
        </div>
      )}

      {/* ── Result screen ────────────────────────────────────── */}
      {step === 'result' && (
        <div className="animate-fade-in" style={{ minHeight: 'calc(100% - 64px)', padding: '40px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 999, padding: '6px 16px', marginBottom: 16,
                fontSize: 14, color: 'var(--success)', fontWeight: 500,
              }}>
                <IconCheck /> Deneme Tamamlandı
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
                İşte görünümünüz!
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
                AI kıyafeti sizin üzerinizde modelledi. Beğenmediniz mi? Yeni bir ürün deneyin.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24, maxWidth: 800, margin: '0 auto 40px',
            }}>
              {/* Original */}
              <div className="card animate-result" style={{ animationDelay: '0ms' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ürün</div>
                </div>
                <div style={{ padding: 20 }}>
                  {form.productPreview ? (
                    <img src={form.productPreview} alt="product" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 10 }} />
                  ) : (
                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'var(--text-dim)' }}>
                      🛍️
                    </div>
                  )}
                  {form.productUrl && (
                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                      {form.productUrl.substring(0, 60)}{form.productUrl.length > 60 ? '…' : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Result */}
              <div className="card animate-result" style={{ animationDelay: '80ms', borderColor: 'var(--accent)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--accent-light)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Sonucu</div>
                  <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-dim)' }}>
                    {form.heightCm}cm · {form.weightKg}kg
                  </div>
                </div>
                <div style={{ padding: 20, position: 'relative' }}>
                  {resultImage ? (
                    <img src={resultImage} alt="try-on result" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 10 }} />
                  ) : (
                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>👤</div>
                  )}
                  <div style={{
                    position: 'absolute', top: 28, right: 28,
                    background: 'var(--accent)', borderRadius: 6, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700, color: 'white',
                  }}>AI</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary animate-pulse-glow" onClick={handleRegenerate}>
                <IconRefresh />
                Yeniden Dene / Temizle
              </button>
              {resultImage && (
                <a
                  href={resultImage}
                  download="fitai-result.jpg"
                  className="btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  <IconDownload />
                  İndir
                </a>
              )}
            </div>

            {/* Privacy note */}
            <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--text-dim)' }}>
              🔒 Fotoğraflarınız bu oturum için geçicidir. "Yeniden Dene" veya sekmeyi kapattığınızda tüm veriler silinir.
            </div>
          </div>
        </div>
      )}

      {/* ── Input screen ─────────────────────────────────────── */}
      {step === 'input' && (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
          {/* Hero */}
          <div className="animate-fade-up" style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
              background: 'var(--accent-glow)', border: '1px solid var(--accent)',
              borderRadius: 999, padding: '6px 18px', fontSize: 14, fontWeight: 500, color: 'var(--accent-light)',
            }}>
              <IconSparkle />
              AI Destekli Sanal Deneme Odası
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 18 }}>
              Kıyafeti satın almadan<br />
              <span style={{ background: 'linear-gradient(135deg, var(--accent-light), #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                önce dene
              </span>
            </h1>
            <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>
              Ürün linkini yapıştır ya da fotoğraf yükle. Boydan fotoğrafını ekle. AI saniyeler içinde sana özel modelleme yapsın.
            </p>
          </div>

          {/* Two columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
            marginBottom: 40,
          }}>
            {/* ── Column 1: Product ── */}
            <div className="card animate-fade-up" style={{ animationDelay: '80ms' }}>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: 'var(--accent-light)', fontWeight: 700,
                  }}>1</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>Ürün Seç</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Link gir veya fotoğraf yükle</div>
                  </div>
                </div>

                {/* Tab toggle */}
                <div style={{
                  display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 4, marginBottom: 20,
                }}>
                  {(['url', 'upload'] as InputMethod[]).map(method => (
                    <button
                      key={method}
                      onClick={() => handleInputMethodChange(method)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                        background: form.inputMethod === method ? 'var(--surface)' : 'transparent',
                        color: form.inputMethod === method ? 'var(--text)' : 'var(--text-muted)',
                        fontWeight: form.inputMethod === method ? 600 : 400,
                        fontSize: 14, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'all 0.2s',
                        boxShadow: form.inputMethod === method ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                      }}
                    >
                      {method === 'url' ? <><IconLink /> Link</> : <><IconUpload /> Fotoğraf</>}
                    </button>
                  ))}
                </div>

                {form.inputMethod === 'url' ? (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Ürün Linki
                    </label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="Ürün linkini yapıştırın (Trendyol, Zara, vb.)"
                      value={form.productUrl}
                      onChange={e => setField('productUrl', e.target.value)}
                    />
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                      Trendyol, Zara, H&M, Mango ve daha fazlası desteklenmektedir
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Ürün Görseli
                    </label>
                    <ImageUploadBox
                      preview={form.productPreview}
                      onFile={handleProductFile}
                      onClear={() => { setField('productFile', null); setField('productPreview', null); }}
                      accept="image/jpeg,image/png,image/webp"
                      label="Ürün fotoğrafını buraya sürükle veya tıkla"
                      sublabel="JPG, PNG, WebP · Maks 10 MB"
                      icon={<IconUpload />}
                    />
                  </div>
                )}

                {form.inputMethod === 'upload' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Ürün Adı
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Örn: Oversize Blazer"
                        value={form.productName}
                        onChange={e => setField('productName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Beden
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="XS / S / M / L / XL"
                        value={form.productSize}
                        onChange={e => setField('productSize', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ready indicator */}
              <div style={{
                margin: '0 24px 24px',
                padding: '10px 16px', borderRadius: 10,
                background: productReady ? 'rgba(34,197,94,0.08)' : 'var(--surface2)',
                border: `1px solid ${productReady ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13,
                color: productReady ? 'var(--success)' : 'var(--text-dim)',
                transition: 'all 0.3s',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: productReady ? 'var(--success)' : 'var(--border)', flexShrink: 0 }} />
                {productReady ? 'Ürün hazır ✓' : 'Ürün bilgisi bekleniyor...'}
              </div>
            </div>

            {/* ── Column 2: User Profile ── */}
            <div className="card animate-fade-up" style={{ animationDelay: '160ms' }}>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--accent-glow)', border: '1px solid var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: 'var(--accent-light)', fontWeight: 700,
                  }}>2</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>Profil Bilgileri</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Boydan fotoğraf + ölçüler</div>
                  </div>
                </div>

                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Boydan Fotoğraf
                </label>
                <ImageUploadBox
                  preview={form.userPhotoPreview}
                  onFile={handleUserPhoto}
                  onClear={() => { setField('userPhoto', null); setField('userPhotoPreview', null); }}
                  accept="image/jpeg,image/png"
                  label="Boydan fotoğrafınızı yükleyin"
                  sublabel="Düz duruşta, arka plan sade olsun · JPG, PNG · Maks 10 MB"
                  icon={<IconCamera />}
                  tall
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '20px 0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Boy (cm)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="165"
                      min={100} max={220}
                      value={form.heightCm}
                      onChange={e => setField('heightCm', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8 }}>
                      Kilo (kg)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="60"
                      min={30} max={200}
                      value={form.weightKg}
                      onChange={e => setField('weightKg', e.target.value)}
                    />
                  </div>
                </div>

                {/* Tips */}
                <div style={{
                  background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px',
                  marginBottom: 20, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6,
                }}>
                  💡 <strong style={{ color: 'var(--text-muted)' }}>İpucu:</strong> Düz durun, sade bir arka plan seçin ve tüm vücudunuz görünsün. Sonuçlar daha iyi olacak.
                </div>
              </div>

              {/* Ready indicator */}
              <div style={{
                margin: '0 24px 24px',
                padding: '10px 16px', borderRadius: 10,
                background: userReady ? 'rgba(34,197,94,0.08)' : 'var(--surface2)',
                border: `1px solid ${userReady ? 'rgba(34,197,94,0.25)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13,
                color: userReady ? 'var(--success)' : 'var(--text-dim)',
                transition: 'all 0.3s',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: userReady ? 'var(--success)' : 'var(--border)', flexShrink: 0 }} />
                {userReady ? 'Profil hazır ✓' : 'Fotoğraf ve ölçü bekleniyor...'}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="animate-fade-up" style={{ animationDelay: '240ms', textAlign: 'center' }}>
            <button
              className="btn-primary"
              style={{ fontSize: 18, padding: '18px 56px' }}
              onClick={handleTryOn}
              disabled={!canTry}
            >
              <IconSparkle />
              Şimdi Dene
            </button>
            {!canTry && (
              <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-dim)' }}>
                {!productReady && !userReady
                  ? 'Ürün ve profil bilgilerini doldurun'
                  : !productReady ? 'Ürün bilgisini ekleyin'
                  : 'Boydan fotoğraf ve ölçüleri girin'}
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="animate-fade-up" style={{ animationDelay: '300ms', marginTop: 56 }}>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center',
              borderTop: '1px solid var(--border)', paddingTop: 40,
            }}>
              {[
                { icon: '🔒', title: 'KVKK & GDPR Uyumlu', desc: 'Fotoğraflar kalıcı saklanmaz' },
                { icon: '⚡', title: '8–12 Saniye', desc: 'Hızlı AI modelleme' },
                { icon: '📱', title: 'Mobil Uyumlu', desc: 'Telefondan fotoğraf çekip dene' },
                { icon: '🎯', title: 'Gerçekçi Sonuçlar', desc: 'Boy/kilo ile ölçek ayarı' },
              ].map(b => (
                <div key={b.title} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px', borderRadius: 12,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  minWidth: 200,
                }}>
                  <div style={{ fontSize: 24 }}>{b.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)', padding: '24px',
        textAlign: 'center', fontSize: 13, color: 'var(--text-dim)',
      }}>
        FitAI © 2026 · AI Tabanlı Sanal Deneme Odası
      </footer>
    </div>
  );
}
