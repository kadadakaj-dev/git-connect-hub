export interface LocalizedBookingErrors {
  fullyBooked: string;
  occupied: string;
}

export function mapBookingErrorMessage(
  message: string,
  localizedErrors: LocalizedBookingErrors,
) {
  switch (message) {
    case 'This time slot is fully booked':
      return localizedErrors.fullyBooked;
    case 'Time slot already booked':
    case 'This time slot is occupied':
      return localizedErrors.occupied;
    default:
      return message;
  }
}