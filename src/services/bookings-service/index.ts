import bookingRepository from "@/repositories/booking-repository";
import { notFoundError, invalidTicketTypeError, unauthorizedError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import roomRepository from "@/repositories/rooms-repository";

async function checkIfUserCanMakeABooking(userId: number) {
  //Tem enrollment?
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }
  //Tem ticket pago isOnline false e includesHotel true
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw invalidTicketTypeError();
  }
}

async function fetchBookings(userId: number) {
  const bookings = await bookingRepository.findBookings(userId);
  if (!bookings) {
    throw notFoundError();
  }

  const booking = {
    "id": bookings.id,
    "Room": bookings.Room
  };

  return booking;
}

async function isRoomAvailable(roomId: number) {
  const isAvailable = await roomRepository.findRoomById(roomId);

  if(!isAvailable || isAvailable.capacity === isAvailable.Booking.length) {
    throw unauthorizedError();
  }
}

async function createBooking(userId: number, roomId: number) {
  await checkIfUserCanMakeABooking(userId);

  await isRoomAvailable(roomId);

  const newBooking = await bookingRepository.insertBooking(userId, roomId);

  const sendBooking = {
    bookingId: newBooking.id,
    Room: newBooking.Room
  };

  return sendBooking;
}

async function changeBooking(userId: number, bookingId: number, roomId: number) {
  const userHasBooking = await bookingRepository.findBookings(userId);

  if(!userHasBooking) {
    throw notFoundError();
  }

  await isRoomAvailable(roomId);

  const bookings = await bookingRepository.updateBooking(bookingId, roomId);

  const booking = {
    "bookingId": bookings.id,
    "Room": bookings.Room
  };

  return booking;
}

const bookingService = {
  fetchBookings,
  createBooking,
  changeBooking
};

export default bookingService;
