// Mini App Widget: 表单
import { useState } from 'react';
import type { FormWidget as FormWidgetConfig, FormField } from '../../../types/mini-app';

interface Props {
  config: FormWidgetConfig;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export default function DynamicForm({ config, onSubmit, isLoading }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    config.fields.forEach((f) => {
      init[f.key] = f.defaultValue ?? '';
    });
    return init;
  });

  const set = (key: string, val: unknown) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const cols = config.columns || 1;
  const gridClass =
    config.layout === 'grid'
      ? `grid gap-4 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-1'}`
      : 'space-y-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={gridClass}>
        {config.fields.map((field) => (
          <FieldRenderer key={field.key} field={field} value={values[field.key]} onChange={(v) => set(field.key, v)} />
        ))}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-orange-500 text-white text-sm rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {isLoading ? '提交中...' : (config.submitLabel || '提交')}
      </button>
    </form>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30";

  const label = (
    <label className="block text-xs text-gray-400 mb-1.5">
      {field.label}
      {field.required && <span className="text-orange-400 ml-0.5">*</span>}
    </label>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`${base} resize-none`}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <select
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={base}
          >
            <option value="" disabled>{field.placeholder || '请选择'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'switch':
      return (
        <div className="flex items-center justify-between py-1">
          <span className="text-xs text-gray-400">{field.label}</span>
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={`w-10 h-5 rounded-full transition-colors relative ${
              value ? 'bg-orange-500' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                value ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      );

    case 'radio':
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  value === opt.value
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );

    case 'checkbox':
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const arr = Array.isArray(value) ? (value as string[]) : [];
              const checked = arr.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    onChange(checked ? arr.filter((v) => v !== opt.value) : [...arr, opt.value])
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                    checked
                      ? 'bg-orange-500/15 border-orange-500/30 text-orange-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );

    case 'number':
      return (
        <div>
          {label}
          <input
            type="number"
            value={String(value ?? '')}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className={base}
          />
        </div>
      );

    case 'date':
    case 'datetime':
      return (
        <div>
          {label}
          <input
            type={field.type === 'datetime' ? 'datetime-local' : 'date'}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className={base}
          />
        </div>
      );

    default:
      return (
        <div>
          {label}
          <input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={base}
          />
        </div>
      );
  }
}
