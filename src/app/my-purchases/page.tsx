// src/app/my-purchases/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Package, 
  CreditCard,
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnrollmentCard } from '@/components/my-purchases/EnrollmentCard';
import { BillingPortalButton } from '@/components/my-purchases/BillingButton';
import { OrderHistoryTable } from '@/components/my-purchases/OrderHistoryItem';
import { getMyEnrollments, getMyOrderHistory } from '@/app/actions/my-purchases';
import { getCourseBasicsLookup } from '@/lib/data/course_lookup';
import { groupCourseEnrollmentsByCategory } from '@/lib/utils/groupCourseEnrollments';
import { formatSeriesLabel } from '@/lib/utils/formatSeriesLabel';

export const metadata = {
  title: 'My Purchases - Immigreat.ai',
  description: 'Access your courses, bundles, and purchase history.',
};

async function MyPurchasesContent() {
  const [enrollments, orderHistory] = await Promise.all([
    getMyEnrollments(),
    getMyOrderHistory()
  ]);

  const activeEnrollments = enrollments.filter(e => !e.is_expired);
  const expiredEnrollments = enrollments.filter(e => e.is_expired);
  const coursesCount = enrollments.filter(e => e.item_type === 'course').length;
  const bundlesCount = enrollments.filter(e => e.item_type === 'bundle').length;

  const activeCourseEnrollments = activeEnrollments.filter(e => e.item_type === 'course');
  const expiredCourseEnrollments = expiredEnrollments.filter(e => e.item_type === 'course');
  const activeBundleEnrollments = activeEnrollments.filter(e => e.item_type === 'bundle');
  const expiredBundleEnrollments = expiredEnrollments.filter(e => e.item_type === 'bundle');

  const needsCourseLookup = activeCourseEnrollments.length > 0 || expiredCourseEnrollments.length > 0;

  const courseLookup = needsCourseLookup
    ? await getCourseBasicsLookup({
        slugs: [...activeCourseEnrollments, ...expiredCourseEnrollments].map((enrollment) => enrollment.product_slug),
        ids: [...activeCourseEnrollments, ...expiredCourseEnrollments].map((enrollment) => enrollment.item_id),
      })
    : { bySlug: {}, byId: {} };

  const groupedActiveCourses = needsCourseLookup
    ? groupCourseEnrollmentsByCategory(activeCourseEnrollments, courseLookup)
    : [];
  const groupedExpiredCourses = needsCourseLookup
    ? groupCourseEnrollmentsByCategory(expiredCourseEnrollments, courseLookup)
    : [];

  const resolveCourseBasics = (enrollment: typeof activeCourseEnrollments[number]) => {
    return (enrollment.product_slug && courseLookup.bySlug[enrollment.product_slug])
      || courseLookup.byId[enrollment.item_id];
  };

  type CourseEnrollment = typeof activeCourseEnrollments[number];

  const NO_SERIES_KEY = '__no_series__';
  const SERIES_FALLBACK_LABEL = 'Individual Courses';

  const buildSeriesGroups = (enrollmentList: CourseEnrollment[]) => {
    const seriesMap = new Map<string, {
      series: string | null;
      label: string;
      enrollments: CourseEnrollment[];
    }>();

    enrollmentList.forEach((enrollment) => {
      const rawSeries = resolveCourseBasics(enrollment)?.series;
      const normalizedSeries = rawSeries && rawSeries.trim().length > 0 ? rawSeries.trim() : null;
      const key = normalizedSeries ?? NO_SERIES_KEY;

      if (!seriesMap.has(key)) {
        const formattedLabel = normalizedSeries
          ? formatSeriesLabel(normalizedSeries) ?? normalizedSeries
          : SERIES_FALLBACK_LABEL;

        seriesMap.set(key, {
          series: normalizedSeries,
          label: formattedLabel,
          enrollments: [],
        });
      }

      seriesMap.get(key)!.enrollments.push(enrollment);
    });

    const entries = Array.from(seriesMap.entries());
    const sortedEntries = entries
      .filter(([key]) => key !== NO_SERIES_KEY)
      .concat(entries.filter(([key]) => key === NO_SERIES_KEY));

    return sortedEntries.map(([key, group]) => ({
      slug: key,
      series: group.series,
      label: group.label,
      enrollments: group.enrollments,
    }));
  };

  const getSeriesGridClass = (count: number) => {
    if (count >= 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1';
  };

  const getEnrollmentGridClass = (count: number) => {
    if (count >= 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1';
  };

  const activeCategoriesWithSeries = groupedActiveCourses.map((group) => ({
    ...group,
    seriesGroups: buildSeriesGroups(group.enrollments as CourseEnrollment[]),
  }));

  const expiredCategoriesWithSeries = groupedExpiredCourses.map((group) => ({
    ...group,
    seriesGroups: buildSeriesGroups(group.enrollments as CourseEnrollment[]),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
  <a
    href="https://courses.greencardiy.com/program/test2-three-course-subscription"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 underline"
  >
    sub3
  </a>
  <br/>
  <a
    href="https://courses.greencardiy.com/program/test2-two-course-subscription"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 underline"
  >
    sub2
  </a>
  <br/>
  <a
    href="https://courses.greencardiy.com/program/test-one-course-subscription"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 underline"
  >
    sub1
  </a>
  <br/>
  <a
    href="https://courses.greencardiy.com/program/eb1a-self-petition-all-in-one-guide"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 underline"
  >
    bundle1
  </a>
</div>
        
        
        {/* Enhanced Header with Hero Section */}
        <div className="relative mb-10">
          <div className="absolute inset-0 -top-20 bg-gradient-to-r from-amber-400/10 to-orange-400/10 blur-3xl" />
          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100/80 backdrop-blur-sm px-3 py-1 rounded-full text-amber-700 text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Learning Dashboard</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                My Learning Journey
              </span>
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Track your progress, access your courses, and continue your immigration education journey
            </p>
          </div>
        </div>

        

        {/* Enhanced My Enrollments Section */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                My Enrollments
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                  {activeEnrollments.length} Active
                </Badge>
                {expiredEnrollments.length > 0 && (
                  <Badge className="bg-gray-100 text-gray-700 border-gray-200 px-3 py-1">
                    {expiredEnrollments.length} Expired
                  </Badge>
                )}
              </div>
            </div>
            <BillingPortalButton />
          </div>

          {enrollments.length > 0 ? (
            <div className="space-y-8">
              {/* Active Enrollments with enhanced styling */}
              {activeEnrollments.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Active Enrollments
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>
                  <div className="space-y-6">
                    {activeCategoriesWithSeries.map((group) => (
                      <div key={`${group.slug}-${group.label}`}>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span
                            className="text-lg font-semibold"
                            style={group.color ? { color: group.color } : undefined}
                          >
                            {group.label}
                          </span>
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            {group.enrollments.length} {group.enrollments.length === 1 ? 'course' : 'courses'}
                          </Badge>
                        </div>
                        <div className={`grid gap-6 ${getSeriesGridClass(group.seriesGroups.length)}`}>
                          {group.seriesGroups.map((seriesGroup) => (
                            <div key={`${group.slug}-${seriesGroup.slug}`} className="space-y-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold text-gray-900">
                                  {seriesGroup.label}
                                </span>
                                <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                                  {seriesGroup.enrollments.length} {seriesGroup.enrollments.length === 1 ? 'course' : 'courses'}
                                </Badge>
                              </div>
                              <div className={`grid gap-4 ${getEnrollmentGridClass(seriesGroup.enrollments.length)}`}>
                                {seriesGroup.enrollments.map((enrollment) => (
                                  <EnrollmentCard
                                    key={enrollment.id}
                                    enrollment={enrollment}
                                    courseSeries={resolveCourseBasics(enrollment)?.series}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {activeBundleEnrollments.length > 0 && (
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span className="text-lg font-semibold text-emerald-600">
                            Bundles
                          </span>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            {activeBundleEnrollments.length} {activeBundleEnrollments.length === 1 ? 'bundle' : 'bundles'}
                          </Badge>
                        </div>
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {activeBundleEnrollments.map((enrollment) => (
                            <EnrollmentCard
                              key={enrollment.id}
                              enrollment={enrollment}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Expired Enrollments with enhanced styling */}
              {expiredEnrollments.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Expired Enrollments
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>
                  <div className="space-y-6">
                    {expiredCategoriesWithSeries.map((group) => (
                      <div key={`${group.slug}-${group.label}`}>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span
                            className="text-lg font-semibold"
                            style={group.color ? { color: group.color } : undefined}
                          >
                            {group.label}
                          </span>
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                            {group.enrollments.length} {group.enrollments.length === 1 ? 'course' : 'courses'}
                          </Badge>
                        </div>
                        <div className={`grid gap-6 ${getSeriesGridClass(group.seriesGroups.length)} opacity-75`}>
                          {group.seriesGroups.map((seriesGroup) => (
                            <div key={`${group.slug}-${seriesGroup.slug}`} className="space-y-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-base font-semibold text-gray-800">
                                  {seriesGroup.label}
                                </span>
                                <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                                  {seriesGroup.enrollments.length} {seriesGroup.enrollments.length === 1 ? 'course' : 'courses'}
                                </Badge>
                              </div>
                              <div className={`grid gap-4 ${getEnrollmentGridClass(seriesGroup.enrollments.length)}`}>
                                {seriesGroup.enrollments.map((enrollment) => (
                                  <EnrollmentCard
                                    key={enrollment.id}
                                    enrollment={enrollment}
                                    courseSeries={resolveCourseBasics(enrollment)?.series}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {expiredBundleEnrollments.length > 0 && (
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <span className="text-lg font-semibold text-gray-600">
                            Bundles
                          </span>
                          <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                            {expiredBundleEnrollments.length} {expiredBundleEnrollments.length === 1 ? 'bundle' : 'bundles'}
                          </Badge>
                        </div>
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 opacity-75">
                          {expiredBundleEnrollments.map((enrollment) => (
                            <EnrollmentCard
                              key={enrollment.id}
                              enrollment={enrollment}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="relative bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 to-orange-100/20" />
              <CardContent className="relative p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Start Your Learning Journey
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Explore our comprehensive courses and bundles designed to guide you through your immigration process.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all">
                    <Link href="/courses">
                      Browse Courses
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-2 border-amber-400 text-amber-700 hover:bg-amber-50">
                    <Link href="/bundles">View Bundles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Stats Cards - Now 3 cards with better spacing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="group relative bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Courses</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{coursesCount}</span>
                    <span className="text-sm text-gray-500">enrolled</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Bundles</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{bundlesCount}</span>
                    <span className="text-sm text-gray-500">purchased</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-600/5" />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Active Items</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{activeEnrollments.length}</span>
                    <span className="text-sm text-gray-500">available</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Order History Section */}
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
            Order History
          </h2>
          {orderHistory.length > 0 ? (
            <OrderHistoryTable orders={orderHistory} />
          ) : (
            <Card className="relative bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 to-gray-200/20" />
              <CardContent className="relative p-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Purchase History Yet
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Your order history will appear here once you make your first purchase.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Loading Component
function MyPurchasesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-200 rounded-full animate-pulse" />
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <p className="text-gray-600 mt-6 font-medium">Loading your learning dashboard...</p>
      </div>
    </div>
  );
}

export default function MyPurchasesPage() {
  return (
    <Suspense fallback={<MyPurchasesLoading />}>
      <MyPurchasesContent />
    </Suspense>
  );
}
