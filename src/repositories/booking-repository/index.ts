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

async function insertBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId
    }
  });
}

async function updateBooking(userId: number, roomId: number) {
  const booking = await prisma.booking.findFirst({
    where: {
      userId: userId
    }
  });

  return prisma.booking.update({
    data: {
      roomId: roomId
    },
    where: {
      id: booking.userId
    }
  });
}

const bookingRepository = {
  findBookings,
  insertBooking,
  updateBooking
};

export default bookingRepository;
