"use client";

import { useState, type FormEvent } from "react";
import { handleRequest, type BackendError } from "../../services/handleRequest";
import { useLoading } from "../../providers/LoadingProvider";

export interface MoneySourceOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface CreatedTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: "ARS" | "USD";
  moneySourceId: string;
  categoryId: string;
  date: string;
  description: string;
}

export interface TransactionFormProps {
  moneySources: MoneySourceOption[];
  categories: CategoryOption[];
  onCreated?: (transaction: CreatedTransaction) => void;
}

type TransactionType = "income" | "expense";
type Currency = "ARS" | "USD";

interface FormState {
  type: TransactionType;
  amount: string; // formato argentino, coma decimal (clarificación 2026-07-23)
  currency: Currency;
  moneySourceId: string;
  categoryId: string;
  date: string; // YYYY-MM-DD
  description: string;
}

const EMPTY_FORM: FormState = {
  type: "expense",
  amount: "",
  currency: "ARS",
  moneySourceId: "",
  categoryId: "",
  date: "",
  description: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

// FR-017 (clarificación 2026-07-23): coma como separador decimal (ej. "1234,56").
function parseArgentineAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  const amount = parseArgentineAmount(form.amount);

  if (amount === null) {
    errors.amount = "El monto es obligatorio";
  } else if (amount <= 0) {
    errors.amount = "El monto debe ser mayor a cero";
  }
  if (!form.moneySourceId) errors.moneySourceId = "La fuente de dinero es obligatoria";
  if (!form.currency) errors.currency = "La moneda es obligatoria";
  if (!form.categoryId) errors.categoryId = "La categoría es obligatoria";
  if (!form.date) errors.date = "La fecha es obligatoria";
  if (!form.description.trim()) errors.description = "La descripción es obligatoria";

  return errors;
}

function fieldClass(hasError: boolean): string {
  return `w-full rounded-field border px-3 py-2 dark:bg-slate-900 dark:text-slate-100 ${
    hasError ? "border-red-500" : "border-slate-300 dark:border-slate-700"
  }`;
}

// FR-016/FR-017/FR-045: alta de transacción, con validación inline por campo (borde y
// mensaje en rojo, Historia 3 escenario 3), botón deshabilitado durante el envío, y
// conservación de los datos ingresados si el guardado falla (FR-020).
export function TransactionForm({ moneySources, categories, onCreated }: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { start, stop } = useLoading();

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    start();
    try {
      const amount = parseArgentineAmount(form.amount) as number;
      const transaction = await handleRequest<CreatedTransaction>("POST", "/transactions", {
        type: form.type,
        amount,
        currency: form.currency,
        moneySourceId: form.moneySourceId,
        categoryId: form.categoryId,
        date: form.date,
        description: form.description,
      });
      setForm(EMPTY_FORM);
      setErrors({});
      onCreated?.(transaction);
    } catch (error) {
      const backendError = error as BackendError;
      if (backendError?.field) {
        setErrors({ [backendError.field as keyof FormState]: backendError.message });
      } else {
        setSubmitError(backendError?.message ?? "No se pudo guardar la transacción");
      }
    } finally {
      setIsSubmitting(false);
      stop();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="tx-type" className="block text-sm font-medium">
          Tipo
        </label>
        <select
          id="tx-type"
          className={fieldClass(false)}
          value={form.type}
          onChange={(e) => updateField("type", e.target.value as TransactionType)}
        >
          <option value="expense">Egreso</option>
          <option value="income">Ingreso</option>
        </select>
      </div>

      <div>
        <label htmlFor="tx-amount" className="block text-sm font-medium">
          Monto
        </label>
        <input
          id="tx-amount"
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className={fieldClass(Boolean(errors.amount))}
          value={form.amount}
          onChange={(e) => updateField("amount", e.target.value)}
        />
        {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="tx-money-source" className="block text-sm font-medium">
          Fuente de dinero
        </label>
        <select
          id="tx-money-source"
          className={fieldClass(Boolean(errors.moneySourceId))}
          value={form.moneySourceId}
          onChange={(e) => updateField("moneySourceId", e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {moneySources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
        {errors.moneySourceId && (
          <p className="mt-1 text-sm text-red-500">{errors.moneySourceId}</p>
        )}
      </div>

      <div>
        <label htmlFor="tx-currency" className="block text-sm font-medium">
          Moneda
        </label>
        <select
          id="tx-currency"
          className={fieldClass(Boolean(errors.currency))}
          value={form.currency}
          onChange={(e) => updateField("currency", e.target.value as Currency)}
        >
          <option value="ARS">ARS</option>
          <option value="USD">USD</option>
        </select>
        {errors.currency && <p className="mt-1 text-sm text-red-500">{errors.currency}</p>}
      </div>

      <div>
        <label htmlFor="tx-category" className="block text-sm font-medium">
          Categoría
        </label>
        <select
          id="tx-category"
          className={fieldClass(Boolean(errors.categoryId))}
          value={form.categoryId}
          onChange={(e) => updateField("categoryId", e.target.value)}
        >
          <option value="">Seleccionar…</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>}
      </div>

      <div>
        <label htmlFor="tx-date" className="block text-sm font-medium">
          Fecha
        </label>
        <input
          id="tx-date"
          type="date"
          className={fieldClass(Boolean(errors.date))}
          value={form.date}
          onChange={(e) => updateField("date", e.target.value)}
        />
        {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="tx-description" className="block text-sm font-medium">
          Descripción
        </label>
        <input
          id="tx-description"
          type="text"
          className={fieldClass(Boolean(errors.description))}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-field bg-accent px-4 py-2 text-white hover:bg-accent-light disabled:opacity-50"
      >
        Guardar
      </button>
    </form>
  );
}
