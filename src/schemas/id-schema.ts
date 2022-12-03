import Joi from "joi";

export const roomIdSchema = Joi.object({
  roomId: Joi.number().integer().min(1).required()
});

export const bookingIdSchema = Joi.object({
  bookingId: Joi.number().integer().min(1).required()
});
