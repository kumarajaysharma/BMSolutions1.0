'use client';

import React, { useState } from 'react';

interface AddBoqItemModalProps {
  boqId: string | number;
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

export default function AddBoqItemModal({ boqId, tenantId, isOpen, onClose, onItemAdded }: AddBoqItemModalProps) {
  const [formData, setFormData] = useState({
    itemNumber: '',
    sectionCode: '',
    isSectionHeader: false,
    description: '',
    unit: '',
    quantity: '',
    unitRateRupees: '',
    rateRef: '',
    remarks: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert Rupees to Paise for database storage
      const rateRupees = parseFloat(formData.unitRateRupees) || 0;
      const unitRatePaise = Math.round(rateRupees * 100);

      const response = await fetch(`/api/nidhivan/boqs/${boqId}/items`, {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemNumber: parseInt(formData.itemNumber, 10),
          sectionCode: formData.sectionCode,
          isSectionHeader: formData.isSectionHeader,
          description: formData.description,
          unit: formData.unit,
          quantity: parseFloat(formData.quantity) || 0,
          unitRatePaise,
          rateRef: formData.rateRef,
          remarks: formData.remarks,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to create BOQ item.');
      }

      // Reset form and refresh table parent data
      setFormData({
        itemNumber: '',
        sectionCode: '',
        isSectionHeader: false,
        description: '',
        unit: '',
        quantity: '',
        unitRateRupees: '',
        rateRef: '',
        remarks: '',
      });
      onItemAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-lg font-semibold text-slate-900">Add New BOQ Execution Item</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Item Number *</label>
              <input
                type="number"
                required
                value={formData.itemNumber}
                onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="e.g., 10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Section Code</label>
              <input
                type="text"
                value={formData.sectionCode}
                onChange={(e) => setFormData({ ...formData, sectionCode: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="e.g., SH-01"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="Detailed engineering specification of the work item..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">UOM</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="cum / sqm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Quantity</label>
              <input
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="0.000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Rate (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitRateRupees}
                onChange={(e) => setFormData({ ...formData, unitRateRupees: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Rate Reference</label>
              <input
                type="text"
                value={formData.rateRef}
                onChange={(e) => setFormData({ ...formData, rateRef: e.target.value })}
                className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
                placeholder="e.g., DSR 2023 Item 2.6.1"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isSectionHeader}
                  onChange={(e) => setFormData({ ...formData, isSectionHeader: e.target.checked })}
                  className="rounded border-stone-300"
                />
                Is Section Header (No Quantity/Rate)
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}