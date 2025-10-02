"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useEnrollmentStore } from "@/stores/enrollment-store";

interface EnrollmentProviderProps {
  productIds?: string[];
  enrollIds?: string[];
  children: ReactNode;
}

const arraysEqual = (a: string[] = [], b: string[] = []) => {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  const seen = new Set(b);
  if (seen.size !== b.length) {
    const setA = new Set(a);
    if (setA.size !== seen.size) {
      return false;
    }

    for (const value of setA) {
      if (!seen.has(value)) {
        return false;
      }
    }
    return true;
  }

  for (const value of a) {
    if (!seen.has(value)) {
      return false;
    }
  }

  return true;
};

export function EnrollmentProvider({ productIds, enrollIds, children }: EnrollmentProviderProps) {
  const { isLoaded, isSignedIn } = useUser();
  const setEnrollmentData = useEnrollmentStore(state => state.setEnrollmentData);
  const resetEnrollment = useEnrollmentStore(state => state.reset);

  const lastServerProducts = useRef<string[] | undefined>(undefined);
  const lastServerEnrolls = useRef<string[] | undefined>(undefined);

  useEffect(() => {
    const normalizedProducts = productIds ?? [];
    const normalizedEnrolls = enrollIds ?? [];

    if (
      !arraysEqual(lastServerProducts.current, normalizedProducts) ||
      !arraysEqual(lastServerEnrolls.current, normalizedEnrolls)
    ) {
      lastServerProducts.current = [...normalizedProducts];
      lastServerEnrolls.current = [...normalizedEnrolls];
      setEnrollmentData({ productIds: normalizedProducts, enrollIds: normalizedEnrolls });
    }
  }, [productIds, enrollIds, setEnrollmentData]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      resetEnrollment();
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      type EnrollmentPayload = {
        productIds?: string[];
        enrollIds?: string[];
      };

      try {
        const response = await fetch("/api/enrollments", { cache: "no-store" });
        if (!response.ok) {
          console.error("Failed to refresh enrollment store", await response.text());
          return;
        }

        const payload = (await response.json()) as EnrollmentPayload;
        if (!cancelled) {
          setEnrollmentData({
            productIds: payload.productIds,
            enrollIds: payload.enrollIds,
          });
        }
      } catch (error) {
        console.error("Unexpected error refreshing enrollment store", error);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, resetEnrollment, setEnrollmentData]);

  return <>{children}</>;
}
