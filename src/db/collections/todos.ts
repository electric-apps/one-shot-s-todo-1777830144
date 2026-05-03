import { createCollection } from "@tanstack/react-db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { todoSelectSchema } from "../zod-schemas"
import { absoluteApiUrl } from "@/lib/client-url"

export const todosCollection = createCollection(
	electricCollectionOptions({
		id: "todos",
		schema: todoSelectSchema,
		getKey: (row) => row.id,
		shapeOptions: {
			url: absoluteApiUrl("/api/todos"),
			parser: {
				timestamptz: (v: string) => new Date(v),
			},
		},
		onInsert: async ({ transaction }) => {
			const todo = transaction.mutations[0].modified
			const res = await fetch("/api/todos", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(todo),
			})
			if (!res.ok) throw new Error(`Insert failed: ${res.status}`)
			const { txid } = (await res.json()) as { txid: number }
			return { txid }
		},
		onUpdate: async ({ transaction }) => {
			const todo = transaction.mutations[0].modified
			const res = await fetch("/api/todos", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(todo),
			})
			if (!res.ok) throw new Error(`Update failed: ${res.status}`)
			const { txid } = (await res.json()) as { txid: number }
			return { txid }
		},
		onDelete: async ({ transaction }) => {
			const todo = transaction.mutations[0].original
			const res = await fetch("/api/todos", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: todo.id }),
			})
			if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
			const { txid } = (await res.json()) as { txid: number }
			return { txid }
		},
	}),
)
