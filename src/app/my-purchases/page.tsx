// src/app/my-purchases/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Package, 
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnrollmentCard } from '@/components/my-purchases/EnrollmentCard';
import { BillingPortalButton } from '@/components/my-purchases/BillingButton';
import { OrderHistoryTable } from '@/components/my-purchases/OrderHistoryItem';
import { getMyEnrollments, getMyOrderHistory } from '@/app/actions/my-purchases';

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
  const totalSpent = orderHistory
    .filter(order => order.status.toLowerCase() === 'success')
    .reduce((sum, order) => sum + order.total_amount, 0) / 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-2">
            My Purchases
          </h1>
          <p className="text-gray-600">
            Access your courses and track your learning progress
          </p>
        </div>

        {/* Compact Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{coursesCount}</div>
                <div className="text-xs text-gray-600">Courses</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{bundlesCount}</div>
                <div className="text-xs text-gray-600">Bundles</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{activeEnrollments.length}</div>
                <div className="text-xs text-gray-600">Active</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">${totalSpent.toFixed(0)}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Enrollments Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Enrollments</h2>
              <p className="text-sm text-gray-600 mt-1">
                {activeEnrollments.length} active, {expiredEnrollments.length} expired
              </p>
            </div>
            <BillingPortalButton />
          </div>

          {enrollments.length > 0 ? (
            <>
              {/* Active Enrollments */}
              {activeEnrollments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Active ({activeEnrollments.length})
                    </Badge>
                  </h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {activeEnrollments.map((enrollment) => (
                      <EnrollmentCard 
                        key={enrollment.id} 
                        enrollment={enrollment} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Expired Enrollments */}
              {expiredEnrollments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                      Expired ({expiredEnrollments.length})
                    </Badge>
                  </h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {expiredEnrollments.map((enrollment) => (
                      <EnrollmentCard 
                        key={enrollment.id} 
                        enrollment={enrollment} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Enrollments Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start your immigration journey today.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                  <Button asChild variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                    <Link href="/bundles">View Bundles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order History Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
          {orderHistory.length > 0 ? (
            <OrderHistoryTable orders={orderHistory} />
          ) : (
            <Card className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200">
              <CardContent className="p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Orders Yet
                </h3>
                <p className="text-gray-600">
                  Your purchase history will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple Loading Component
function MyPurchasesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your purchases...</p>
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
