// =====================================================
// src/components/layout/CartDrawer.tsx
// =====================================================
"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ShoppingCart, Trash2, ArrowRight, Loader2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useCartStore } from '@/lib/stores/useCartStore'
import { useAuth, useClerk } from '@clerk/nextjs'
import { useEnrollmentStore } from '@/lib/stores/useEnrollmentStore'
import { createStripeSession } from '@/app/actions/stripe_session'
import { OwnedItemsDialog, OwnedItemSummary } from '@/components/dialogs/OwnedItemsDialog'
import type { CourseChild } from '@/lib/types/my-purchases'
import { getBundleIncludedCourses } from '@/app/actions/bundles'
import type { CartItem } from '@/lib/stores/useCartStore'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, getItemCount, getTotalPrice, getDiscountTier } = useCartStore()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const hasEnrollment = useEnrollmentStore(state => state.hasEnrollment)
  const enrollments = useEnrollmentStore(state => state.enrollments)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutLabel, setCheckoutLabel] = useState('Proceed to Checkout')
  const [ownedDialogOpen, setOwnedDialogOpen] = useState(false)
  const [ownedItems, setOwnedItems] = useState<OwnedItemSummary[]>([])
  const [ownedReturnPath, setOwnedReturnPath] = useState<string | null>(null)
  const [isRemovingOwned, setIsRemovingOwned] = useState(false)

  const itemCount = getItemCount()
  const isEmpty = itemCount === 0
  const discountTier = getDiscountTier()
  const courseCount = items.filter(i => i.product_type === 'course').length
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const totalPrice = getTotalPrice()

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const formatPrice = (price: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
  }

  const handleCheckout = async () => {
    if (isEmpty || isCheckingOut) return

    // 1) Ensure sign-in
    if (!isSignedIn) {
      try {
        openSignIn()
      } catch {
        router.push('/sign-in')
      }
      return
    }

    setIsCheckingOut(true)
    setCheckoutLabel('Validating cart...')

    // 2) Prevent duplicates against active enrollments
    const duplicates = items.filter(i => hasEnrollment(i.product_id, i.product_enroll_id))
    if (duplicates.length > 0) {
      const duplicateSummaries: OwnedItemSummary[] = duplicates.map((item) => {
        const matchingEnrollment = enrollments.find((enrollment) => {
          if (enrollment.item_id !== item.product_id) return false
          if (!item.product_enroll_id) return true
          return enrollment.item_enroll_id === item.product_enroll_id
        })

        return {
          id: item.product_id,
          title: item.title,
          type: item.product_type,
          slug: item.product_slug,
          thumbnailUrl: item.thumbnail_url,
          variantLabel: item.variant_label ?? (matchingEnrollment ? 'Existing access plan' : null),
          note: matchingEnrollment
            ? `This ${matchingEnrollment.item_type === 'bundle' ? 'bundle' : 'course'} is already in your purchases.`
            : `This ${item.product_type === 'bundle' ? 'bundle' : 'course'} is already in your purchases.`,
        }
      })

      const firstDuplicate = duplicates[0]
      let returnPath: string | null = null
      if (firstDuplicate.product_type === 'course') {
        if (firstDuplicate.category_slug) {
          returnPath = `/courses/${firstDuplicate.category_slug}/individual-courses`
        } else if (firstDuplicate.product_slug) {
          returnPath = `/course/${firstDuplicate.product_slug}`
        }
      } else if (firstDuplicate.product_type === 'bundle' && firstDuplicate.product_slug) {
        returnPath = `/bundle/${firstDuplicate.product_slug}`
      }

      setOwnedItems(duplicateSummaries)
      setOwnedReturnPath(returnPath)
      setOwnedDialogOpen(true)
      setIsCheckingOut(false)
      setCheckoutLabel('Proceed to Checkout')
      return
    }

    // 3) Create Stripe session (server validates prices, applies discount)
    try {
      setCheckoutLabel('Creating checkout...')
      const intentId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : String(Date.now())
      await createStripeSession(useCartStore.getState().items, intentId)
      // Server redirects. If it returns, something prevented redirect.
      setIsCheckingOut(false)
      setCheckoutLabel('Proceed to Checkout')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.'
      console.error('Checkout failed:', err)
      alert(message)
      setIsCheckingOut(false)
      setCheckoutLabel('Proceed to Checkout')
    }
  }

  const handleOwnedDialogCancel = () => {
    setOwnedDialogOpen(false)
    setOwnedItems([])
    setOwnedReturnPath(null)
    setIsCheckingOut(false)
    setCheckoutLabel('Proceed to Checkout')
  }

  const handleOwnedDialogConfirm = async () => {
    if (ownedItems.length === 0) {
      handleOwnedDialogCancel()
      return
    }

    setIsRemovingOwned(true)
    try {
      for (const item of ownedItems) {
        await removeItem(item.id)
      }
      setOwnedDialogOpen(false)
      setOwnedItems([])
      setIsCheckingOut(false)
      setCheckoutLabel('Proceed to Checkout')
      const target = ownedReturnPath
      setOwnedReturnPath(null)
      onClose()
      if (target) {
        router.push(target)
      }
    } finally {
      setIsRemovingOwned(false)
    }
  }

  if (!isOpen && !ownedDialogOpen) return null

  const drawerZIndexClass = ownedDialogOpen ? 'z-[40]' : 'z-[60]'

  return (
    <>
      <OwnedItemsDialog
        open={ownedDialogOpen}
        items={ownedItems}
        onCancel={handleOwnedDialogCancel}
        onConfirm={handleOwnedDialogConfirm}
        isConfirming={isRemovingOwned}
        confirmLabel="Remove and return"
        cancelLabel="Keep in cart"
        description="Confirm removal to revisit the item page before starting checkout again."
      />
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200 ${drawerZIndexClass}`}
            onClick={onClose}
          />

          {/* Drawer */}
          <div
            className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ${drawerZIndexClass}`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
                  {itemCount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-amber-100 rounded-full"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Empty State */}
            {isEmpty ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Your cart is empty</h3>
                <p className="text-gray-600 mt-1">Add some courses or bundles to get started.</p>
                <div className="mt-6">
                  <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {items.map((item) => (
                    <CartDrawerItem
                      key={item.product_id}
                      item={item}
                      onRemove={removeItem}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>

                {/* Summary & Actions */}
                <div className="border-t border-amber-200 bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-6">
                  {/* Discount Info */}
                  {discountTier && (
                    <div className="mb-4 p-3 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">🎉 {discountTier.discount}% Discount Applied!</p>
                      <p className="text-xs text-green-600">
                        You have {courseCount} courses (minimum {discountTier.minCourses} needed)
                      </p>
                    </div>
                  )}

                  {/* Price Summary */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {discountTier && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Discount ({discountTier.discount}%):</span>
                        <span>-{formatPrice(subtotal - totalPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                    >
                      {checkoutLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={onClose}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

interface CartDrawerItemProps {
  item: CartItem
  onRemove: (productId: string) => Promise<void>
  formatPrice: (price: number, currency?: string) => string
}

function CartDrawerItem({ item, onRemove, formatPrice }: CartDrawerItemProps) {
  const [showIncludedCourses, setShowIncludedCourses] = useState(false)
  const [loadingIncludedCourses, setLoadingIncludedCourses] = useState(false)
  const [includedCourses, setIncludedCourses] = useState<CourseChild[]>([])
  const [includedError, setIncludedError] = useState<string | null>(null)

  const isBundle = item.product_type === 'bundle'

  const toggleIncludedCourses = async () => {
    if (!isBundle) return

    if (!showIncludedCourses) {
      setShowIncludedCourses(true)

      if (includedCourses.length === 0) {
        setLoadingIncludedCourses(true)
        setIncludedError(null)
        try {
          const courses = await getBundleIncludedCourses(item.product_id)
          setIncludedCourses(courses)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load included courses.'
          if (message.toLowerCase().includes('unauthorized')) {
            setIncludedError('Sign in to view the courses included in this bundle.')
          } else {
            setIncludedError('Failed to load included courses. Please try again.')
          }
        } finally {
          setLoadingIncludedCourses(false)
        }
      }
      return
    }

    setShowIncludedCourses(false)
  }

  return (
    <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-xl p-4 hover:from-amber-50 hover:to-orange-50 transition-colors duration-200">
      <div className="flex items-start space-x-4">
        {item.thumbnail_url && (
          <img
            src={item.thumbnail_url}
            alt={item.title}
            className="w-20 h-20 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{item.title}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">
              {isBundle ? 'Bundle' : 'Course'}
            </Badge>
          </div>
          {item.variant_label && (
            <p className="text-xs text-gray-500 mt-1">
              {item.variant_label}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div>
              {item.original_price && item.price < item.original_price && (
                <span className="text-sm text-gray-400 line-through mr-2">
                  {formatPrice(item.original_price, item.currency)}
                </span>
              )}
              <span className="text-lg font-bold text-amber-600">
                {formatPrice(item.price, item.currency)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onRemove(item.product_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {isBundle && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={toggleIncludedCourses}
              >
                {loadingIncludedCourses ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : showIncludedCourses ? (
                  <span className="flex items-center gap-2">
                    <ChevronUp className="w-4 h-4" />
                    Hide included courses
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ChevronDown className="w-4 h-4" />
                    View included courses
                  </span>
                )}
              </Button>

              {showIncludedCourses && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-white/70 p-3">
                  {loadingIncludedCourses ? (
                    <div className="flex justify-center py-2">
                      <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    </div>
                  ) : includedError ? (
                    <p className="text-sm text-red-600">{includedError}</p>
                  ) : includedCourses.length === 0 ? (
                    <p className="text-sm text-gray-600">No courses found for this bundle yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {includedCourses.map((course, index) => (
                        <li
                          key={course.course_id}
                          className="flex items-center justify-between text-sm text-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-amber-600">{index + 1}.</span>
                            <span className="truncate max-w-[11rem] sm:max-w-[14rem]">
                              {course.title}
                            </span>
                          </span>
                          {course.course_slug && (
                            <Link
                              href={`/course/${course.course_slug}`}
                              className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                              onClick={(event) => event.stopPropagation()}
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
