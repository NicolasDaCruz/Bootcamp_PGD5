import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  createStockReservation,
  releaseStockReservation,
  extendStockReservation,
  getActiveReservations,
  validateReservation,
  confirmReservation,
  cleanupExpiredReservations,
  getCurrentUserId,
  generateSessionId
} from '../../../../../lib/cart-utils';

// GET /api/stock/reservations - Get all active reservations for user/session
export async function GET(request: NextRequest) {
  try {
    const reservations = await getActiveReservations();

    return NextResponse.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reservations'
      },
      { status: 500 }
    );
  }
}

// POST /api/stock/reservations - Create new stock reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, quantity, name, brand, price, image, size, color, maxStock, expirationMinutes = 15 } = body;

    // Validate required fields
    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product ID and valid quantity are required'
        },
        { status: 400 }
      );
    }

    // Create cart item object for reservation
    const cartItem = {
      productId,
      variantId,
      quantity,
      name: name || 'Unknown Product',
      brand: brand || 'Unknown Brand',
      price: price || 0,
      image: image || '/api/placeholder/400/400',
      size: size || 'Default',
      color: color || 'Default',
      maxStock: maxStock || 0
    };

    const reservationId = await createStockReservation(cartItem, expirationMinutes);

    if (!reservationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to create reservation - insufficient stock or system error'
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        reservationId,
        expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create reservation'
      },
      { status: 500 }
    );
  }
}

// PUT /api/stock/reservations - Extend or modify existing reservation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationId, action, additionalMinutes = 15, orderId } = body;

    if (!reservationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reservation ID is required'
        },
        { status: 400 }
      );
    }

    switch (action) {
      case 'extend':
        const extended = await extendStockReservation(reservationId, additionalMinutes);
        if (!extended) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to extend reservation'
            },
            { status: 409 }
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            reservationId,
            newExpiresAt: new Date(Date.now() + additionalMinutes * 60 * 1000).toISOString()
          }
        });

      case 'confirm':
        const confirmed = await confirmReservation(reservationId, orderId);
        if (!confirmed) {
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to confirm reservation'
            },
            { status: 409 }
          );
        }
        return NextResponse.json({
          success: true,
          data: {
            reservationId,
            status: 'confirmed'
          }
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use "extend" or "confirm"'
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update reservation'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/stock/reservations - Release/cancel reservation
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const reservationId = url.searchParams.get('id');

    if (!reservationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reservation ID is required'
        },
        { status: 400 }
      );
    }

    await releaseStockReservation(reservationId);

    return NextResponse.json({
      success: true,
      data: {
        reservationId,
        status: 'cancelled'
      }
    });

  } catch (error) {
    console.error('Error releasing reservation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to release reservation'
      },
      { status: 500 }
    );
  }
}