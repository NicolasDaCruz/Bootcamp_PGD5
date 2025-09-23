import { NextRequest, NextResponse } from 'next/server';
import { validateReservation } from '../../../../../../lib/cart-utils';

// POST /api/stock/reservations/validate - Validate one or more reservations
export async function POST(request: NextRequest) {
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

    const validationResults = await Promise.all(
      reservationIds.map(async (id: string) => {
        const result = await validateReservation(id);
        return {
          reservationId: id,
          ...result
        };
      })
    );

    const allValid = validationResults.every(result => result.valid);
    const invalidReservations = validationResults.filter(result => !result.valid);

    return NextResponse.json({
      success: true,
      data: {
        allValid,
        validationResults,
        invalidCount: invalidReservations.length,
        invalidReservations
      }
    });

  } catch (error) {
    console.error('Error validating reservations:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate reservations'
      },
      { status: 500 }
    );
  }
}

// GET /api/stock/reservations/validate?id=reservationId - Validate single reservation
export async function GET(request: NextRequest) {
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

    const validation = await validateReservation(reservationId);

    return NextResponse.json({
      success: true,
      data: {
        reservationId,
        ...validation
      }
    });

  } catch (error) {
    console.error('Error validating reservation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate reservation'
      },
      { status: 500 }
    );
  }
}