// src/components/my-purchases/OrderHistoryTable.tsx
'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OrderHistoryItem } from '@/lib/types/my-purchases';

interface OrderHistoryTableProps {
  orders: OrderHistoryItem[];
}

export function OrderHistoryTable({ orders }: OrderHistoryTableProps) {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const isSuccess = status.toLowerCase() === 'success';
    return (
      <Badge className={`text-xs ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {isSuccess ? (
          <>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Success
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </>
        )}
      </Badge>
    );
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm">
                  <code className="text-xs text-gray-600">
                    {order.payment_intent_id || order.id}
                  </code>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDate(order.created_at)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  {formatAmount(order.total_amount, order.currency)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(order.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}