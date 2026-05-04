/**
 * tasks.js — Render danh sách task, popup menu, filter & sort
 *
 * Chịu trách nhiệm:
 *   - Vẽ HTML cho từng task
 *   - Xử lý filter (all / high / medium / low) và sort (newest / deadline)
 *   - Popup "Edit / Delete" cho mỗi task
 *   - Cập nhật progress bar và summary
 */

import { getDaysRemaining, parseViDate, startOfDay } from "./utils.js";

// --- MODULE STATE ---

let activePopup = null; // Tham chiếu đến popup đang mở (nếu có)

// --- POPUP ---

/**
 * Đóng và xóa popup hiện tại khỏi DOM.
 * Gọi trước khi mở popup mới để tránh nhiều popup cùng tồn tại.
 */
function closeActivePopup() {
	if (activePopup) {
		// .remove() xóa phần tử khỏi DOM (không cần biết parent là gì)
		activePopup.remove();
		activePopup = null;
	}
}

/**
 * Tạo và hiển thị popup menu (Edit / Delete) bên cạnh nút trigger.
 *
 * Popup được append vào <body> thay vì bên trong task card,
 * để tránh bị clip bởi overflow:hidden của parent.
 *
 * getBoundingClientRect() trả về vị trí và kích thước của element
 * tương đối với viewport (cửa sổ trình duyệt, không phải trang).
 * window.scrollY cộng thêm để tính vị trí tuyệt đối trên trang.
 *
 * @param {HTMLButtonElement} triggerBtn — nút "•••" đã click
 * @param {number} taskId
 * @param {Function} onEdit   — callback(taskId)
 * @param {Function} onDelete — callback(taskId)
 */
function showTaskPopup(triggerBtn, taskId, onEdit, onDelete) {
	const popup = document.createElement("div");
	popup.className = "task-popup";
	// data-* attribute dùng để lưu dữ liệu tùy chỉnh trên DOM element
	popup.dataset.forId = String(taskId);

	// Tạo nút Edit
	const editItem = document.createElement("button");
	editItem.type = "button";
	editItem.className = "task-popup__item";
	editItem.textContent = "Edit";
	editItem.addEventListener("click", () => {
		closeActivePopup();
		onEdit(taskId);
	});

	// Tạo nút Delete
	const deleteItem = document.createElement("button");
	deleteItem.type = "button";
	deleteItem.className = "task-popup__item task-popup__item--danger";
	deleteItem.textContent = "Delete";
	deleteItem.addEventListener("click", () => {
		closeActivePopup();
		onDelete(taskId);
	});

	popup.append(editItem, deleteItem);
	document.body.appendChild(popup);

	// Định vị popup: căn phải theo nút trigger, xuất hiện bên dưới
	const rect = triggerBtn.getBoundingClientRect();
	popup.style.top = `${rect.bottom + window.scrollY + 6}px`;
	popup.style.right = `${window.innerWidth - rect.right - window.scrollX}px`;

	activePopup = popup;
}

// Đóng popup khi click bất kỳ đâu trên document
// Listener này chạy luôn (không cần cleanup), gắn một lần
document.addEventListener("click", closeActivePopup);

// --- BADGE LABEL ---

/**
 * Trả về text cho badge ưu tiên.
 *
 * @param {string} priority
 * @returns {string}
 */
function getPriorityLabel(priority) {
	const labels = { high: "Cao", medium: "Trung bình", low: "Thấp" };
	return labels[priority] ?? priority;
}

// --- RENDER TASK ITEM ---

/**
 * Tạo HTML string cho một task.
 * Template literal (backtick) cho phép nhúng biến JS vào chuỗi HTML.
 *
 * Chú ý bảo mật: task.name được nhúng trực tiếp vào innerHTML.
 * Trong ứng dụng thực tế cần escape HTML để tránh XSS.
 * Ở đây dữ liệu đến từ input của chính user nên rủi ro thấp.
 *
 * @param {object} task
 * @returns {string} HTML string
 */
function buildTaskHTML(task) {
	const remaining = !task.isDone ? getDaysRemaining(task.deadline) : null;

	// Chỉ render span "ngày còn lại" nếu có dữ liệu
	const remainingHtml = remaining
		? `<span class="task__remaining task__remaining--${remaining.type}">${remaining.label}</span>`
		: "";

	const priorityBadge = task.isDone
		? `<span class="badge badge--muted">Đã xong</span>`
		: `<span class="badge badge--${task.priority}">${getPriorityLabel(task.priority)}</span>`;

	return `
		<article class="task task--${task.priority} ${task.isDone ? "task--done" : ""}" data-id="${task.id}">
			<label class="task__check">
				<input class="task__checkbox" type="checkbox" ${task.isDone ? "checked" : ""}
					data-toggle-id="${task.id}" />
				<span class="task__checkbox-ui" aria-hidden="true"></span>
			</label>
			<div class="task__content">
				<div class="task__top">
					<h3 class="task__title">${task.name}</h3>
					${priorityBadge}
				</div>
				<div class="task__meta">
					<span class="task__due">Hạn: ${task.deadline}</span>
					${remainingHtml}
					<span class="badge badge--muted">${task.tag}</span>
				</div>
			</div>
			<button class="icon-btn task__menu" type="button" aria-label="Tùy chọn"
				data-menu-id="${task.id}">•••</button>
		</article>
	`;
}

// --- FILTER & SORT ---

/**
 * Lọc và sắp xếp danh sách tasks theo filter + sort hiện tại.
 *
 * Sort logic:
 *   - Task đã xong luôn xuống cuối (a.isDone - b.isDone: false=0, true=1)
 *   - Trong nhóm chưa xong: theo deadline hoặc id (thời điểm tạo)
 *
 * @param {Array} tasks
 * @param {string} filter — "all" | "high" | "medium" | "low"
 * @param {string} sort   — "newest" | "deadline"
 * @returns {Array}
 */
export function getFilteredAndSorted(tasks, filter, sort) {
	return tasks
		.filter((task) => filter === "all" || task.priority === filter)
		.sort((a, b) => {
			// Boolean arithmetic: true=1, false=0
			// a.isDone=true, b.isDone=false → 1-0=1 → a xuống sau b
			if (a.isDone !== b.isDone) return Number(a.isDone) - Number(b.isDone);

			if (sort === "deadline") {
				const da = parseViDate(a.deadline);
				const db = parseViDate(b.deadline);
				// Task không có deadline xuống cuối
				if (!da && !db) return 0;
				if (!da) return 1;
				if (!db) return -1;
				// Date objects có thể so sánh trực tiếp bằng phép trừ
				return da - db;
			}

			// Mặc định: task tạo sau (id lớn hơn) đứng trước
			return b.id - a.id;
		});
}

// --- MAIN RENDER ---

/**
 * Render toàn bộ danh sách task vào container.
 * Sau khi render, gắn lại sự kiện cho các phần tử động.
 *
 * Tại sao phải gắn lại sự kiện? Vì innerHTML = "..." xóa toàn bộ DOM cũ,
 * bao gồm cả các event listener đã gắn lên các phần tử con.
 *
 * Giải pháp tốt hơn (nâng cao): Event Delegation — gắn listener một lần
 * trên container, dùng e.target để xác định phần tử được click.
 *
 * @param {object} params
 * @param {Array}    params.tasks
 * @param {string}   params.filter
 * @param {string}   params.sort
 * @param {Function} params.onToggle  — callback(taskId) khi tick checkbox
 * @param {Function} params.onEdit    — callback(taskId) khi click Edit
 * @param {Function} params.onDelete  — callback(taskId) khi click Delete
 */
export function renderTasks({ tasks, filter, sort, onToggle, onEdit, onDelete }) {
	const container = document.querySelector(".task-board__list");
	if (!container) return;

	const filtered = getFilteredAndSorted(tasks, filter, sort);

	// Dùng innerHTML để render toàn bộ list trong một lần
	// (tốt hơn append từng phần tử khi re-render toàn bộ)
	container.innerHTML = filtered.map(buildTaskHTML).join("");

	// Gắn sự kiện cho checkbox (Event Delegation thủ công qua data attribute)
	container.querySelectorAll(".task__checkbox").forEach((checkbox) => {
		checkbox.addEventListener("change", () => {
			const id = Number(checkbox.dataset.toggleId);
			onToggle(id);
		});
	});

	// Gắn sự kiện cho nút "•••" (popup menu)
	container.querySelectorAll(".task__menu").forEach((btn) => {
		btn.addEventListener("click", (e) => {
			// stopPropagation() ngăn sự kiện nổi bọt lên document listener "closeActivePopup"
			// Nếu không chặn: click "•••" → mở popup → ngay lập tức đóng popup
			e.stopPropagation();

			const id = Number(btn.dataset.menuId);

			// Nếu popup của task này đang mở → đóng lại (toggle behavior)
			const isAlreadyOpen = activePopup?.dataset.forId === String(id);
			closeActivePopup();
			if (!isAlreadyOpen) showTaskPopup(btn, id, onEdit, onDelete);
		});
	});
}

// --- PROGRESS & SUMMARY ---

/**
 * Cập nhật thanh tiến độ và label "x/y hoàn thành".
 *
 * @param {Array} tasks
 */
export function updateProgress(tasks) {
	const doneCount = tasks.filter((t) => t.isDone).length;
	const total = tasks.length;
	const percent = total === 0 ? 0 : (doneCount / total) * 100;

	const progressBar = document.querySelector(".progress__bar");
	const progressLabel = document.querySelector(".task-board__progress-value");

	// Gán style trực tiếp cho width (giá trị động, không thể dùng CSS class)
	if (progressBar) progressBar.style.width = `${percent}%`;
	if (progressLabel) progressLabel.textContent = `${doneCount} / ${total} hoàn thành`;
}

/**
 * Cập nhật text tóm tắt footer: "X task chưa xong · Y quá hạn".
 *
 * @param {Array} tasks
 */
export function updateSummary(tasks) {
	const summaryEl = document.querySelector(".task-board__summary");
	if (!summaryEl) return;

	const today = startOfDay(new Date());
	const unfinished = tasks.filter((t) => !t.isDone).length;
	const overdue = tasks.filter((t) => {
		if (t.isDone) return false;
		const d = parseViDate(t.deadline);
		return d ? d < today : false;
	}).length;

	summaryEl.textContent = `${unfinished} task chưa xong · ${overdue} quá hạn`;
}