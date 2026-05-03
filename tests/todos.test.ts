import { describe, it, expect } from "vitest"
import { todoSelectSchema, todoInsertSchema } from "@/db/zod-schemas"

const validTodo = {
	id: crypto.randomUUID(),
	text: "Buy milk",
	completed: false,
	created_at: new Date(),
}

describe("todoSelectSchema", () => {
	it("validates a valid todo row", () => {
		expect(todoSelectSchema.safeParse(validTodo).success).toBe(true)
	})

	it("rejects a todo without id", () => {
		const { id: _omit, ...rest } = validTodo
		expect(todoSelectSchema.safeParse(rest).success).toBe(false)
	})

	it("rejects a todo without text", () => {
		const { text: _omit, ...rest } = validTodo
		expect(todoSelectSchema.safeParse(rest).success).toBe(false)
	})

	it("rejects a todo without completed", () => {
		const { completed: _omit, ...rest } = validTodo
		expect(todoSelectSchema.safeParse(rest).success).toBe(false)
	})

	it("accepts completed = true", () => {
		const result = todoSelectSchema.safeParse({ ...validTodo, completed: true })
		expect(result.success).toBe(true)
		if (result.success) expect(result.data.completed).toBe(true)
	})
})

describe("todoInsertSchema", () => {
	it("validates a full insert row", () => {
		expect(todoInsertSchema.safeParse(validTodo).success).toBe(true)
	})

	it("allows insert without id (uses db default)", () => {
		const { id: _omit, ...rest } = validTodo
		expect(todoInsertSchema.safeParse(rest).success).toBe(true)
	})

	it("allows insert without created_at (uses db default)", () => {
		const { created_at: _omit, ...rest } = validTodo
		expect(todoInsertSchema.safeParse(rest).success).toBe(true)
	})

	it("rejects insert without text", () => {
		const { text: _omit, ...rest } = validTodo
		expect(todoInsertSchema.safeParse(rest).success).toBe(false)
	})
})
