import { prisma } from "@/config";

async function findBookings(userId: number) {
  return prisma.booking.findFirst({
    where: {
      User: {
        id: userId
      }
    },
    include: {
      Room: true
    }
  });
}

async function findBookingById(bookingId: number) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId
    }
  });
}

async function insertBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId
    },
    include: {
      Room: true
    }
  });
}

async function updateBooking(bookingId: number, roomId: number) {
  return prisma.booking.update({
    data: {
      roomId: roomId
    },
    where: {
      id: bookingId
    },
    include: {
      Room: true
    }
  });
}

const bookingRepository = {
  findBookings,
  findBookingById,
  insertBooking,
  updateBooking
};

export default bookingRepository;
