import { z } from "zod";
import { roles } from "../../../../packages/contracts/roles";

const noControl = (value: string) => !/[\u0000-\u001f\u007f]/.test(value);

export const username = z
  .string({ error: "Enter a username." })
  .trim()
  .min(3, "Usernames have at least 3 characters.")
  .max(64, "Usernames have at most 64 characters.")
  .regex(/^[A-Za-z0-9._-]+$/, "Usernames use letters, numbers, dots, dashes and underscores only.");

export const newPassword = z
  .string({ error: "Enter a password." })
  .min(12, "Passwords have at least 12 characters.")
  .max(256, "Passwords have at most 256 characters.");

const displayName = z
  .string({ error: "Enter a display name." })
  .trim()
  .min(1, "Enter a display name.")
  .max(80, "Display names have at most 80 characters.")
  .refine(noControl, "Display names cannot contain control characters.");

const role = z.enum(roles, { error: "Choose a valid role." });

export const loginSchema = z.object({
  username: z.string({ error: "Enter your username." }).trim().min(1, "Enter your username.").max(64, "Username or password is incorrect."),
  password: z.string({ error: "Enter your password." }).min(1, "Enter your password.").max(256, "Username or password is incorrect."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ error: "Enter your current password." }).min(1, "Enter your current password.").max(256),
  newPassword,
});

export const createMemberSchema = z.object({ username, displayName, role });

export const updateMemberSchema = z
  .object({ role: role.optional(), status: z.enum(["active", "disabled"], { error: "Choose active or disabled." }).optional() })
  .refine((v) => v.role || v.status, "Change the role or the status.");

export const bootstrapSecretsSchema = z.object({
  username,
  password: newPassword,
  displayName: displayName.optional(),
  workspaceName: displayName.optional(),
});
