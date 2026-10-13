"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createIntakeRecord } from "./actions";

// ─── Zod Schema ───────────────────────────────────────────────────────────────
// "forum" is the display label; it maps to courtName in the DB.
const intakeSchema = z.object({
  forum:         z.string().min(1, "Please select a jurisdiction forum"),
  caseType:      z.string().min(1, "Case classification is required"),
  petitioner:    z.string().min(3, "Petitioner legal name must be at least 3 characters"),
  respondent:    z.string().min(3, "Respondent / State name must be at least 3 characters"),
  subjectMatter: z.string().min(10, "Brief subject matter description (min 10 characters)"),
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
export default function CaseIntakePage() {
  const [submitState, setSubmitState] = useState<
    { kind: "idle" } | { kind: "success"; caseId: number } | { kind: "error"; message: string }
  >({ kind: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: { forum: "", caseType: "", petitioner: "", respondent: "", subjectMatter: "" },
  });

  const onSubmit = async (data: IntakeFormValues) => {
    setSubmitState({ kind: "idle" });
    const result = await createIntakeRecord({
      courtName:    data.forum,          // map display label → DB column
      caseType:     data.caseType,
      petitioner:   data.petitioner,
      respondent:   data.respondent,
      subjectMatter: data.subjectMatter,
    });

    if (result.success) {
      setSubmitState({ kind: "success", caseId: result.caseId });
      reset();
    } else {
      setSubmitState({ kind: "error", message: result.error });
    }
  };

  const fieldCls = (hasError: boolean) =>
    `w-full text-sm rounded-md border bg-stone-50 px-3 py-2 outline-none transition-all ${
      hasError
        ? "border-red-400 ring-1 ring-red-400/30"
        : "border-stone-300 focus:ring-1 focus:ring-amber-600/30 focus:border-amber-600"
    }`;

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
      {submitState.kind === "success" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-500" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Case #{submitState.caseId} initialised successfully.
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              The record is now in the intake queue. Proceed to Matters to assign counsel.
            </p>
          </div>
        </div>
      )}
      {submitState.kind === "error" && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-red-500" />
          <p className="text-sm text-red-700">{submitState.message}</p>
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">

          {/* Section 1: Jurisdiction & Classification */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-2">
              1. Jurisdiction &amp; Classification
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Forum / Court <span className="text-red-500">*</span>
                </label>
                <select {...register("forum")} className={fieldCls(!!errors.forum)}>
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
                {errors.forum && (
                  <span className="text-[10px] text-red-500 mt-1 block">{errors.forum.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Case Type <span className="text-red-500">*</span>
                </label>
                <select {...register("caseType")} className={fieldCls(!!errors.caseType)}>
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
                {errors.caseType && (
                  <span className="text-[10px] text-red-500 mt-1 block">{errors.caseType.message}</span>
                )}
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
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Petitioner / Appellant <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Legal name of entity or individual"
                  {...register("petitioner")}
                  className={fieldCls(!!errors.petitioner)}
                />
                {errors.petitioner && (
                  <span className="text-[10px] text-red-500 mt-1 block">{errors.petitioner.message}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Respondent / Defendant <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="State or opposing party"
                  {...register("respondent")}
                  className={fieldCls(!!errors.respondent)}
                />
                {errors.respondent && (
                  <span className="text-[10px] text-red-500 mt-1 block">{errors.respondent.message}</span>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Subject Matter */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-stone-100 pb-2">
              3. Subject Matter
            </h3>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Brief description of the matter <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="E.g. Challenge to land acquisition award under Section 18 of the Land Acquisition Act..."
                {...register("subjectMatter")}
                className={`${fieldCls(!!errors.subjectMatter)} resize-none`}
              />
              {errors.subjectMatter && (
                <span className="text-[10px] text-red-500 mt-1 block">{errors.subjectMatter.message}</span>
              )}
            </div>
          </section>

          {/* Action Area */}
          <div className="pt-6 border-t border-stone-100 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => { reset(); setSubmitState({ kind: "idle" }); }}
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
