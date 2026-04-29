"use client";
import { useFormState } from "react-dom";
import { ImageUrlInputList } from "@/components/forms/image-url-input-list";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError, FieldError } from "@/components/forms/form-error";
import { BD_CITIES } from "@/lib/constants";
import { useState } from "react";

type Category = { id: string; name: string; type: string | null };

type Defaults = {
  title?: string;
  description?: string;
  listingType?: string;
  categoryId?: string;
  priceType?: string;
  basePrice?: string | number;
  depositAmount?: string | number;
  replacementValue?: string | number;
  riskLevel?: string;
  deliveryAvailable?: boolean;
  deliveryBaseFee?: string | number;
  deliveryPerKmFee?: string | number;
  serviceArea?: string;
  locationArea?: string;
  city?: string;
  exactLocation?: string;
  publicLocationNote?: string;
  lateFeeAmount?: string | number;
  lateFeeUnit?: string;
  includedItems?: string;
  notIncludedItems?: string;
  safetyInstructions?: string;
  cancellationPolicy?: string;
  brand?: string;
  model?: string;
  condition?: string;
  imageUrls?: string[];
};

type FormResult = { ok: boolean; error?: string; fieldErrors?: Record<string, string[]>; message?: string };

export function ListingForm({
  action,
  categories,
  defaultValues = {},
  submitLabel = "Save",
}: {
  action: (prev: FormResult, fd: FormData) => Promise<FormResult>;
  categories: Category[];
  defaultValues?: Defaults;
  submitLabel?: string;
}) {
  const [state, run] = useFormState<FormResult, FormData>(action, { ok: false, error: "" });
  const [listingType, setListingType] = useState<string>(defaultValues.listingType ?? "TOOL_ONLY");
  const fe = state.fieldErrors;
  const isToolOnly = listingType === "TOOL_ONLY";

  return (
    <form action={run} className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="label">Title</label>
        <input name="title" required defaultValue={defaultValues.title} className="input" />
        <FieldError messages={fe?.title} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={defaultValues.description}
          className="input"
        />
        <FieldError messages={fe?.description} />
      </div>
      <div>
        <label className="label">Listing type</label>
        <select
          name="listingType"
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          className="input"
        >
          <option value="TOOL_ONLY">Tool only</option>
          <option value="SKILL_ONLY">Skill only</option>
          <option value="TOOL_WITH_OPERATOR">Tool with operator</option>
          <option value="PACKAGE">Package</option>
        </select>
      </div>
      <div>
        <label className="label">Category</label>
        <select name="categoryId" required defaultValue={defaultValues.categoryId} className="input">
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError messages={fe?.categoryId} />
      </div>
      <div>
        <label className="label">Price type</label>
        <select name="priceType" defaultValue={defaultValues.priceType ?? "DAILY"} className="input">
          <option value="HOURLY">Hourly</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="TASK">Per task</option>
          <option value="PACKAGE">Package</option>
          <option value="CUSTOM_QUOTE">Custom quote</option>
        </select>
      </div>
      <div>
        <label className="label">Base price (৳)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          name="basePrice"
          required
          defaultValue={String(defaultValues.basePrice ?? 0)}
          className="input"
        />
        <FieldError messages={fe?.basePrice} />
      </div>

      {isToolOnly && (
        <>
          <div>
            <label className="label">Replacement value (৳)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="replacementValue"
              defaultValue={String(defaultValues.replacementValue ?? 0)}
              className="input"
            />
            <FieldError messages={fe?.replacementValue} />
          </div>
          <div>
            <label className="label">Deposit (৳)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="depositAmount"
              defaultValue={String(defaultValues.depositAmount ?? 0)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Risk level</label>
            <select
              name="riskLevel"
              defaultValue={defaultValues.riskLevel ?? "LOW"}
              className="input"
            >
              <option value="LOW">Low (10%)</option>
              <option value="MEDIUM">Medium (25%)</option>
              <option value="HIGH">High (50%)</option>
            </select>
          </div>
          <div>
            <label className="label">Late fee (৳)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="lateFeeAmount"
              defaultValue={String(defaultValues.lateFeeAmount ?? 0)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Late fee unit</label>
            <select
              name="lateFeeUnit"
              defaultValue={defaultValues.lateFeeUnit ?? "DAY"}
              className="input"
            >
              <option value="HOUR">Per hour</option>
              <option value="DAY">Per day</option>
            </select>
          </div>
        </>
      )}

      <div>
        <label className="label">City</label>
        <select name="city" defaultValue={defaultValues.city ?? "Dhaka"} className="input">
          {BD_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Area</label>
        <input
          name="locationArea"
          required
          defaultValue={defaultValues.locationArea}
          className="input"
        />
        <FieldError messages={fe?.locationArea} />
      </div>
      <div>
        <label className="label">Service area (for skills)</label>
        <input
          name="serviceArea"
          defaultValue={defaultValues.serviceArea}
          className="input"
          placeholder="e.g. Dhaka city, within 5 km"
        />
      </div>
      <div>
        <label className="label">Public location note</label>
        <input
          name="publicLocationNote"
          defaultValue={defaultValues.publicLocationNote}
          className="input"
          placeholder="Visible to bookers (no exact address)"
        />
      </div>
      <div className="md:col-span-2 flex items-center gap-2">
        <input
          id="delivery"
          type="checkbox"
          name="deliveryAvailable"
          defaultChecked={defaultValues.deliveryAvailable}
          className="h-4 w-4 rounded border-gray-300 text-brand-600"
        />
        <label htmlFor="delivery" className="text-sm">
          Delivery available (within service area)
        </label>
      </div>
      <div>
        <label className="label">Delivery base fee (৳)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          name="deliveryBaseFee"
          defaultValue={String(defaultValues.deliveryBaseFee ?? 0)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Delivery per-km fee (৳)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          name="deliveryPerKmFee"
          defaultValue={String(defaultValues.deliveryPerKmFee ?? 0)}
          className="input"
        />
      </div>

      <div className="md:col-span-2">
        <label className="label">Image URLs</label>
        <ImageUrlInputList name="imageUrls" defaultValue={defaultValues.imageUrls ?? []} />
      </div>

      <div>
        <label className="label">Brand</label>
        <input name="brand" defaultValue={defaultValues.brand} className="input" />
      </div>
      <div>
        <label className="label">Model</label>
        <input name="model" defaultValue={defaultValues.model} className="input" />
      </div>
      <div>
        <label className="label">Condition</label>
        <input name="condition" defaultValue={defaultValues.condition} className="input" />
      </div>

      <div className="md:col-span-2">
        <label className="label">What's included</label>
        <textarea
          name="includedItems"
          rows={2}
          defaultValue={defaultValues.includedItems}
          className="input"
        />
      </div>
      <div className="md:col-span-2">
        <label className="label">Not included</label>
        <textarea
          name="notIncludedItems"
          rows={2}
          defaultValue={defaultValues.notIncludedItems}
          className="input"
        />
      </div>
      <div className="md:col-span-2">
        <label className="label">Safety instructions</label>
        <textarea
          name="safetyInstructions"
          rows={2}
          defaultValue={defaultValues.safetyInstructions}
          className="input"
        />
      </div>
      <div className="md:col-span-2">
        <label className="label">Cancellation policy</label>
        <textarea
          name="cancellationPolicy"
          rows={2}
          defaultValue={defaultValues.cancellationPolicy}
          className="input"
        />
      </div>

      {!state.ok && state.error && (
        <div className="md:col-span-2">
          <FormError message={state.error} />
        </div>
      )}
      {state.ok && state.message && (
        <div className="md:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {state.message}
        </div>
      )}

      <div className="md:col-span-2 flex justify-end">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
