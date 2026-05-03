import { createFileRoute } from "@tanstack/react-router"
import { proxyElectricRequest } from "@/lib/electric-proxy"

export const Route = createFileRoute("/api/todos")({
	server: {
		handlers: {
			GET: ({ request }) => proxyElectricRequest(request, "todos"),
		},
	},
})
