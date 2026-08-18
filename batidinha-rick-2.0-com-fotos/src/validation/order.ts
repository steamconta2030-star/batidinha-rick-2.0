import { z } from "zod";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome."),
  phone: z.string().trim().refine((value) => value.replace(/\D/g, "").length >= 10, "Informe um WhatsApp válido."),
  deliveryType: z.enum(["delivery", "pickup"]),
  address: z.string().trim(),
  paymentMethod: z.enum(["pix", "cash", "card"]),
  changeFor: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().max(500, "A observação deve ter até 500 caracteres."),
}).superRefine((data, context) => {
  if (data.deliveryType === "delivery" && data.address.length < 5) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["address"], message: "Informe o endereço de entrega." });
  }
  if (data.paymentMethod !== "cash" && data.changeFor) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["changeFor"], message: "Troco é permitido somente para pagamento em dinheiro." });
  }
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
