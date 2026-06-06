import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

export const INPUT_CLASS =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium ' +
  'text-slate-900 placeholder:text-slate-400 transition focus:outline-none ' +
  'focus:border-[#32CD32] focus:ring-2 focus:ring-[#32CD32]/20 disabled:bg-slate-50 disabled:text-slate-500'

export const INPUT_ERROR = 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'

export const LABEL_CLASS = 'block text-sm font-bold text-slate-700 mb-1.5'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

const SettingsInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, required, id, className = '', ...rest }, ref) => {
    const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`
    return (
      <div>
        <label htmlFor={fieldId} className={LABEL_CLASS}>
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={`${INPUT_CLASS} ${error ? INPUT_ERROR : ''} ${className}`}
          {...rest}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
            <AlertCircle size={11} /> {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    )
  }
)
SettingsInput.displayName = 'SettingsInput'
export default SettingsInput

export function SettingsTextarea({
  label, error, hint, required, ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string; error?: string; hint?: string; required?: boolean
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <textarea
        rows={4}
        className={`${INPUT_CLASS} resize-y ${error ? INPUT_ERROR : ''}`}
        {...rest}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600 font-semibold flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function SettingsSelect({
  label, error, hint, options, ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string; error?: string; hint?: string
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <select className={`${INPUT_CLASS} ${error ? INPUT_ERROR : ''}`} {...rest}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Toggle({
  checked, onChange, label, description, disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <label className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
          checked ? 'bg-[#1A5C3A]' : 'bg-slate-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}