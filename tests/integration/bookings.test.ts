import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { prisma, TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createBooking,
  createTicket,
  createPayment,
  createTicketTypeWithHotel,
  createTicketTypeRemote,
  createHotel,
  createRoomWithHotelId,
  createRoomWithOneCapacity,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

// describe("GET /booking", () => {
//   it("should respond with status 401 if no token is given", async () => {
//     const response = await server.get("/booking");

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   it("should respond with status 401 if given token is not valid", async () => {
//     const token = faker.lorem.word();

//     const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   it("should respond with status 401 if there is no session for given token", async () => {
//     const userWithoutSession = await createUser();
//     const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

//     const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   describe("when token is valid", () => {
//     it("should respond with status 404 when user has no booking ", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);

//       const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.NOT_FOUND);
//     });

//     it("should respond with status 200 and send booking information", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);
//       const enrollment = await createEnrollmentWithAddress(user);
//       const ticketType = await createTicketTypeWithHotel();
//       const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
//       await createPayment(ticket.id, ticketType.price);
//       const createdHotel = await createHotel();
//       const createdRoom = await createRoomWithHotelId(createdHotel.id);
//       const booking = await createBooking(user.id, createdRoom.id);

//       const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.OK);

//       expect(response.body).toEqual(
//         {
//           id: booking.id,
//           Room: {
//             id: booking.Room.id,
//             name: booking.Room.name,
//             capacity: booking.Room.capacity,
//             hotelId: booking.Room.hotelId,            
//             createdAt: booking.Room.createdAt.toISOString(),
//             updatedAt: booking.Room.updatedAt.toISOString()
//           }
//         }
//       );
//     });
//   });
// });

describe("PUT /hotels/:hotelId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/hotels/1");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 403 when user does not have a booking ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 404 for invalid room id - invalid partition, min limit value -1 (zero)", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 0 });

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 403 when room capacity is full", async () => {
      const user = await createUser();
      const userTwo = await createUser();

      const token = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const enrollmentTwo = await createEnrollmentWithAddress(userTwo);

      const ticketType = await createTicketTypeWithHotel();

      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const ticketTwo = await createTicket(enrollmentTwo.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticketTwo.id, ticketType.price);

      const createdHotel = await createHotel();
      const createdRoomOne = await createRoomWithOneCapacity(createdHotel.id);
      const createdRoomTwo = await createRoomWithOneCapacity(createdHotel.id);

      await createBooking(user.id, createdRoomOne.id);
      await createBooking(userTwo.id, createdRoomTwo.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoomTwo.id });

      expect(response.status).toEqual(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 200 and send new booking id - valid partition, nominal", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();

      const createdRoom = await createRoomWithHotelId(createdHotel.id);

      const response = await server.get(`/hotels/${createdHotel.id}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);

      expect(response.body).toEqual({
        id: createdHotel.id,
        name: createdHotel.name,
        image: createdHotel.image,
        createdAt: createdHotel.createdAt.toISOString(),
        updatedAt: createdHotel.updatedAt.toISOString(),
        Rooms: [{
          id: createdRoom.id,
          name: createdRoom.name,
          capacity: createdRoom.capacity,
          hotelId: createdHotel.id,
          createdAt: createdRoom.createdAt.toISOString(),
          updatedAt: createdRoom.updatedAt.toISOString(),
        }]
      });
    });

    it("should respond with status 200 and send new booking id - valid partition, min limit value", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();

      const createdRoom = await createRoomWithHotelId(createdHotel.id);

      const response = await server.get(`/hotels/${createdHotel.id}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);

      expect(response.body).toEqual({
        id: createdHotel.id,
        name: createdHotel.name,
        image: createdHotel.image,
        createdAt: createdHotel.createdAt.toISOString(),
        updatedAt: createdHotel.updatedAt.toISOString(),
        Rooms: [{
          id: createdRoom.id,
          name: createdRoom.name,
          capacity: createdRoom.capacity,
          hotelId: createdHotel.id,
          createdAt: createdRoom.createdAt.toISOString(),
          updatedAt: createdRoom.updatedAt.toISOString(),
        }]
      });
    });

    it("should respond with status 200 and send new booking id - valid partition, min limit value +1", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();

      const createdRoom = await createRoomWithHotelId(createdHotel.id);

      const response = await server.get(`/hotels/${createdHotel.id}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);

      expect(response.body).toEqual({
        id: createdHotel.id,
        name: createdHotel.name,
        image: createdHotel.image,
        createdAt: createdHotel.createdAt.toISOString(),
        updatedAt: createdHotel.updatedAt.toISOString(),
        Rooms: [{
          id: createdRoom.id,
          name: createdRoom.name,
          capacity: createdRoom.capacity,
          hotelId: createdHotel.id,
          createdAt: createdRoom.createdAt.toISOString(),
          updatedAt: createdRoom.updatedAt.toISOString(),
        }]
      });
    });
  });
});

// describe("POST /hotels", () => {
//   it("should respond with status 401 if no token is given", async () => {
//     const response = await server.get("/hotels/1");

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   it("should respond with status 401 if given token is not valid", async () => {
//     const token = faker.lorem.word();

//     const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   it("should respond with status 401 if there is no session for given token", async () => {
//     const userWithoutSession = await createUser();
//     const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

//     const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

//     expect(response.status).toBe(httpStatus.UNAUTHORIZED);
//   });

//   describe("when token is valid", () => {
//     it("should respond with status 403 when user ticket is remote or is not paid", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);
//       const enrollment = await createEnrollmentWithAddress(user);
//       const ticketType = await createTicketTypeRemote();
//       const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
//       await createPayment(ticket.id, ticketType.price);
//       //Hoteis no banco

//       const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
//     });

//     it("should respond with status 404 when user has no enrollment ", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);

//       await createTicketTypeRemote();

//       const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.NOT_FOUND);
//     });

//     it("should respond with status 404 for invalid room id - invalid partition, min limit value -1 (zero)", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);
//       const enrollment = await createEnrollmentWithAddress(user);
//       const ticketType = await createTicketTypeWithHotel();
//       const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
//       await createPayment(ticket.id, ticketType.price);

//       await createHotel();

//       const response = await server.get("/hotels/100").set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.NOT_FOUND);
//     });

//     it("should respond with status 403 when room capacity is full", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);
//       const enrollment = await createEnrollmentWithAddress(user);
//       const ticketType = await createTicketTypeWithHotel();
//       const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
//       await createPayment(ticket.id, ticketType.price);

//       await createHotel();

//       const response = await server.get("/hotels/100").set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.NOT_FOUND);
//     });

//     it("should respond with status 200 and send new booking id - valid partition, nominal", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);
//       const enrollment = await createEnrollmentWithAddress(user);
//       const ticketType = await createTicketTypeWithHotel();
//       const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
//       await createPayment(ticket.id, ticketType.price);

//       const createdHotel = await createHotel();

//       const createdRoom = await createRoomWithHotelId(createdHotel.id);

//       const response = await server.get(`/hotels/${createdHotel.id}`).set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.OK);

//       expect(response.body).toEqual({
//         id: createdHotel.id,
//         name: createdHotel.name,
//         image: createdHotel.image,
//         createdAt: createdHotel.createdAt.toISOString(),
//         updatedAt: createdHotel.updatedAt.toISOString(),
//         Rooms: [{
//           id: createdRoom.id,
//           name: createdRoom.name,
//           capacity: createdRoom.capacity,
//           hotelId: createdHotel.id,
//           createdAt: createdRoom.createdAt.toISOString(),
//           updatedAt: createdRoom.updatedAt.toISOString(),
//         }]
//       });
//     });

//     it("should respond with status 200 and send new booking id - valid partition, min limit value", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);
//       const enrollment = await createEnrollmentWithAddress(user);
//       const ticketType = await createTicketTypeWithHotel();
//       const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
//       await createPayment(ticket.id, ticketType.price);

//       const createdHotel = await createHotel();

//       const createdRoom = await createRoomWithHotelId(createdHotel.id);

//       const response = await server.get(`/hotels/${createdHotel.id}`).set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.OK);

//       expect(response.body).toEqual({
//         id: createdHotel.id,
//         name: createdHotel.name,
//         image: createdHotel.image,
//         createdAt: createdHotel.createdAt.toISOString(),
//         updatedAt: createdHotel.updatedAt.toISOString(),
//         Rooms: [{
//           id: createdRoom.id,
//           name: createdRoom.name,
//           capacity: createdRoom.capacity,
//           hotelId: createdHotel.id,
//           createdAt: createdRoom.createdAt.toISOString(),
//           updatedAt: createdRoom.updatedAt.toISOString(),
//         }]
//       });
//     });

//     it("should respond with status 200 and send new booking id - valid partition, min limit value +1", async () => {
//       const user = await createUser();
//       const token = await generateValidToken(user);
//       const enrollment = await createEnrollmentWithAddress(user);
//       const ticketType = await createTicketTypeWithHotel();
//       const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
//       await createPayment(ticket.id, ticketType.price);

//       const createdHotel = await createHotel();

//       const createdRoom = await createRoomWithHotelId(createdHotel.id);

//       const response = await server.get(`/hotels/${createdHotel.id}`).set("Authorization", `Bearer ${token}`);

//       expect(response.status).toEqual(httpStatus.OK);

//       expect(response.body).toEqual({
//         id: createdHotel.id,
//         name: createdHotel.name,
//         image: createdHotel.image,
//         createdAt: createdHotel.createdAt.toISOString(),
//         updatedAt: createdHotel.updatedAt.toISOString(),
//         Rooms: [{
//           id: createdRoom.id,
//           name: createdRoom.name,
//           capacity: createdRoom.capacity,
//           hotelId: createdHotel.id,
//           createdAt: createdRoom.createdAt.toISOString(),
//           updatedAt: createdRoom.updatedAt.toISOString(),
//         }]
//       });
//     });
//   });
// });
