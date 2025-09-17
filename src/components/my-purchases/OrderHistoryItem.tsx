// src/components/my-purchases/OrderHistoryTable.tsx
'use client';

import React from 'react';
import { CheckCircle2, XCircle, Calendar, DollarSign, Hash } from 'lucide-react';
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const isSuccess = status.toLowerCase() === 'success';
    return (
      <Badge className={`text-xs font-medium ${
        isSuccess 
          ? 'bg-green-100 text-green-700 border-green-200' 
          : 'bg-red-100 text-red-700 border-red-200'
      }`}>
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
    <div className="bg-white backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <tr>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Hash className="w-3 h-3" />
                  Transaction ID
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  Date & Time
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <DollarSign className="w-3 h-3" />
                  Amount
                </div>
              </th>
              <th className="px-6 py-4 text-left">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order, index) => (
              <tr 
                key={order.id} 
                className={`hover:bg-amber-50/30 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded w-fit">
                      {(order.payment_intent_id || order.id).slice(0, 20)}...
                    </code>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(order.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatAmount(order.total_amount, order.currency)}
                    </span>
                    {order.total_amount >= 10000 && (
                      <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                        Premium
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(order.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Total Orders:</span> {orders.length}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Successful:</span>{' '}
              <span className="text-green-700 font-semibold">
                {orders.filter(o => o.status.toLowerCase() === 'success').length}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Failed:</span>{' '}
              <span className="text-red-700 font-semibold">
                {orders.filter(o => o.status.toLowerCase() !== 'success').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}