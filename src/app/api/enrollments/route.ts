import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase/server";

type _EnrollmentRow = {
  product_id: string | null;
  enroll_id: string | null;
  enrollment_status: string | null;
  status: string | null;
};

const toUniqueIds = (items: Array<string | null>) => {
  return Array.from(
    new Set(
      items
        .map(value => value?.trim())
        .filter((value): value is string => Boolean(value && value.length > 0)),
    ),
  );
};

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { productIds: [], enrollIds: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select("product_id,enroll_id,enrollment_status,status")
    .eq("clerk_user_id", userId)
    .eq("status", "active");

  if (error) {
    console.error("Failed to fetch enrollments for store hydration", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const typedData = (data ?? []) as _EnrollmentRow[];
  const successful = typedData.filter(row => row.enrollment_status === "success");
  const productIds = toUniqueIds(successful.map(row => row.product_id));
  const enrollIds = toUniqueIds(successful.map(row => row.enroll_id));

  return NextResponse.json(
    { productIds, enrollIds },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
