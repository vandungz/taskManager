const TASKS_STORAGE_KEY = "taskManager.tasks.v1";

export function normalizeTask(raw) {
	if (!raw || typeof raw !== "object") return null;

	const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
	if (!Number.isFinite(id)) return null;

	return {
		id,
		// Fallback về giá trị mặc định an toàn nếu trường bị thiếu hoặc sai kiểu
		name: typeof raw.name === "string" ? raw.name : "",
		priority: ["high", "medium", "low"].includes(raw.priority) ? raw.priority : "medium",
		tag: typeof raw.tag === "string" ? raw.tag : "Học tập",
		deadline: typeof raw.deadline === "string" ? raw.deadline : "",
		isDone: Boolean(raw.isDone),
	};
}

export function loadTasksFromStorage() {
	try {
		const raw = localStorage.getItem(TASKS_STORAGE_KEY);
		if (!raw) return [];

		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		// .filter(Boolean) loại bỏ các phần tử null/undefined trả về bởi normalizeTask
		return parsed.map(normalizeTask).filter(Boolean);
	} catch {
		return [];
	}
}

export function saveTasksToStorage(tasks) {
	try {
		localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
	} catch {
		// Bỏ qua lỗi (localStorage đầy, bị chặn...)
	}
}