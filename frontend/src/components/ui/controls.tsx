import { Button as BaseButton } from "@base-ui/react/button";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown, LoaderCircle, Search } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "choice";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({ variant = "secondary", size = "md", loading = false, className = "", children, ...props }: ButtonProps) {
  return (
    <BaseButton
      {...props}
      type={props.type ?? "button"}
      disabled={props.disabled || loading}
      aria-busy={loading || props["aria-busy"]}
      data-erp-control="button"
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </BaseButton>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...props }, ref) {
  return <input {...props} ref={ref} data-erp-control="input" className={className} />;
});

export function SearchInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span data-erp-control="search-field" className={className}>
      <Search className="h-4 w-4" aria-hidden="true" />
      <Input {...props} type="search" />
    </span>
  );
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} data-erp-control="textarea" className={className} />;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
}

export function Select({ value, options, onValueChange, placeholder = "请选择", className = "", id, name, disabled, required, "aria-label": ariaLabel }: SelectProps) {
  return (
    <BaseSelect.Root<string>
      items={options}
      value={value || null}
      onValueChange={next => onValueChange(next ?? "")}
      name={name}
      disabled={disabled}
      required={required}
    >
      <BaseSelect.Trigger id={id} aria-label={ariaLabel} data-erp-control="select" className={className}>
        <BaseSelect.Value className="min-w-0 truncate" placeholder={placeholder} />
        <BaseSelect.Icon className="shrink-0 text-[var(--erp-color-text-muted)]"><ChevronDown className="h-4 w-4" aria-hidden="true" /></BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="z-[100] max-w-[calc(100vw-1.5rem)] outline-none" sideOffset={4}>
          <BaseSelect.Popup data-erp-control="select-popup" className="min-w-[var(--anchor-width)] max-w-[calc(100vw-1.5rem)]">
            <BaseSelect.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto p-1">
              {options.map(option => (
                <BaseSelect.Item key={option.value} value={option.value} disabled={option.disabled} label={option.label} data-erp-control="select-option">
                  <BaseSelect.ItemIndicator className="flex h-4 w-4 shrink-0 items-center justify-center"><Check className="h-4 w-4" aria-hidden="true" /></BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="min-w-0 truncate">{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

export function SegmentedControl<T extends string>({ options, value, onChange, label, className = "" }: {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} data-erp-control="segmented" className={className}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          data-erp-control="segment"
        >{option.label}</button>
      ))}
    </div>
  );
}
