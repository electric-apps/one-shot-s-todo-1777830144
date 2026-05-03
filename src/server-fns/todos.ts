import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { todos } from "@/db/schema"
import { parseDates, generateTxId } from "@/db/utils"

type TodoRow = { id: string; text: string; completed: boolean; created_at: unknown }
type TodoPatch = { id: string; text?: string; completed?: boolean }

export const insertTodoFn = createServerFn({ method: "POST" })
	.inputValidator((d: unknown) => d as TodoRow)
	.handler(async ({ data }) => {
		// Dynamic import inside handler so postgres stays out of the browser bundle
		const { db } = await import("@/db")
		const row = parseDates(data as Record<string, unknown>)
		return db.transaction(async (tx) => {
			const [inserted] = await tx
				.insert(todos)
				.values(row as typeof todos.$inferInsert)
				.returning()
			const txid = await generateTxId(tx)
			return { id: inserted.id, txid }
		})
	})

export const updateTodoFn = createServerFn({ method: "POST" })
	.inputValidator((d: unknown) => d as TodoPatch)
	.handler(async ({ data }) => {
		const { db } = await import("@/db")
		const { id, ...patch } = data
		return db.transaction(async (tx) => {
			await tx
				.update(todos)
				.set(patch as Partial<typeof todos.$inferInsert>)
				.where(eq(todos.id, id))
			const txid = await generateTxId(tx)
			return { txid }
		})
	})

export const deleteTodoFn = createServerFn({ method: "POST" })
	.inputValidator((d: unknown) => d as { id: string })
	.handler(async ({ data }) => {
		const { db } = await import("@/db")
		return db.transaction(async (tx) => {
			await tx.delete(todos).where(eq(todos.id, data.id))
			const txid = await generateTxId(tx)
			return { txid }
		})
	})
