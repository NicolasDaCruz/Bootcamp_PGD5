import { NextRequest, NextResponse } from 'next/server';
import {
  createStockReservation,
  releaseStockReservation,
  validateReservation,
  confirmReservation
} from '../../../../../../lib/cart-utils';

// POST /api/stock/reservations/bulk - Create multiple reservations (for full cart)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartItems, expirationMinutes = 15, releaseExisting = true } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cart items array is required'
        },
        { status: 400 }
      );
    }

    // Release existing reservations if requested
    if (releaseExisting && body.existingReservations) {
      for (const reservationId of body.existingReservations) {
        try {
          await releaseStockReservation(reservationId);
        } catch (error) {
          console.warn(`Failed to release reservation ${reservationId}:`, error);
        }
      }
    }

    const results = [];
    const failures = [];

    // Try to create reservations for each cart item
    for (const item of cartItems) {
      try {
        const reservationId = await createStockReservation(item, expirationMinutes);

        if (reservationId) {
          results.push({
            cartItemId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            reservationId,
            expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString(),
            success: true
          });
        } else {
          failures.push({
            cartItemId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            error: 'Insufficient stock or system error',
            success: false
          });
        }
      } catch (error) {
        failures.push({
          cartItemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    const allSuccessful = failures.length === 0;

    return NextResponse.json({
      success: allSuccessful,
      data: {
        reservations: results,
        failures,
        totalItems: cartItems.length,
        successfulReservations: results.length,
        failedReservations: failures.length,
        allReserved: allSuccessful
      }
    }, { status: allSuccessful ? 200 : 207 }); // 207 Multi-Status for partial success

  } catch (error) {
    console.error('Error creating bulk reservations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create bulk reservations'
      },
      { status: 500 }
    );
  }
}

// PUT /api/stock/reservations/bulk - Confirm multiple reservations (during checkout)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationIds, orderId, action = 'confirm' } = body;

    if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reservation IDs array is required'
        },
        { status: 400 }
      );
    }

    if (action === 'confirm' && !orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID is required for confirmation'
        },
        { status: 400 }
      );
    }

    const results = [];
    const failures = [];

    // Validate all reservations first
    for (const reservationId of reservationIds) {
      try {
        const validation = await validateReservation(reservationId);
        if (!validation.valid) {
          failures.push({
            reservationId,
            error: validation.reason || 'Validation failed',
            success: false
          });
        }
      } catch (error) {
        failures.push({
          reservationId,
          error: error instanceof Error ? error.message : 'Validation error',
          success: false
        });
      }
    }

    // If any validations failed, don't proceed
    if (failures.length > 0) {
      return NextResponse.json({
        success: false,
        data: {
          results: [],
          failures,
          totalReservations: reservationIds.length,
          successfulOperations: 0,
          failedOperations: failures.length
        },
        error: 'Some reservations failed validation'
      }, { status: 409 });
    }

    // All validations passed, proceed with action
    for (const reservationId of reservationIds) {
      try {
        if (action === 'confirm') {
          const confirmed = await confirmReservation(reservationId, orderId);
          if (confirmed) {
            results.push({
              reservationId,
              action: 'confirmed',
              orderId,
              success: true
            });
          } else {
            failures.push({
              reservationId,
              error: 'Failed to confirm reservation',
              success: false
            });
          }
        } else if (action === 'release') {
          await releaseStockReservation(reservationId);
          results.push({
            reservationId,
            action: 'released',
            success: true
          });
        }
      } catch (error) {
        failures.push({
          reservationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    const allSuccessful = failures.length === 0;

    return NextResponse.json({
      success: allSuccessful,
      data: {
        results,
        failures,
        totalReservations: reservationIds.length,
        successfulOperations: results.length,
        failedOperations: failures.length,
        allProcessed: allSuccessful
      }
    }, { status: allSuccessful ? 200 : 207 });

  } catch (error) {
    console.error('Error processing bulk reservations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process bulk reservations'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/stock/reservations/bulk - Release multiple reservations
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { reservationIds } = body;

    if (!reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reservation IDs array is required'
        },
        { status: 400 }
      );
    }

    const results = [];
    const failures = [];

    for (const reservationId of reservationIds) {
      try {
        await releaseStockReservation(reservationId);
        results.push({
          reservationId,
          action: 'released',
          success: true
        });
      } catch (error) {
        failures.push({
          reservationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    const allSuccessful = failures.length === 0;

    return NextResponse.json({
      success: allSuccessful,
      data: {
        results,
        failures,
        totalReservations: reservationIds.length,
        successfulReleases: results.length,
        failedReleases: failures.length,
        allReleased: allSuccessful
      }
    }, { status: allSuccessful ? 200 : 207 });

  } catch (error) {
    console.error('Error releasing bulk reservations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to release bulk reservations'
      },
      { status: 500 }
    );
  }
}