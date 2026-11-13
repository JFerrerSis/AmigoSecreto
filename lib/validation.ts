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

export const updateGroupSchema = z
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
    currency: z
      .string()
      .trim()
      .min(3, "Selecciona una moneda válida.")
      .max(8, "Selecciona una moneda válida.")
      .regex(/^[A-Za-z]{3,8}$/, "Selecciona una moneda válida.")
      .transform((value) => value.toUpperCase()),
    maxParticipants: z.coerce
      .number()
      .int("El cupo debe ser un número entero.")
      .min(2, "Necesitas al menos 2 participantes.")
      .max(100, "El cupo máximo es de 100 participantes."),
    drawAt: z
      .string()
      .datetime({ offset: true, message: "La fecha límite no es válida." }),
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

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const joinGroupSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(6, "El código de sala no es válido.")
      .max(32, "El código de sala no es válido.")
      .regex(/^[A-Za-z0-9_-]+$/, "El código de sala no es válido.")
      .transform((value) => value.toUpperCase()),
  })
  .strict();

export const removeMemberSchema = z
  .object({
    block: z.boolean().default(false),
  })
  .strict();

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;

export const sessionSchema = z
  .object({
    intent: z.enum(["login", "create", "set-password"]),
    fullName: z
      .string()
      .trim()
      .min(2, "Escribe un nombre válido.")
      .max(80, "El nombre no puede superar los 80 caracteres.")
      .regex(
        /^[^\u0000-\u001F\u007F]*$/,
        "El nombre contiene caracteres no válidos.",
      )
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Escribe un correo válido.")
      .max(254, "El correo es demasiado largo."),
    password: z
      .string()
      .max(72, "La contraseña no puede superar los 72 caracteres.")
      .optional(),
    website: z.string().max(0).optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.intent === "create" && !data.fullName) {
      context.addIssue({
        code: "custom",
        message: "Escribe un nombre válido.",
        path: ["fullName"],
      });
    }

    if (data.intent !== "login" && (!data.password || data.password.length < 8)) {
      context.addIssue({
        code: "custom",
        message: "La contraseña debe tener al menos 8 caracteres.",
        path: ["password"],
      });
    }
  });

export type SessionInput = z.infer<typeof sessionSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().max(72).optional(),
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña no puede superar los 72 caracteres."),
  })
  .strict();

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const wishlistItemSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Escribe el nombre del regalo.")
      .max(120, "El nombre no puede superar los 120 caracteres."),
    url: z
      .preprocess(
        (value) =>
          typeof value === "string" && value.trim() === "" ? undefined : value,
        z
          .string()
          .trim()
          .max(500, "El enlace es demasiado largo.")
          .url("Escribe un enlace válido.")
          .optional(),
      )
      .transform((value) => value ?? null),
    price: z
      .preprocess(
        (value) => (value === "" || value === null ? undefined : value),
        z.coerce
          .number()
          .min(0, "El precio no puede ser negativo.")
          .max(10_000_000, "El precio es demasiado alto.")
          .optional(),
      )
      .transform((value) => value ?? null),
    notes: z
      .preprocess(
        (value) =>
          typeof value === "string" && value.trim() === "" ? undefined : value,
        z
          .string()
          .trim()
          .max(500, "Las notas no pueden superar los 500 caracteres.")
          .optional(),
      )
      .transform((value) => value ?? null),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
  })
  .strict();

export type WishlistItemInput = z.infer<typeof wishlistItemSchema>;
