import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FollowUpControls({ targetType, record, onUpdate }) {
  const [enabled, setEnabled] = useState(record.follow_up_enabled || false);
  const [frequency, setFrequency] = useState(record.follow_up_frequency_days || 7);
  const [saving, setSaving] = useState(false);

  const handleSave = async (newEnabled, newFreq) => {
    setSaving(true);
    try {
      await base44.functions.invoke("configureFollowUp", {
        entity_type: targetType,
        record_id: record.id,
        enabled: newEnabled,
        frequency_days: newFreq,
      });
      setEnabled(newEnabled);
      setFrequency(newFreq);
      onUpdate?.();
    } catch (e) {
      /* keep current state */
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleSave(!enabled, frequency)}
        disabled={saving}
        className={`relative h-5 w-9 rounded-full transition ${enabled ? "bg-[#c38a1b]" : "bg-black/15"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
            enabled ? "left-4" : "left-0.5"
          }`}
        />
      </button>
      <select
        value={frequency}
        onChange={(e) => handleSave(enabled, Number(e.target.value))}
        disabled={saving || !enabled}
        className="rounded-md border border-black/15 px-2 py-1 text-[11px] disabled:opacity-40"
      >
        <option value={3}>3d</option>
        <option value={5}>5d</option>
        <option value={7}>7d</option>
        <option value={14}>14d</option>
        <option value={30}>30d</option>
      </select>
      {saving && <Loader2 className="h-3 w-3 animate-spin text-black/30" />}
    </div>
  );
}