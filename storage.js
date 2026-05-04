/**
 * storage.js — Tầng lưu trữ dữ liệu (localStorage)
 *
 * Tách riêng để:
 *   1. Đổi storage backend (sessionStorage, IndexedDB...) chỉ cần sửa file này.
 *   2. Mọi logic liên quan đến lưu/đọc dữ liệu nằm ở một chỗ.
 */

const TASKS_STORAGE_KEY = "taskManager.tasks.v1";

/**
 * Chuẩn hóa (validate + sanitize) một task object đọc từ storage.
 * Khi dữ liệu trong localStorage bị chỉnh tay hoặc từ phiên bản cũ,
 * hàm này đảm bảo task luôn có đủ các trường đúng kiểu.
 *
 * @param {unknown} raw — dữ liệu thô từ JSON.parse
 * @returns {{ id, name, priority, tag, deadline, isDone }|null}
 */
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

/**
 * Đọc danh sách tasks từ localStorage.
 * Trả về mảng rỗng nếu chưa có dữ liệu hoặc dữ liệu bị lỗi.
 *
 * try/catch cần thiết vì localStorage có thể:
 *   - Bị chặn ở chế độ ẩn danh (private browsing)
 *   - Chứa JSON không hợp lệ (bị chỉnh tay)
 *
 * @returns {Array}
 */
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

/**
 * Ghi danh sách tasks vào localStorage.
 * JSON.stringify() chuyển array/object thành chuỗi để lưu trữ.
 *
 * @param {Array} tasks
 */
export function saveTasksToStorage(tasks) {
	try {
		localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
	} catch {
		// Bỏ qua lỗi (localStorage đầy, bị chặn...)
	}
}