import { createSelectSchema, createInsertSchema } from "drizzle-zod"
import { todos } from "./schema"

export const todoSelectSchema = createSelectSchema(todos)
export const todoInsertSchema = createInsertSchema(todos)

// Use Drizzle's built-in type inference — z.infer is incompatible with
// drizzle-zod v0.8 which targets Zod v3.25+ (new ZodObject type signature).
export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
