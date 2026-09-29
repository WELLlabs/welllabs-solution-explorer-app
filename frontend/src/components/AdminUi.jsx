import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatDateTime } from '@/utils/adminHelpers';

export const thClass = 'px-5 py-4 text-left text-[12px] font-bold text-ink uppercase tracking-[0.5px] whitespace-nowrap';
export const tdClass = 'px-5 py-4 border-b border-khaki-beige/20 align-middle text-sm';
export const inputClass =
  'px-3 py-2 border border-khaki-beige rounded-lg text-sm text-ink bg-white focus:outline-none focus:border-ocean-deep focus:shadow-[0_0_0_3px_rgba(54,105,169,0.15)]';
export const cardClass = 'bg-white rounded-[20px] border border-border-light shadow-[0_1px_4px_rgba(31,42,36,0.05)]';
export const primaryBtn =
  'px-4 py-2 rounded-lg text-sm font-bold text-white bg-ocean-deep hover:bg-turf-green cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
export const secondaryBtn =
  'px-4 py-2 rounded-lg text-sm font-semibold text-ink bg-white border border-khaki-beige hover:bg-slate-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="text-center py-[60px] px-5">
    <div className="w-10 h-10 border-[3px] border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
    <p>{label}</p>
  </div>
);

/** Centred popup rendered on document.body so ancestor transforms cannot shift it. */
export const Modal = ({ title, onClose, children, footer, width = 'max-w-[520px]' }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${width} max-h-[90vh] bg-white rounded-[24px] border border-[#C8D7BC]/80 shadow-[0_25px_60px_-15px_rgba(31,42,36,0.35)] flex flex-col overflow-hidden animate-fade-in`}
      >
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer bg-transparent border-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export const CopyLinkBox = ({ url, expiresAt, note }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className={`${inputClass} flex-1 font-mono text-xs`} />
        <button type="button" onClick={copy} className={primaryBtn}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-muted">
        {note} {expiresAt && <>This link works once and expires on {formatDateTime(expiresAt)}.</>}
      </p>
    </div>
  );
};
