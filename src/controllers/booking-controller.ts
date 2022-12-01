import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/bookings-service";
import httpStatus from "http-status";

export async function getBookings(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const bookings = await bookingService.fetchBookings(Number(userId));
    return res.status(httpStatus.OK).send(bookings);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = req.body.roomId;

  try {
    const newBooking = await bookingService.createBooking(Number(userId), Number(roomId));

    return res.status(httpStatus.OK).send(newBooking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }

    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const roomId = req.params.room;

  try {
    const modifiedBooking = await bookingService.changeBooking(Number(userId), Number(roomId));

    return res.status(httpStatus.OK).send(modifiedBooking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }

    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}

