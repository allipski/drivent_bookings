import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getBookings, postBooking, putBooking } from "@/controllers";

const bookingsRouter = Router();

bookingsRouter
  .all("/*", authenticateToken)
  .get("/", getBookings)
  .post("/;bookingId", postBooking)
  .put("/", putBooking);

export { bookingsRouter };
