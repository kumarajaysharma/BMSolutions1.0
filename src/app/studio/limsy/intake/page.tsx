"use client";

import { useState } from "react";
import * as z from "zod";
import { createIntakeRecord } from "./actions";

const intakeSchema = z.object({
  caseTitle:     z.string().min(3,  "Case title must be at least 3 characters"),
  courtName:     z.string().min(2,  "Court name is required"),
  subjectMatter: z.string().min(3,  "Subject matter is required"),
  filedBy:       z.string().min(2,  "Filed by is required"),
  notes:         z.string().optional(),
});

type IntakeForm = z.infer<typeof intakeSchema>;
type FieldErrors = Partial<Record<keyof IntakeForm, string>>;

const empty: IntakeForm = {
  caseTitle: "", courtName: "", subjectMatter: "", filedBy: "", notes: "",
};

export default function LimsyIntakePage() {
  const [form,    setForm]    = useState<IntakeForm>(empty);
  const [errors,  setErrors]  = useState<FieldErrors>({});
  const [status,  setStatus]  = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function set(field: keyof IntakeForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = intakeSchema.safeParse(form);
    if (!result.success) {
      const mapped: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof IntakeForm;
        if (!mapped[key]) mapped[key] = issue.message;
      }
      setErrors(mapped);
      return;
    }

    setStatus("submitting");
    try {
      await createIntakeRecord(result.data);
      setStatus("success");
      setMessage("Case intake record created successfully.");
      setForm(empty);
      setErrors({});
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Submission failed. Please try again.");
    }
  }

  const field = (
    id: keyof IntakeForm,
    label: string,
    placeholder = "",
    required = true,
  ) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={form[id] ?? ""}
        onChange={e => set(id, e.target.value)}
        placeholder={placeholder}
        className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {errors[id] && (
        <span className="text-xs text-red-600">{errors[id]}</span>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1 text-gray-900">Case Intake</h1>
      <p className="text-sm text-gray-500 mb-6">LIMSY e-Filing Pipeline — Judicial Case Registration</p>

      {status === "success" && (
        <div className="mb-4 rounded bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {field("caseTitle",     "Case Title",     "e.g. State v. Respondent")}
        {field("courtName",     "Court Name",     "e.g. High Court of Mumbai")}
        {field("subjectMatter", "Subject Matter", "e.g. Contempt of Court")}
        {field("filedBy",       "Filed By",       "Advocate / Party name")}

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes ?? ""}
            onChange={e => set("notes", e.target.value)}
            placeholder="Additional remarks..."
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded px-4 py-2 text-sm transition-colors"
        >
          {status === "submitting" ? "Submitting…" : "Submit Case Intake"}
        </button>
      </form>
    </div>
  );
}
