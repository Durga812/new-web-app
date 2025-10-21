"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, Receipt, RefreshCw, CircleCheck, Clock, AlertTriangle, Package, BookOpen } from "lucide-react";
import type { OrderRecord, PurchasedOrderItem } from "@/types/order";
import type { RefundItem } from "@/types/refund";

type OrderWithRelations = OrderRecord & {
  purchased_items: PurchasedOrderItem[];
  refunded_items: RefundItem[] | null;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "numeric",
});

const statusConfig: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  completed: {
    label: "Completed",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: <CircleCheck className="h-3.5 w-3.5" />,
  },
  partially_refunded: {
    label: "Partially Refunded",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: <RefreshCw className="h-3.5 w-3.5" />,
  },
  refunded: {
    label: "Refunded",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Pending",
    badgeClass: "bg-gray-100 text-gray-600 border border-gray-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
};

type OrdersSummary = {
  totalOrders: number;
  totalSpent: number;
  totalRefunded: number;
  coursesPurchased: number;
  bundlesPurchased: number;
  currentRefunds: number;
};

const computeSummary = (orders: OrderWithRelations[]): OrdersSummary => {
  return orders.reduce<OrdersSummary>(
    (acc, order) => {
      acc.totalOrders += 1;
      acc.totalSpent += Number(order.total_amount || 0);
      acc.totalRefunded += Number(order.refund_amount || 0);

      const items = Array.isArray(order.purchased_items)
        ? order.purchased_items
        : [];

      for (const item of items) {
        if (item.product_type === "course") {
          acc.coursesPurchased += 1;
        } else if (item.product_type === "bundle") {
          acc.bundlesPurchased += 1;
        }
      }

      if (order.payment_status === "partially_refunded") {
        acc.currentRefunds += 1;
      }

      if (order.payment_status === "refunded") {
        acc.currentRefunds += 1;
      }

      return acc;
    },
    {
      totalOrders: 0,
      totalSpent: 0,
      totalRefunded: 0,
      coursesPurchased: 0,
      bundlesPurchased: 0,
      currentRefunds: 0,
    }
  );
};

export default function MyOrdersClient({
  orders,
}: {
  orders: OrderWithRelations[];
}) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const summary = useMemo(() => computeSummary(orders), [orders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 pb-16">
      <div className="pt-[var(--nav-offset,4rem)]" />
      <section className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
              Account
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900 md:text-4xl">
              Purchase History
            </h1>
            <p className="mt-2 text-sm text-gray-600 md:text-base">
              Keep track of your course and bundle purchases, download receipts,
              and review refund updates in one place
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <Badge className="rounded-full bg-white px-4 py-1 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-amber-200">
              {summary.totalOrders} orders
            </Badge>
          </div>
        </header>

        <div className="mt-10 space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isExpanded={expandedOrderId === order.id}
              onToggle={() =>
                setExpandedOrderId((prev) => (prev === order.id ? null : order.id))
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function OrderCard({
  order,
  isExpanded,
  onToggle,
}: {
  order: OrderWithRelations;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const paidDate = order.paid_at ? new Date(order.paid_at) : null;
  const status =
    statusConfig[order.payment_status] ?? statusConfig["completed"];
  const purchasedItems = Array.isArray(order.purchased_items)
    ? order.purchased_items
    : [];
  const refundedItems = Array.isArray(order.refunded_items)
    ? order.refunded_items
    : [];
  const itemsCount = purchasedItems.length;

  return (
    <Card className="overflow-hidden border border-amber-100 bg-white/90 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 border-b border-amber-100 bg-gradient-to-r from-white via-amber-50/60 to-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-inner">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Order #{order.order_number || "—"}
              </h2>
              <Badge className={status.badgeClass + " flex items-center gap-1"}>
                {status.icon}
                <span>{status.label}</span>
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {itemsCount} item{itemsCount === 1 ? "" : "s"} ·{" "}
              {currencyFormatter.format(Number(order.total_amount || 0))}
            </p>
            {paidDate && (
              <p className="mt-0.5 text-xs text-gray-500">
                Placed on {dateFormatter.format(paidDate)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {refundedItems.length > 0 && (
            <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
              {refundedItems.length} refund
              {refundedItems.length === 1 ? "" : "s"}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className="flex items-center gap-1.5 rounded-full border-amber-200 text-sm font-semibold text-amber-700 hover:bg-amber-50"
          >
            <span>{isExpanded ? "Hide details" : "View details"}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-amber-100 bg-white/70">
          <div className="grid gap-6 px-6 py-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <SectionHeader
                title="Items"
                subtitle="Courses and bundles included in this order."
              />
              <div className="mt-4 space-y-4">
                {purchasedItems.map((item) => (
                  <PurchasedItemCard
                    key={item.enroll_id || item.product_id}
                    item={item}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                <SectionHeader
                  title="Payment summary"
                  subtitle="Totals and refund activity for this order."
                />
                <dl className="mt-4 space-y-2 text-sm text-gray-700">
                  <SummaryRow
                    label="Subtotal"
                    value={currencyFormatter.format(Number(order.subtotal || 0))}
                  />
                  <SummaryRow
                    label="Discount"
                    value={
                      order.discount
                        ? `−${currencyFormatter.format(Number(order.discount))}`
                        : currencyFormatter.format(0)
                    }
                  />
                  <SummaryRow
                    label="Total charged"
                    value={currencyFormatter.format(Number(order.total_amount || 0))}
                  />
                  {order.discount_tier_name && (
                    <SummaryRow
                      label="Discount tier"
                      value={order.discount_tier_name}
                    />
                  )}
                  {order.refund_amount ? (
                    <SummaryRow
                      label="Refunded"
                      value={currencyFormatter.format(Number(order.refund_amount))}
                      emphasis="text-rose-600"
                    />
                  ) : null}
                </dl>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
                <SectionHeader
                  title="Billing details"
                  subtitle="Stored information for this order."
                />
                <dl className="mt-4 space-y-2 text-sm text-gray-700">
                  {order.customer_name && (
                    <SummaryRow label="Name" value={order.customer_name} />
                  )}
                  <SummaryRow label="Email" value={order.customer_email} />
                  {order.country && (
                    <SummaryRow label="Country" value={order.country} />
                  )}
                  <SummaryRow
                    label="Payment intent"
                    value={order.stripe_payment_intent_id}
                  />
                </dl>
              </div>
            </div>

            <div className="md:col-span-3">
              <RefundTimeline refunds={refundedItems} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
        {title}
      </h3>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

function PurchasedItemCard({ item }: { item: PurchasedOrderItem }) {
  const isCourse = item.product_type === "course";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isCourse ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"}`}>
          {isCourse ? (
            <BookOpen className="h-5 w-5" />
          ) : (
            <Package className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {item.title}
          </p>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {isCourse ? "Course" : item.product_type}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {item.validity_duration && item.validity_type && (
              <span>
                Access: {item.validity_duration} {item.validity_type}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start sm:items-end">
        <span className="text-sm font-semibold text-gray-900">
          {currencyFormatter.format(Number(item.price || 0))}
        </span>
        <span className="text-xs text-gray-500">
          {item.lw_product_type?.replace(/_/g, " ") || ""}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className={`text-sm font-semibold text-right text-gray-800 ${emphasis ?? ""}`}>
        {value}
      </dd>
    </div>
  );
}

function RefundTimeline({ refunds }: { refunds: RefundItem[] }) {
  if (!refunds.length) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white/60 px-6 py-5 text-sm text-gray-500 shadow-sm">
        No refunds have been processed for this order.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/70 px-6 py-5 shadow-sm">
      <SectionHeader
        title="Refund activity"
        subtitle="Items refunded from this order and their status."
      />
      <div className="mt-4 space-y-4">
        {refunds.map((refund) => {
          const refundedAt = refund.refunded_at
            ? new Date(refund.refunded_at)
            : null;
          return (
            <div
              key={`${refund.enrollment_id}-${refund.refunded_at}`}
              className="flex flex-col gap-2 rounded-xl border border-rose-100 bg-white/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {refund.product_title}
                </p>
                <p className="text-xs text-gray-500">
                  Refund amount:{" "}
                  <span className="font-medium text-rose-600">
                    {currencyFormatter.format(Number(refund.refund_amount || 0))}
                  </span>
                </p>
                {refundedAt && (
                  <p className="text-xs text-gray-400">
                    Refunded on {dateFormatter.format(refundedAt)}
                  </p>
                )}
              </div>
              {refund.enrollment_id && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                  Enrollment #{refund.enrollment_id}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
