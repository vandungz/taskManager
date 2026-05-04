
import { getDaysRemaining, parseViDate, startOfDay } from "./utils.js";

// --- MODULE STATE ---
let activePopup = null; // Tham chiếu đến popup đang mở (nếu có)

// --- POPUP ---
function closeActivePopup() {
	if (activePopup) {
		// .remove() xóa phần tử khỏi DOM (không cần biết parent là gì)
		activePopup.remove();
		activePopup = null;
	}
}


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
function getPriorityLabel(priority) {
	const labels = { high: "Cao", medium: "Trung bình", low: "Thấp" };
	return labels[priority] ?? priority;
}

// --- RENDER TASK ITEM ---
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