'use client'

import React from 'react';
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}
export const FormField: React.FC<FormFieldProps> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
  </div>
);
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition ${className}`}
    {...props}
  />
);
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ options, className = '', ...props }) => (
  <select
    className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition ${className}`}
    {...props}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea: React.FC<TextareaProps> = ({ className = '', ...props }) => (
  <textarea
    className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition resize-none ${className}`}
    rows={3}
    {...props}
  />
);