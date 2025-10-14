// LearnWorlds configuration
const LEARNWORLDS_BASE_URL = process.env.LEARNWORLDS_BASE_URL ?? "https://courses.greencardiy.com";
const LEARNWORLDS_API_TOKEN = process.env.LEARNWORLDS_API_TOKEN;
const LEARNWORLDS_CLIENT_ID = process.env.LEARNWORLDS_CLIENT_ID;

type ProgressResponse = {
  progress_rate: number;
  completed_units: number;
  total_units: number;
};

/**
 * Fetch course progress from LearnWorlds
 */
export async function getCourseProgress(
  email: string,
  courseEnrollId: string
): Promise<{ success: boolean; progress: number | null; error?: string }> {
  try {
    const response = await fetch(
      `${LEARNWORLDS_BASE_URL}/admin/api/v2/users/${encodeURIComponent(email)}/courses/${courseEnrollId}/progress`,
      {
        headers: {
          'Authorization': `Bearer ${LEARNWORLDS_API_TOKEN}`,
          'Lw-Client': LEARNWORLDS_CLIENT_ID!,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch progress:', response.status);
      return { success: false, progress: null, error: 'Failed to fetch progress' };
    }

    const data: ProgressResponse = await response.json();
    return { success: true, progress: data.progress_rate };
    
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return { success: false, progress: null, error: 'Error fetching progress' };
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