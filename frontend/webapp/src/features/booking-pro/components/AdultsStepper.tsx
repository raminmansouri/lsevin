'use client';
import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Persian/Arabic-Indic digits typed on a fa/ar keyboard -> Latin, everything else dropped.
function toLatinDigits(raw: string) {
    return raw
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/\D/g, '');
}

interface Props {
    label: string;
    value: number | undefined;
    /** Called only with a valid count (>= min); an empty or too-small entry is kept local. */
    onChange: (value: number) => void;
    /** Reports whether the current entry is usable, so the parent can block continuing. */
    onValidityChange?: (valid: boolean) => void;
    min?: number;
    max?: number;
    size?: 'md' | 'lg';
    labelClassName?: string;
}

/**
 * Number field with explicit -/+ buttons. Native number spinners only appear on desktop
 * browsers, so mobile users had no way to step the count and could not clear the field
 * (an empty value snapped straight back to 1). The text can now be cleared while typing;
 * an empty or below-minimum entry shows a warning instead of being silently replaced.
 */
export function AdultsStepper({ label, value, onChange, onValidityChange, min = 1, max = 99, size = 'lg', labelClassName }: Props) {
    const tBooking = useTranslations('Booking');
    const committed = value ?? min;
    const [text, setText] = useState(String(committed));

    // Follow outside updates (draft reload, other tab) unless the user is mid-edit on the same number.
    useEffect(() => {
        setText((current) => (Number(current) === committed ? current : String(committed)));
    }, [committed]);

    const parsed = text === '' ? NaN : Number(text);
    const valid = Number.isFinite(parsed) && parsed >= min;

    useEffect(() => {
        onValidityChange?.(valid);
    }, [valid, onValidityChange]);
    // Clear any "invalid" flag in the parent when the field goes away.
    useEffect(() => () => onValidityChange?.(true), [onValidityChange]);

    function commit(next: number) {
        const clamped = Math.min(max, Math.max(min, next));
        setText(String(clamped));
        if (clamped !== committed) onChange(clamped);
    }

    function handleInput(raw: string) {
        const digits = toLatinDigits(raw).slice(0, String(max).length);
        setText(digits);
        if (digits === '') return;
        const n = Math.min(max, Number(digits));
        if (n >= min && n !== committed) onChange(n);
    }

    // From an empty field, either button lands on the minimum.
    const base = Number.isFinite(parsed) ? parsed : min - 1;
    const height = size === 'lg' ? 'h-12' : 'h-11';
    const button = `flex ${height} w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40`;

    return (<div className={labelClassName ?? 'text-sm font-semibold text-slate-700'}>
        <span>{label}</span>
        <div className="mt-2 flex items-center gap-2">
            <button type="button" aria-label={tBooking('stay.decreaseAdults')} disabled={valid && parsed <= min} onClick={() => commit(Number.isFinite(parsed) ? base - 1 : min)} className={button}>
                <Minus className="h-4 w-4"/>
            </button>
            <input type="text" inputMode="numeric" pattern="[0-9]*" aria-label={label} aria-invalid={!valid} value={text} onChange={(e) => handleInput(e.target.value)} className={`${height} w-full min-w-0 rounded-2xl border bg-white px-3 text-center outline-none ${valid ? 'border-slate-200 focus:border-[#155e75]' : 'border-red-400 focus:border-red-500'}`}/>
            <button type="button" aria-label={tBooking('stay.increaseAdults')} disabled={valid && parsed >= max} onClick={() => commit(base + 1)} className={button}>
                <Plus className="h-4 w-4"/>
            </button>
        </div>
        {!valid ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{tBooking('stay.adultsMin', { min })}</p> : null}
    </div>);
}
