"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Save, Trash2 } from "lucide-react";

import { saveReferralPoliciesAction } from "../actions";
import type {
  ReferralPoliciesData,
  ReferralPolicyRule,
  RewardRecipient,
  RewardTrigger,
} from "../types";

interface ReferralPoliciesPageClientProps {
  initialData: ReferralPoliciesData;
}

const triggerOptions: { value: RewardTrigger; label: string }[] = [
  { value: "signup", label: "Signup" },
  { value: "profile_completed", label: "Profile completed" },
  { value: "referral_joined", label: "Referral joined" },
  { value: "first_booking_completed", label: "First booking completed" },
];

const recipientOptions: { value: RewardRecipient; label: string }[] = [
  { value: "referrer", label: "Referrer" },
  { value: "referee", label: "Referee" },
];

function createEmptyRule(sortOrder: number): ReferralPolicyRule {
  return {
    id: crypto.randomUUID(),
    trigger: "referral_joined",
    recipient: "referrer",
    referralOrdinal: null,
    discountType: "percent",
    discountValue: 0,
    title: "New rule",
    description: null,
    sortOrder,
    isActive: true,
    requiresPreviousCouponRedeemed: true,
  };
}

export function ReferralPoliciesPageClient({
  initialData,
}: ReferralPoliciesPageClientProps) {
  const [name, setName] = useState(initialData.program.name);
  const [description, setDescription] = useState(initialData.program.description ?? "");
  const [allowStacking, setAllowStacking] = useState(initialData.program.allowStacking);
  const [requirePreviousCouponRedeemed, setRequirePreviousCouponRedeemed] = useState(
    initialData.program.requirePreviousCouponRedeemed
  );
  const [maxReferralsPerReferrer, setMaxReferralsPerReferrer] = useState(
    initialData.program.maxReferralsPerReferrer?.toString() ?? ""
  );
  const [rules, setRules] = useState<ReferralPolicyRule[]>(initialData.rules);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.sortOrder - b.sortOrder),
    [rules]
  );

  const updateRule = (id: string, patch: Partial<ReferralPolicyRule>) => {
    setRules((current) =>
      current.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule))
    );
  };

  const addRule = () => {
    setRules((current) => [...current, createEmptyRule(current.length + 1)]);
  };

  const removeRule = (id: string) => {
    setRules((current) => current.filter((rule) => rule.id !== id));
  };

  const save = () => {
    setMessage(null);

    startTransition(async () => {
      const result = await saveReferralPoliciesAction({
        programId: initialData.program.id,
        name,
        description: description.trim() || null,
        allowStacking,
        requirePreviousCouponRedeemed,
        maxReferralsPerReferrer:
          maxReferralsPerReferrer.trim() === ""
            ? null
            : Number(maxReferralsPerReferrer),
        rules: sortedRules.map((rule, index) => ({
          ...rule,
          sortOrder: index + 1,
        })),
      });

      setMessage(result.message);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referral Policy</h1>
            <p className="text-gray-600 mt-1">Edit the active program instead of hard-coding percentages in the app.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app/admin/referrals"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to dashboard
            </Link>
            <button
              onClick={save}
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-xl bg-[#083f30] px-4 py-2.5 text-white font-semibold hover:bg-[#0a5a44] transition-colors disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              Save policy
            </button>
          </div>
        </div>

        {message ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
            {message}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Program name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-300 px-3 outline-none focus:border-[#083f30]"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Program code</span>
              <input
                value={initialData.program.code}
                readOnly
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-gray-500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Max referrals per referrer</span>
              <input
                value={maxReferralsPerReferrer}
                onChange={(event) => setMaxReferralsPerReferrer(event.target.value)}
                inputMode="numeric"
                className="h-11 w-full rounded-xl border border-gray-300 px-3 outline-none focus:border-[#083f30]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 items-end">
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allowStacking}
                  onChange={(event) => setAllowStacking(event.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">Allow stacking</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-3">
                <input
                  type="checkbox"
                  checked={requirePreviousCouponRedeemed}
                  onChange={(event) => setRequirePreviousCouponRedeemed(event.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">Force order</span>
              </label>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#083f30]"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Reward Rules</h2>
              <p className="text-sm text-gray-600 mt-1">Rules are evaluated by trigger, recipient, and optional referral order.</p>
            </div>
            <button
              onClick={addRule}
              className="inline-flex items-center justify-center rounded-xl border border-[#083f30] px-4 py-2 text-[#083f30] font-semibold hover:bg-[#083f30]/5"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add rule
            </button>
          </div>

          <div className="space-y-4">
            {sortedRules.map((rule, index) => (
              <div key={rule.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-semibold text-gray-900">Rule #{index + 1}</div>
                  <button
                    onClick={() => removeRule(rule.id)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Title</span>
                    <input
                      value={rule.title}
                      onChange={(event) => updateRule(rule.id, { title: event.target.value })}
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 outline-none focus:border-[#083f30]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Trigger</span>
                    <select
                      value={rule.trigger}
                      onChange={(event) =>
                        updateRule(rule.id, { trigger: event.target.value as RewardTrigger })
                      }
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 outline-none focus:border-[#083f30]"
                    >
                      {triggerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Recipient</span>
                    <select
                      value={rule.recipient}
                      onChange={(event) =>
                        updateRule(rule.id, { recipient: event.target.value as RewardRecipient })
                      }
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 outline-none focus:border-[#083f30]"
                    >
                      {recipientOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Referral order</span>
                    <input
                      value={rule.referralOrdinal ?? ""}
                      onChange={(event) =>
                        updateRule(rule.id, {
                          referralOrdinal:
                            event.target.value === "" ? null : Number(event.target.value),
                        })
                      }
                      inputMode="numeric"
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 outline-none focus:border-[#083f30]"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Discount type</span>
                    <select
                      value={rule.discountType}
                      onChange={(event) =>
                        updateRule(rule.id, {
                          discountType: event.target.value as "percent" | "fixed",
                        })
                      }
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 outline-none focus:border-[#083f30]"
                    >
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed amount</option>
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Discount value</span>
                    <input
                      value={rule.discountValue}
                      onChange={(event) =>
                        updateRule(rule.id, { discountValue: Number(event.target.value) })
                      }
                      inputMode="decimal"
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 outline-none focus:border-[#083f30]"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-gray-700">Description</span>
                    <textarea
                      rows={2}
                      value={rule.description ?? ""}
                      onChange={(event) => updateRule(rule.id, { description: event.target.value })}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-[#083f30]"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={(event) => updateRule(rule.id, { isActive: event.target.checked })}
                      />
                      <span className="text-sm font-medium text-gray-700">Rule active</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <input
                        type="checkbox"
                        checked={rule.requiresPreviousCouponRedeemed}
                        onChange={(event) =>
                          updateRule(rule.id, {
                            requiresPreviousCouponRedeemed: event.target.checked,
                          })
                        }
                      />
                      <span className="text-sm font-medium text-gray-700">Force queue</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
