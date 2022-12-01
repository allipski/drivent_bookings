import { ApplicationError } from "@/protocols";

export function invalidTicketTypeError(): ApplicationError {
  return {
    name: "InvalidTicketTypeError",
    message: "Ticket not paid or without accommodation included"
  };
}
