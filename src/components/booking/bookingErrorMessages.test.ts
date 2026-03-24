import { describe, expect, it } from 'vitest';
import { mapBookingErrorMessage } from './bookingErrorMessages';

describe('mapBookingErrorMessage', () => {
  const localizedErrors = {
    fullyBooked: 'Tento termín je už plne obsadený. Vyberte si, prosím, iný čas.',
    occupied: 'Tento termín je už obsadený. Vyberte si, prosím, iný čas.',
  };

  it('maps fully booked backend message to Slovak copy', () => {
    expect(mapBookingErrorMessage('This time slot is fully booked', localizedErrors)).toBe(
      'Tento termín je už plne obsadený. Vyberte si, prosím, iný čas.',
    );
  });

  it('preserves unknown messages', () => {
    expect(mapBookingErrorMessage('Unexpected backend error', localizedErrors)).toBe('Unexpected backend error');
  });
});