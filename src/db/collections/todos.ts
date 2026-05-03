import { createCollection } from "@tanstack/react-db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { todoSelectSchema } from "../zod-schemas"
import { absoluteApiUrl } from "@/lib/client-url"
import { insertTodoFn, updateTodoFn, deleteTodoFn } from "@/server-fns/todos"

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
			const result = await insertTodoFn({ data: todo })
			return { txid: result.txid }
		},
		onUpdate: async ({ transaction }) => {
			const { id, text, completed } = transaction.mutations[0].modified
			const result = await updateTodoFn({ data: { id, text, completed } })
			return { txid: result.txid }
		},
		onDelete: async ({ transaction }) => {
			const { id } = transaction.mutations[0].original
			const result = await deleteTodoFn({ data: { id } })
			return { txid: result.txid }
		},
	}),
)
