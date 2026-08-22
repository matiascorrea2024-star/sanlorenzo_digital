import { Resend } from "resend";

export function resend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY en env vars");
  }
  return new Resend(apiKey);
}
