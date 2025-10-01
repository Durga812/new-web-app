"use client";

import { create } from "zustand";

type EnrollmentState = {
  purchasedProductIds: string[];
  purchasedEnrollIds: string[];
  initialized: boolean;
};

type EnrollmentActions = {
  setEnrollmentData: (payload: {
    productIds?: string[] | null;
    enrollIds?: string[] | null;
  }) => void;
  markProductPurchased: (productId?: string | null) => void;
  markEnrollPurchased: (enrollId?: string | null) => void;
  isProductPurchased: (productId?: string | null) => boolean;
  isEnrollPurchased: (enrollId?: string | null) => boolean;
  reset: () => void;
};

type EnrollmentStore = EnrollmentState & EnrollmentActions;

const normalizeIds = (ids?: string[] | null) => {
  if (!ids) return [] as string[];
  return Array.from(
    new Set(
      ids
        .map(id => id?.trim())
        .filter((value): value is string => Boolean(value && value.length > 0)),
    ),
  );
};

const normalizeId = (id?: string | null) => {
  const trimmed = id?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

export const useEnrollmentStore = create<EnrollmentStore>()((set, get) => ({
  purchasedProductIds: [],
  purchasedEnrollIds: [],
  initialized: false,
  setEnrollmentData: ({ productIds, enrollIds }) => {
    const normalizedProducts = normalizeIds(productIds);
    const normalizedEnrolls = normalizeIds(enrollIds);

    set(current => {
      const hasChanges =
        current.purchasedProductIds.length !== normalizedProducts.length ||
        current.purchasedEnrollIds.length !== normalizedEnrolls.length ||
        !normalizedProducts.every(id => current.purchasedProductIds.includes(id)) ||
        !normalizedEnrolls.every(id => current.purchasedEnrollIds.includes(id));

      if (!hasChanges && current.initialized) {
        return current;
      }

      return {
        purchasedProductIds: normalizedProducts,
        purchasedEnrollIds: normalizedEnrolls,
        initialized: true,
      };
    });
  },
  markProductPurchased: productId => {
    const normalized = normalizeId(productId);
    if (!normalized) return;

    set(state => {
      if (state.purchasedProductIds.includes(normalized)) {
        return state;
      }

      return {
        ...state,
        purchasedProductIds: [...state.purchasedProductIds, normalized],
        initialized: true,
      };
    });
  },
  markEnrollPurchased: enrollId => {
    const normalized = normalizeId(enrollId);
    if (!normalized) return;

    set(state => {
      if (state.purchasedEnrollIds.includes(normalized)) {
        return state;
      }

      return {
        ...state,
        purchasedEnrollIds: [...state.purchasedEnrollIds, normalized],
        initialized: true,
      };
    });
  },
  isProductPurchased: productId => {
    const normalized = normalizeId(productId);
    if (!normalized) return false;
    return get().purchasedProductIds.includes(normalized);
  },
  isEnrollPurchased: enrollId => {
    const normalized = normalizeId(enrollId);
    if (!normalized) return false;
    return get().purchasedEnrollIds.includes(normalized);
  },
  reset: () =>
    set({
      purchasedProductIds: [],
      purchasedEnrollIds: [],
      initialized: false,
    }),
}));
