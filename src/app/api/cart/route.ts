import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase/server';

// GET - Fetch user's cart
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('is_active', true);

  if (error) {
    return new NextResponse('Error fetching cart', { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST - Add item to cart
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const item = await request.json();

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      clerk_user_id: userId,
      product_type: item.product_type,
      product_id: item.product_id,
      product_slug: item.product_slug,
      variant_code: item.variant_code,
      product_enroll_id: item.product_enroll_id,
      original_price: item.original_price,
      price: item.price,
      currency: item.currency,
      cart_metadata: {
        title: item.title,
        thumbnail_url: item.thumbnail_url,
      },
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return new NextResponse('Item already in cart', { status: 409 });
    }
    return new NextResponse('Error adding to cart', { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE - Remove item from cart
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { productId } = await request.json();

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .match({ 
      clerk_user_id: userId, 
      product_id: productId 
    });

  if (error) {
    return new NextResponse('Error removing from cart', { status: 500 });
  }

  return NextResponse.json({ success: true });
}