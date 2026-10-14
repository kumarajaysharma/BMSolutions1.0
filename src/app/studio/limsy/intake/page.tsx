"use client";

import { useState } from "react";
import * as z from "zod";
import { createIntakeRecord } from "./actions";

// ─── Zod Schema ───────────────────────────────────────────────────────────────
// Field names match IntakePayload exactly — no mapping layer required.
// courtName is the display label "Forum / Court" but stored as court_name in DB.
const intakeSchema = z.object({
  courtName:     z.string().min(1,  "Please select a jurisdiction forum"),
  caseType:      z.string().min(1,  "Case classification is required"),
  petitioner:    z.string().min(3,  "Petitioner legal name must be at least 3 characters"),
  respondent:    z.string().min(3,  "Respondent / State name must be at least 3 characters"),
  subjectMatter: z.string().min(10, "Brief subject matter description (min 10 characters)"),
});

type IntakeForm   = z.infer<typeof intakeSchema>;
type FieldErrors  = Partial<Record<keyof IntakeForm, string>>;

const EMPTY: IntakeForm = {
  courtName: "", caseType: "", petitioner: "", respondent: "", subjectMatter: "",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CaseIntakePage() {
  const [form,   setForm]   = useState<IntakeForm>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "submitting" } | { kind: "success"; caseId: number } | { kind: "error"; message: string }
  >({ kind: "idle" });

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

    setStatus({ kind: "submitting" });

    // result.data is exactly IntakePayload — no mapping, no TS2345
    const actionResult = await createIntakeRecord(result.data);

    if (actionResult.success) {
      setStatus({ kind: "success", caseId: actionResult.caseId });
      setForm(EMPTY);
      setErrors({});
    } else {
      setStatus({ kind: "error", message: actionResult.error });
    }
  }

  const fieldCls = (hasError: boolean) =>
    `w-full text-sm rounded-md border bg-stone-50 px-3 py-2 outline-none transition-all ${
      hasError
        ? "border-red-400 ring-1 ring-red-400/30"
        : "border-stone-300 focus:ring-1 focus:ring-amber-600/30 focus:border-amber-600"
    }`;

  const err = (field: keyof IntakeForm) =>
    errors[field] ? (
      <span className="text-[10px] text-red-500 mt-1 block">{errors[field]}</span>
    ) : null;

  const isSubmitting = status.kind === "submitting";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900">Case Intake &amp; Registration</h2>
        <p className="text-sm text-stone-500 mt-1">
          Standardised e-Filing pipeline. Intake records are append-only to maintain evidentiary
          immutability.
        </p>
      </div>

      {/* Status banners */}
      {status.kind === "success" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-500" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Case #{status.caseId} initialised successfully.
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              The record is now in the intake queue. Proceed to Matters to assign counsel.
            </p>
          </div>
        </div>
      )}
      {status.kind === "error" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-red-500" />
          <p className="text-sm text-red-700">{status.message}</p>
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <form onSubmit={handleSubmit} noValidate className="p-8 space-y-8">

          {/* Section 1: Jurisdiction & Classification */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-2">
              1. Jurisdiction &amp; Classification
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="courtName" className="block text-xs font-medium text-stone-600 mb-1">
                  Forum / Court <span className="text-red-500">*</span>
                </label>
                <select
                  id="courtName"
                  value={form.courtName}
                  onChange={e => set("courtName", e.target.value)}
                  className={fieldCls(!!errors.courtName)}
                >
                  <option value="">— Select Forum —</option>
                  <optgroup label="High Courts">
                    <option value="High Court of Chhattisgarh">High Court of Chhattisgarh</option>
                    <option value="High Court of Bombay">High Court of Bombay</option>
                    <option value="High Court of Delhi">High Court of Delhi</option>
                  </optgroup>
                  <optgroup label="District Courts">
                    <option value="District &amp; Sessions Court, Raipur">District &amp; Sessions Court, Raipur</option>
                    <option value="District &amp; Sessions Court, Bilaspur">District &amp; Sessions Court, Bilaspur</option>
                  </optgroup>
                  <optgroup label="Specialised Tribunals">
                    <option value="Commercial Court">Commercial Court</option>
                    <option value="NCLT">NCLT</option>
                    <option value="NCDRC">NCDRC</option>
                    <option value="NGT">NGT</option>
                  </optgroup>
                </select>
                {err("courtName")}
              </div>

              <div>
                <label htmlFor="caseType" className="block text-xs font-medium text-stone-600 mb-1">
                  Case Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="caseType"
                  value={form.caseType}
                  onChange={e => set("caseType", e.target.value)}
                  className={fieldCls(!!errors.caseType)}
                >
                  <option value="">— Select Case Type —</option>
                  <optgroup label="Civil">
                    <option value="Writ Petition (Civil)">Writ Petition (Civil)</option>
                    <option value="First Appeal">First Appeal</option>
                    <option value="Commercial Suit">Commercial Suit</option>
                    <option value="Execution Petition">Execution Petition</option>
                  </optgroup>
                  <optgroup label="Criminal">
                    <option value="Criminal Revision">Criminal Revision</option>
                    <option value="Criminal Appeal">Criminal Appeal</option>
                    <option value="Bail Application">Bail Application</option>
                  </optgroup>
                  <optgroup label="Special">
                    <option value="SLP (Civil)">SLP (Civil)</option>
                    <option value="Arbitration Petition">Arbitration Petition</option>
                    <option value="Contempt Petition">Contempt Petition</option>
                  </optgroup>
                </select>
                {err("caseType")}
              </div>
            </div>
          </section>

          {/* Section 2: Party Details */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-2">
              2. Party Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="petitioner" className="block text-xs font-medium text-stone-600 mb-1">
                  Petitioner / Appellant <span className="text-red-500">*</span>
                </label>
                <input
                  id="petitioner"
                  type="text"
                  placeholder="Legal name of entity or individual"
                  value={form.petitioner}
                  onChange={e => set("petitioner", e.target.value)}
                  className={fieldCls(!!errors.petitioner)}
                />
                {err("petitioner")}
              </div>

              <div>
                <label htmlFor="respondent" className="block text-xs font-medium text-stone-600 mb-1">
                  Respondent / Defendant <span className="text-red-500">*</span>
                </label>
                <input
                  id="respondent"
                  type="text"
                  placeholder="State or opposing party"
                  value={form.respondent}
                  onChange={e => set("respondent", e.target.value)}
                  className={fieldCls(!!errors.respondent)}
                />
                {err("respondent")}
              </div>
            </div>
          </section>

          {/* Section 3: Subject Matter */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-2">
              3. Subject Matter
            </h3>
            <div>
              <label htmlFor="subjectMatter" className="block text-xs font-medium text-stone-600 mb-1">
                Brief description of the matter <span className="text-red-500">*</span>
              </label>
              <textarea
                id="subjectMatter"
                rows={3}
                placeholder="E.g. Challenge to land acquisition award under Section 18 of the Land Acquisition Act..."
                value={form.subjectMatter}
                onChange={e => set("subjectMatter", e.target.value)}
                className={`${fieldCls(!!errors.subjectMatter)} resize-none`}
              />
              {err("subjectMatter")}
            </div>
          </section>

          {/* Action Area */}
          <div className="pt-6 border-t border-stone-100 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => { setForm(EMPTY); setErrors({}); setStatus({ kind: "idle" }); }}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-slate-900 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Processing…
                </>
              ) : (
                "Initialise Case Record"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
