"use client";

import { ReactNode, useEffect } from "react";
import { useEnrollmentStore } from "@/stores/enrollment-store";

interface EnrollmentProviderProps {
  productIds?: string[];
  enrollIds?: string[];
  children: ReactNode;
}

export function EnrollmentProvider({ productIds, enrollIds, children }: EnrollmentProviderProps) {
  const setEnrollmentData = useEnrollmentStore(state => state.setEnrollmentData);
  const initialized = useEnrollmentStore(state => state.initialized);

  if (!initialized) {
    setEnrollmentData({ productIds, enrollIds });
  }

  useEffect(() => {
    setEnrollmentData({ productIds, enrollIds });
  }, [productIds, enrollIds, setEnrollmentData]);

  return <>{children}</>;
}
