// src/components/course-detail/PricingSidebar.tsx
"use client";

import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import type { CourseDetail } from "@/lib/data/course-details-data";

interface PricingSidebarProps {
  course: CourseDetail;
  selectedPriceKey: "price1" | "price2" | "price3";
  onPriceSelect: (key: "price1" | "price2" | "price3") => void;
}

export default function PricingSidebar({ 
  course, 
  selectedPriceKey, 
  onPriceSelect 
}: PricingSidebarProps) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const isInCart = cartItems.some(item => item.id === course.course_id);
  
  const pricingOptions = [
    { key: "price1" as const, ...course.pricing.price1, label: "3 months" },
    { key: "price2" as const, ...course.pricing.price2, label: "6 months" },
    { key: "price3" as const, ...course.pricing.price3, label: "12 months", popular: true },
  ];

  const selectedPrice = course.pricing[selectedPriceKey];
  
  const handleAddToCart = () => {
    if (isInCart) return;
    
    addItem({
      id: course.course_id,
      productId: course.course_id,
      type: "course",
      productType: course.type,
      title: course.title,
      price: selectedPrice.price,
      currency: "USD",
      comparedPrice: selectedPrice.compared_price,
      imageUrl: course.image_url,
      accessPeriodLabel: `${selectedPrice.validity_duration} ${selectedPrice.validity_type} access`,
      validityDuration: selectedPrice.validity_duration,
      validityType: selectedPrice.validity_type,
      category: course.category,
      pricingKey: selectedPriceKey,
      enrollId: course.enroll_id,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="overflow-hidden border-gray-200 shadow-lg">
      {/* Price Selection */}
      <div className="bg-gradient-to-b from-amber-50/30 to-white p-5">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Choose your plan</h3>
        
        <div className="space-y-2.5">
          {pricingOptions.map((option) => {
            const isSelected = option.key === selectedPriceKey;
            const discount = option.compared_price 
              ? Math.round(((option.compared_price - option.price) / option.compared_price) * 100)
              : 0;
            
            return (
              <button
                key={option.key}
                onClick={() => onPriceSelect(option.key)}
                className={`relative w-full rounded-lg border-2 p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-amber-500 bg-amber-50/50 shadow-md"
                    : "border-gray-200 bg-white hover:border-amber-300"
                }`}
              >
                {(option.key=='price2' )&& (
                  <Badge className="absolute -top-2 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5">
                    Popular
                  </Badge>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </span>
                      {discount > 0 && (
                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-xs px-1.5 py-0">
                          {discount}% off
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(option.price)}
                      </span>
                      {option.compared_price && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(option.compared_price)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected 
                      ? "border-amber-500 bg-amber-500" 
                      : "border-gray-300 bg-white"
                  }`}>
                    {isSelected && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Action Button */}
      <div className="border-t border-gray-100 p-5">
        <Button
          onClick={handleAddToCart}
          disabled={isInCart}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600 hover:shadow-lg transition-all"
          size="lg"
        >
          {isInCart ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
      
      {/* What's Included */}
      <div className="border-t border-gray-100 bg-gray-50/50 p-5">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">This course includes:</h4>
        <ul className="space-y-2.5">
          {course.includes.slice(0, 6).map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <span className="leading-snug">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}