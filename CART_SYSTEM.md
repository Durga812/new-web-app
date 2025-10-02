# Hybrid Cart System Implementation

## Overview

This project now implements a **Two-Tier Hybrid Cart System** that provides a seamless shopping experience for both guest and authenticated users. The cart automatically syncs when users sign in, merging their guest cart with their database-stored cart.

## Architecture

### Core Components

1. **Guest Cart Management** (`src/lib/guest-cart.ts`)
   - Handles localStorage operations for unauthenticated users
   - Uses Zod schema validation for data integrity
   - Provides CRUD operations for cart items

2. **Server Actions** (`src/app/actions/cart.ts`)
   - Server-side cart operations for authenticated users
   - Integrates with Supabase PostgreSQL database
   - Handles cart merging, adding, removing, and clearing items

3. **Cart Store** (`src/stores/cart-store.ts`)
   - Zustand store that acts as the single interface for cart operations
   - Automatically detects authentication status
   - Routes operations to either localStorage or database

4. **Cart Sync Hook** (`src/hooks/use-cart-sync.ts`)
   - Detects user sign-in events
   - Triggers automatic cart merge from localStorage to database
   - Provides user feedback via toast notifications

5. **Provider Components**
   - `CartSyncProvider`: Runs the cart sync logic on user sign-in
   - `CartAuthProvider`: Syncs authentication state with cart store

## Data Flow

### Guest User Flow
```
User adds item → Cart Store (isAuthenticated: false)
                 ↓
              guest-cart.ts
                 ↓
            localStorage
```

### Authenticated User Flow
```
User adds item → Cart Store (isAuthenticated: true)
                 ↓
           cart actions (server)
                 ↓
       Supabase PostgreSQL (cart_items table)
```

### Sign-In Flow
```
Guest user signs in → CartSyncProvider detects sign-in
                      ↓
                 mergeAndSyncCart server action
                      ↓
         Merge localStorage cart with database cart
                      ↓
              Clear localStorage cart
                      ↓
            Show success toast to user
```

## Database Schema

The `cart_items` table structure:

```sql
create table public.cart_items (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  clerk_user_id text not null,
  product_id text not null,
  product_type public.product_type not null,
  pricing_key text not null default 'price3',
  price numeric(10, 2) not null,
  validity_duration integer not null,
  validity_type text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint cart_items_pkey primary key (id),
  constraint cart_items_user_product_unique unique (user_id, product_id),
  constraint cart_items_clerk_user_id_fkey foreign key (clerk_user_id) 
    references users (clerk_user_id) on delete cascade,
  constraint cart_items_user_id_fkey foreign key (user_id) 
    references users (id) on delete cascade
)
```

## Usage Examples

### Adding Items to Cart

```typescript
import { useCartStore } from '@/stores/cart-store';

function ProductCard({ product }) {
  const addItem = useCartStore(state => state.addItem);
  
  const handleAddToCart = async () => {
    try {
      await addItem({
        id: product.id,
        productId: product.id,
        type: 'course',
        title: product.title,
        price: product.price,
        pricingKey: 'price3',
        validityDuration: 365,
        validityType: 'days',
        imageUrl: product.image,
      });
      
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };
  
  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

### Removing Items from Cart

```typescript
import { useCartStore } from '@/stores/cart-store';

function CartItem({ item }) {
  const removeItem = useCartStore(state => state.removeItem);
  
  const handleRemove = async () => {
    try {
      await removeItem(item.productId);
      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };
  
  return (
    <button onClick={handleRemove}>Remove</button>
  );
}
```

### Accessing Cart Items

```typescript
import { useCartStore } from '@/stores/cart-store';

function CartDisplay() {
  const items = useCartStore(state => state.items);
  const isLoading = useCartStore(state => state.isLoading);
  
  if (isLoading) {
    return <div>Loading cart...</div>;
  }
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          {item.title} - ${item.price}
        </div>
      ))}
    </div>
  );
}
```

### Loading Cart on Component Mount

```typescript
import { useEffect } from 'react';
import { useCartStore } from '@/stores/cart-store';

function CartPage() {
  const { items, loadCart } = useCartStore();
  
  useEffect(() => {
    loadCart();
  }, [loadCart]);
  
  return (
    <div>
      {/* Cart UI */}
    </div>
  );
}
```

## Key Features

### 1. Automatic Cart Syncing
When a guest user signs in, their localStorage cart is automatically merged with their database cart. Duplicate items are prevented using the `user_id, product_id` unique constraint.

### 2. Seamless User Experience
- Cart persists across browser tabs for guest users (localStorage)
- Cart persists across devices for authenticated users (database)
- No data loss during sign-in transition

### 3. Type Safety
- Full TypeScript support throughout the system
- Zod schema validation for localStorage data
- Type-safe server actions

### 4. Error Handling
- Graceful fallbacks for failed operations
- User-friendly error messages via toast notifications
- Console logging for debugging

### 5. Performance Optimization
- Local state updates for immediate UI feedback
- Server operations run in the background
- Cache revalidation after mutations

## Important Notes

### Cart Operations are Now Async

All cart mutation operations (`addItem`, `removeItem`, `clearCart`) are now **async functions** that return Promises. Make sure to:

1. Use `async/await` when calling these functions
2. Handle errors with try/catch blocks
3. Show loading states while operations are in progress

### Authentication Status

The cart store tracks authentication status via the `isAuthenticated` flag. This is automatically managed by the `CartAuthProvider` component. **Do not manually set this flag** unless you have a specific use case.

### Data Conversion

Items are automatically converted between `CartItem` (UI format) and `GuestCartItem` (storage format) by the cart store. You don't need to worry about this conversion in your components.

### Unique Constraint

The database has a unique constraint on `(user_id, product_id)`. This prevents duplicate items in a user's cart and ensures that the merge operation is idempotent.

## Migration Guide

If you have existing cart components, here's what you need to update:

### Before (Old Cart Store)
```typescript
// Synchronous operation
addItem(item);
removeItem(id);
clearCart();
```

### After (New Hybrid Cart Store)
```typescript
// Asynchronous operations with error handling
try {
  await addItem(item);
  toast.success('Added to cart!');
} catch (error) {
  toast.error('Failed to add item');
}

try {
  await removeItem(productId); // Note: uses productId now
} catch (error) {
  toast.error('Failed to remove item');
}

try {
  await clearCart();
} catch (error) {
  toast.error('Failed to clear cart');
}
```

### Key Changes
1. All mutation operations are now async
2. `removeItem` now takes `productId` instead of `id`
3. Need to handle errors appropriately
4. Should provide user feedback via toast notifications

## Testing

### Testing Guest Cart
1. Open the app without signing in
2. Add items to cart
3. Close and reopen the browser
4. Verify items persist in localStorage

### Testing Authenticated Cart
1. Sign in to the app
2. Add items to cart
3. Open the app on another device (or incognito window)
4. Sign in with the same account
5. Verify cart items are synced

### Testing Cart Merge
1. Add items to cart as a guest
2. Sign in
3. Verify the toast notification shows items added
4. Verify items from localStorage are now in the database
5. Verify localStorage cart is cleared

### Testing Duplicate Prevention
1. Add an item to cart as a guest
2. Sign in and add the same item to your database cart
3. Sign out and add the same item again as guest
4. Sign in again
5. Verify only one instance of the item exists in the cart

## Troubleshooting

### Cart not loading on sign-in
- Check if `CartAuthProvider` is included in the layout
- Verify Supabase environment variables are set correctly
- Check browser console for errors

### Cart items not persisting
- For guests: Check browser localStorage is enabled
- For authenticated users: Verify database connection
- Check if the `users` table has the correct `clerk_user_id`

### Merge not working
- Ensure `CartSyncProvider` is included in the layout
- Verify the `mergeAndSyncCart` server action has proper permissions
- Check that the `cart_items` table exists and has the correct schema

### TypeScript errors
- Make sure all new dependencies are installed: `bun install`
- Ensure `zod` is installed (required for validation)
- Verify the `CartItem` type includes all necessary fields

## Future Enhancements

Potential improvements to consider:

1. **Optimistic Updates**: Update UI immediately before server confirmation
2. **Offline Support**: Queue cart operations when offline
3. **Cart Item Quantities**: Add support for multiple quantities of the same item
4. **Cart Expiration**: Auto-clear old cart items after X days
5. **Cart Analytics**: Track cart abandonment and conversion rates
6. **Wishlist Integration**: Separate wishlist functionality
7. **Price Change Notifications**: Alert users if cart item prices change

## Support

For issues or questions:
1. Check the browser console for detailed error logs
2. Verify all environment variables are set correctly
3. Ensure database migrations are up to date
4. Review the Clerk authentication setup
