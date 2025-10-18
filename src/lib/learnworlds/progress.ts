import { supabase } from "@/lib/supabase/server";
import {
  aggregateWatchedByCourse,
  AggregatedCourseProgress,
} from "./progress-utils";

// LearnWorlds configuration
const LEARNWORLDS_BASE_URL = process.env.LEARNWORLDS_BASE_URL ?? "https://courses.greencardiy.com";
const LEARNWORLDS_API_TOKEN = process.env.LEARNWORLDS_API_TOKEN;
const LEARNWORLDS_CLIENT_ID = process.env.LEARNWORLDS_CLIENT_ID;

const toPositiveNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

type CourseProgressResult = {
  success: boolean;
  progress: number | null;
  watchedDurationSeconds?: number;
  totalDurationSeconds?: number;
  error?: string;
};

/**
 * Fetch course progress based on aggregated video durations
 */
export async function getCourseProgress(
  email: string,
  courseEnrollId: string
): Promise<CourseProgressResult> {
  try {
    const normalizedEmail = typeof email === "string" ? email.trim() : "";
    const normalizedCourseId =
      typeof courseEnrollId === "string" ? courseEnrollId.trim() : "";

    if (!normalizedCourseId) {
      return {
        success: false,
        progress: null,
        error: "Missing course enrollment identifier",
      };
    }

    if (!normalizedEmail) {
      return {
        success: false,
        progress: null,
        error: "Missing user email for progress lookup",
      };
    }

    const { data: durationRows, error: durationError } = await supabase
      .from("lw_course_units")
      .select("lw_course_id, duration")
      .eq("lw_course_id", normalizedCourseId);

    if (durationError) {
      console.error(
        "[getCourseProgress] Failed to fetch course durations:",
        durationError
      );
    }

    let totalDurationSeconds = 0;
    for (const row of durationRows ?? []) {
      if (!row) continue;
      const courseId =
        typeof row.lw_course_id === "string" ? row.lw_course_id.trim() : "";
      if (!courseId || courseId !== normalizedCourseId) continue;
      totalDurationSeconds += Math.max(0, toPositiveNumber(row.duration));
    }

    const fetchProgress = async (
      column: "user_id" | "user_email",
      value: string
    ): Promise<AggregatedCourseProgress | undefined> => {
      const { data, error } = await supabase
        .from("video_progress")
        .select("course_id, unit_id, video_id, video_duration, covered_segments")
        .eq("course_id", normalizedCourseId)
        .eq(column, value);

      if (error) {
        console.error(
          `[getCourseProgress] Failed to fetch video progress by ${column}:`,
          error
        );
        return undefined;
      }

      const aggregated = aggregateWatchedByCourse(data);
      return aggregated.get(normalizedCourseId);
    };

    let summary: AggregatedCourseProgress | undefined;

    const { data: userLookup, error: userLookupError } = await supabase
      .from("users")
      .select("learnworlds_user_id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userLookupError) {
      console.error(
        "[getCourseProgress] Failed to fetch user record by email:",
        userLookupError
      );
    }

    const learnworldsUserId =
      typeof userLookup?.learnworlds_user_id === "string"
        ? userLookup.learnworlds_user_id.trim()
        : "";

    if (learnworldsUserId) {
      summary = await fetchProgress("user_id", learnworldsUserId);
    }

    if (!summary) {
      summary = await fetchProgress("user_email", normalizedEmail);
    }

    const watchedSeconds = summary?.watchedSeconds ?? 0;
    const fallbackTotalDuration = summary?.availableSeconds ?? 0;

    if (totalDurationSeconds <= 0 && fallbackTotalDuration > 0) {
      totalDurationSeconds = fallbackTotalDuration;
    }

    const normalizedTotal = Math.max(0, Math.round(totalDurationSeconds));
    const rawWatched = Math.max(0, watchedSeconds);
    const normalizedWatched =
      normalizedTotal > 0
        ? Math.min(Math.round(rawWatched), normalizedTotal)
        : Math.round(rawWatched);

    const percent =
      normalizedTotal > 0
        ? (normalizedWatched / normalizedTotal) * 100
        : 0;

    const clampedPercent = Math.min(100, Math.max(0, percent));

    return {
      success: true,
      progress: Number.isFinite(clampedPercent)
        ? Number(clampedPercent.toFixed(2))
        : 0,
      watchedDurationSeconds: normalizedWatched,
      totalDurationSeconds: normalizedTotal,
    };
  } catch (error) {
    console.error("Error calculating course progress:", error);
    return { success: false, progress: null, error: "Error calculating progress" };
  }
}

/**
 * Unenroll user from LearnWorlds course/bundle
 */
export async function unenrollFromLearnWorlds(
  email: string,
  enrollId: string,
  lwProductType: string // 'bundle' | 'subscription' | 'course'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `${LEARNWORLDS_BASE_URL}/admin/api/v2/users/${encodeURIComponent(email)}/enrollment`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${LEARNWORLDS_API_TOKEN}`,
          'Lw-Client': LEARNWORLDS_CLIENT_ID!,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          productId: enrollId,
          productType: lwProductType,
        }),
      }
    );

    // LearnWorlds returns 204 No Content on success
    if (response.status === 204 || response.ok) {
      return { success: true };
    }

    console.error('Failed to unenroll:', response.status);
    return { success: false, error: `HTTP ${response.status}` };
    
  } catch (error) {
    console.error('Error unenrolling from LearnWorlds:', error);
    return { success: false, error: 'Error unenrolling' };
  }
}
