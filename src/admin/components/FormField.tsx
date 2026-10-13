import React from 'react';
import '../styles/admin-components.css';

interface FormFieldProps {
    label: string;
    name?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'datetime-local' | 'time';
    value?: any;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    error?: string;
    required?: boolean;
    placeholder?: string;
    options?: { value: string | number; label: string; key?: string | number }[];
    helpText?: string;
    disabled?: boolean;
    readOnly?: boolean;
    rows?: number;
    maxLength?: number;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    children?: React.ReactNode;
}

export default function FormField({
    label,
    name,
    type = 'text',
    value,
    onChange,
    onKeyPress,
    error,
    required = false,
    placeholder,
    options = [],
    helpText,
    disabled = false,
    readOnly = false,
    rows = 4,
    maxLength,
    min,
    max,
    step,
    children
}: FormFieldProps) {
    // If children are provided, use them instead of rendering default input
    if (children) {
        return (
            <div className="admin-form-field">
                <label className="admin-form-label">
                    {label}
                    {required && <span className="admin-form-required">*</span>}
                </label>
                {children}
                {error && <span className="admin-form-error">{error}</span>}
                {helpText && <span className="admin-form-help">{helpText}</span>}
            </div>
        );
    }

    const renderInput = () => {
        switch (type) {
            case 'textarea':
                return (
                    <textarea
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={rows}
                        maxLength={maxLength}
                        className={`admin-form-control ${error ? 'admin-form-control-error' : ''}`}
                    />
                );

            case 'select':
                return (
                    <select
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        className={`admin-form-control ${error ? 'admin-form-control-error' : ''}`}
                    >
                        <option value="">Select {label}</option>
                        {options.map((option, index) => (
                            <option key={option.key ?? `${name}-${option.value}-${index}`} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'checkbox':
                return (
                    <div className="admin-checkbox-wrapper">
                        <input
                            type="checkbox"
                            id={name}
                            name={name}
                            checked={value}
                            onChange={onChange}
                            disabled={disabled}
                            className="admin-form-checkbox"
                        />
                        <label htmlFor={name} className="admin-checkbox-label">
                            {label}
                        </label>
                    </div>
                );

            default:
                return (
                    <input
                        type={type}
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        onKeyPress={onKeyPress}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        min={min}
                        max={max}
                        step={step}
                        disabled={disabled}
                        readOnly={readOnly}
                        className={`admin-form-control ${error ? 'admin-form-control-error' : ''}`}
                    />
                );
        }
    };

    if (type === 'checkbox') {
        return (
            <div className="admin-form-field">
                {renderInput()}
                {error && <span className="admin-form-error">{error}</span>}
                {helpText && <span className="admin-form-help">{helpText}</span>}
            </div>
        );
    }

    return (
        <div className="admin-form-field">
            <label htmlFor={name} className="admin-form-label">
                {label}
                {required && <span className="admin-form-required">*</span>}
            </label>
            {renderInput()}
            {error && <span className="admin-form-error">{error}</span>}
            {helpText && <span className="admin-form-help">{helpText}</span>}
        </div>
    );
}
