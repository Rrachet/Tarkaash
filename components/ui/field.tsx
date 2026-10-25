import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-slate/60 transition " +
  "focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10 disabled:bg-cream-200 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/10";

type FieldProps = { label: string; name: string; error?: string; hint?: string; required?: boolean; className?: string; children?: React.ReactNode };

export function Field({ label, name, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="block text-sm font-semibold text-ink">
        {label} {required && <span className="text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p id={`${name}-hint`} className="text-xs text-slate">{hint}</p>}
      {error && <p id={`${name}-error`} role="alert" className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { error?: string };
export function Input({ className, error, id, name, ...rest }: InputProps) {
  return (
    <input id={id ?? name} name={name} aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-error` : undefined} className={cn(control, "h-11", className)} {...rest} />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string };
export function Textarea({ className, error, id, name, ...rest }: TextareaProps) {
  return (
    <textarea id={id ?? name} name={name} aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-error` : undefined} className={cn(control, "min-h-28 py-2.5", className)} {...rest} />
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string };
export function Select({ className, error, id, name, children, ...rest }: SelectProps) {
  return (
    <select id={id ?? name} name={name} aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-error` : undefined} className={cn(control, "h-11 pr-9 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%235C6B73%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[right_0.8rem_center] bg-no-repeat", className)} {...rest}>
      {children}
    </select>
  );
}

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; error?: string };
export function Checkbox({ label, error, id, name, className, ...rest }: CheckboxProps) {
  return (
    <div className={className}>
      <label htmlFor={id ?? name} className="flex cursor-pointer items-start gap-3 text-sm text-ink">
        <input type="checkbox" id={id ?? name} name={name} aria-invalid={error ? true : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-line accent-teal" {...rest} />
        <span className="leading-snug">{label}</span>
      </label>
      {error && <p role="alert" className="mt-1 pl-8 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export function FormMessage({ tone = "danger", children }: { tone?: "danger" | "success" | "info"; children: React.ReactNode }) {
  const styles = { danger: "bg-danger-soft text-danger", success: "bg-mint text-success", info: "bg-gold-pale text-[#7a5210]" };
  return <div role={tone === "danger" ? "alert" : "status"} className={cn("rounded-xl px-4 py-3 text-sm font-medium", styles[tone])}>{children}</div>;
}
