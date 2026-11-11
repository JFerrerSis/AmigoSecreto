import { z } from "zod";

import { CURRENCY_CODES } from "@/lib/currencies";

export const createGroupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres.")
      .max(80, "El nombre no puede superar los 80 caracteres.")
      .regex(
        /^[^\u0000-\u001F\u007F]*$/,
        "El nombre contiene caracteres no válidos.",
      ),
    minBudget: z.coerce
      .number()
      .min(0, "El monto mínimo no puede ser negativo.")
      .max(10_000_000, "El monto mínimo es demasiado alto."),
    maxBudget: z.coerce
      .number()
      .min(0, "El monto máximo no puede ser negativo.")
      .max(10_000_000, "El monto máximo es demasiado alto."),
    currency: z.enum(CURRENCY_CODES, {
      message: "Selecciona una moneda válida.",
    }),
    maxParticipants: z.coerce
      .number()
      .int("El cupo debe ser un número entero.")
      .min(2, "Necesitas al menos 2 participantes.")
      .max(100, "El cupo máximo es de 100 participantes."),
    drawAt: z
      .string()
      .datetime({ offset: true, message: "La fecha límite no es válida." }),
    sendEmails: z.boolean().default(true),
    website: z.string().max(0).optional(),
  })
  .strict()
  .refine((data) => data.maxBudget >= data.minBudget, {
    message: "El monto máximo debe ser mayor o igual al mínimo.",
    path: ["maxBudget"],
  })
  .refine((data) => new Date(data.drawAt).getTime() > Date.now(), {
    message: "La fecha límite debe estar en el futuro.",
    path: ["drawAt"],
  });

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const joinGroupSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(6, "El enlace de invitación no es válido.")
      .max(32, "El enlace de invitación no es válido.")
      .regex(/^[A-Za-z0-9_-]+$/, "El enlace de invitación no es válido."),
  })
  .strict();
