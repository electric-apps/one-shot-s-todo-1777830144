import { createFileRoute } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { useState } from "react"
import { todosCollection } from "@/db/collections/todos"
import type { Todo } from "@/db/zod-schemas"

export const Route = createFileRoute("/")({
	ssr: false,
	component: App,
})

function App() {
	const { data: todos = [] } = useLiveQuery((q) =>
		q.from({ todo: todosCollection }).orderBy(({ todo }) => todo.created_at, "asc"),
	)
	const [inputText, setInputText] = useState("")

	const handleAdd = () => {
		const trimmed = inputText.trim()
		if (!trimmed) return
		todosCollection.insert({
			id: crypto.randomUUID(),
			text: trimmed,
			completed: false,
			created_at: new Date(),
		})
		setInputText("")
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") handleAdd()
	}

	const handleToggle = (todo: Todo) => {
		todosCollection.update(todo.id, (draft) => {
			draft.completed = !todo.completed
		})
	}

	const handleDelete = (id: string) => {
		todosCollection.delete(id)
	}

	return (
		<div className="flex min-h-svh flex-col items-center bg-gray-50 p-8 dark:bg-gray-900">
			<div className="w-full max-w-md">
				<h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">Todos</h1>

				<div className="mb-6 flex gap-2">
					<input
						className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
						placeholder="What needs to be done?"
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
						onKeyDown={handleKeyDown}
					/>
					<button
						className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 active:bg-blue-800"
						onClick={handleAdd}
					>
						Add
					</button>
				</div>

				{todos.length === 0 ? (
					<p className="text-center text-sm text-gray-400 dark:text-gray-500">
						No todos yet. Add one above!
					</p>
				) : (
					<ul className="flex flex-col gap-2">
						{todos.map((todo) => (
							<li
								key={todo.id}
								className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
							>
								<input
									type="checkbox"
									checked={todo.completed}
									onChange={() => handleToggle(todo)}
									className="h-4 w-4 cursor-pointer rounded accent-blue-600"
								/>
								<span
									className={`flex-1 text-sm ${todo.completed ? "text-gray-400 line-through dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}
								>
									{todo.text}
								</span>
								<button
									onClick={() => handleDelete(todo.id)}
									className="text-lg leading-none text-gray-400 hover:text-red-500 focus:outline-none dark:text-gray-500 dark:hover:text-red-400"
									aria-label="Delete todo"
								>
									×
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}
