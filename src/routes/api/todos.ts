import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { todos } from "@/db/schema"
import { todoInsertSchema } from "@/db/zod-schemas"
import { parseDates, generateTxId } from "@/db/utils"
import { proxyElectricRequest } from "@/lib/electric-proxy"

const handleShape = ({ request }: { request: Request }) =>
	proxyElectricRequest(request, "todos")

const handleMutation = async ({ request }: { request: Request }) => {
	const method = request.method

	if (method === "POST") {
		const raw = parseDates(await request.json())
		const parsed = todoInsertSchema.parse(raw)
		const result = await db.transaction(async (tx) => {
			const [row] = await tx.insert(todos).values(parsed).returning()
			const txid = await generateTxId(tx)
			return { id: row.id, txid }
		})
		return Response.json(result, { status: 201 })
	}

	if (method === "PATCH") {
		const raw = parseDates(await request.json())
		const { id, ...updates } = raw as { id: string; completed?: boolean; text?: string }
		const result = await db.transaction(async (tx) => {
			await tx.update(todos).set(updates).where(eq(todos.id, id))
			const txid = await generateTxId(tx)
			return { txid }
		})
		return Response.json(result)
	}

	if (method === "DELETE") {
		const { id } = (await request.json()) as { id: string }
		const result = await db.transaction(async (tx) => {
			await tx.delete(todos).where(eq(todos.id, id))
			const txid = await generateTxId(tx)
			return { txid }
		})
		return Response.json(result)
	}

	return new Response("Method not allowed", { status: 405 })
}

export const Route = createFileRoute("/api/todos")({
	server: {
		handlers: {
			GET: handleShape,
			POST: handleMutation,
			PATCH: handleMutation,
			DELETE: handleMutation,
		},
	},
})
