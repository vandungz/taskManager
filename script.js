import { setDeadlinePickerDate, resetDeadlinePickerToToday } from "./calendar.js";
import { getSelectedPriority, setSelectedPriority, renderPriorityPicker } from "./priority.js";
import { getSelectedTag, initTags, setActiveTag, resetTag } from "./tags.js";
import { openModal, closeModal, initModalBackdropClose } from "./modal.js";
import { loadTasksFromStorage, saveTasksToStorage } from "./storage.js";
import { renderTasks, updateProgress, updateSummary } from "./tasks.js";

// --- APP STATE ---
let tasks = [];
let currentFilter = "all";    // "all" | "high" | "medium" | "low"
let currentSort = "newest";   // "newest" | "deadline"
let editingTaskId = null;     // null = thêm mới, number = đang chỉnh sửa

// --- RENDER CYCLE ---
function refresh() {
	renderTasks({
		tasks,
		filter: currentFilter,
		sort: currentSort,
		onToggle: toggleTaskStatus,
		onEdit: openEditModal,
		onDelete: deleteTask,
	});
	updateProgress(tasks);
	updateSummary(tasks);
}

// --- FORM UTILITIES ---
function resetForm() {
	const nameInput = document.querySelector("#task-name");
	if (nameInput) nameInput.value = "";

	resetDeadlinePickerToToday();
	resetTag();
}

function getFormData() {
	const nameInput = document.querySelector("#task-name");
	const name = nameInput?.value.trim() ?? "";

	if (!name) {
		alert("Vui lòng nhập tên công việc!");
		nameInput?.focus();
		return null;
	}

	return {
		name,
		priority: getSelectedPriority(),
		tag: getSelectedTag(),
		deadline: document.querySelector("#task-deadline")?.value ?? "",
	};
}

// --- TASK ACTIONS ---
function toggleTaskStatus(id) {
	// .find() trả về tham chiếu đến object trong mảng (không phải bản sao)
	// → gán task.isDone sẽ thay đổi trực tiếp phần tử trong mảng tasks
	const task = tasks.find((t) => t.id === id);
	if (task) {
		task.isDone = !task.isDone;
		saveTasksToStorage(tasks);
		refresh();
	}
}

function openEditModal(taskId) {
	const task = tasks.find((t) => t.id === taskId);
	if (!task) return;

	editingTaskId = taskId;

	// Điền dữ liệu cũ vào các picker
	const nameInput = document.querySelector("#task-name");
	if (nameInput) nameInput.value = task.name;

	// Priority: set state trước, rồi render lại picker để phản ánh state mới
	setSelectedPriority(task.priority);
	renderPriorityPicker();

	setDeadlinePickerDate(task.deadline);
	setActiveTag(task.tag);

	openModal("Chỉnh sửa task");
}

function deleteTask(taskId) {
	const task = tasks.find((t) => t.id === taskId);
	if (!task) return;

	if (confirm(`Xóa task "${task.name}"?\n\nHành động này không thể hoàn tác.`)) {
		// .filter() trả về mảng MỚI (không thay đổi mảng gốc)
		tasks = tasks.filter((t) => t.id !== taskId);
		saveTasksToStorage(tasks);
		refresh();
	}
}

// --- MODAL CLOSE HELPER ---
function handleCloseModal() {
	editingTaskId = null;
	closeModal(resetForm);
}

// --- FORM SUBMIT ---
const taskForm = document.querySelector(".task-form");

taskForm?.addEventListener("submit", (e) => {
	e.preventDefault(); // Ngăn trình duyệt reload trang (hành vi mặc định của form)

	const data = getFormData();
	if (!data) return; // Validation failed

	if (editingTaskId !== null) {
		// EDIT MODE: tìm task và cập nhật trực tiếp
		const task = tasks.find((t) => t.id === editingTaskId);
		if (task) Object.assign(task, data); // Object.assign() copy các property của data vào task
		editingTaskId = null;
	} else {
		// ADD MODE: tạo task mới với id là timestamp hiện tại
		// Date.now() trả về số ms từ Unix epoch → đảm bảo unique nếu không tạo quá nhanh
		tasks.push({ id: Date.now(), isDone: false, ...data });
	}

	saveTasksToStorage(tasks);
	refresh();
	handleCloseModal();
});

// --- BOARD CONTROLS ---

// Nút "Thêm task"
const openModalBtn = document.querySelector(".task-board__add");
openModalBtn?.addEventListener("click", () => {
	editingTaskId = null;
	resetForm();
	openModal();
});

// Nút "Huỷ" trong form
const closeModalBtn = document.querySelector(".task-form__btn--cancel");
closeModalBtn?.addEventListener("click", handleCloseModal);

// Click backdrop để đóng modal
initModalBackdropClose(handleCloseModal);

// Nút "Xóa xong"
const deleteDoneBtn = document.querySelector(".btn--danger");
deleteDoneBtn?.addEventListener("click", () => {
	tasks = tasks.filter((t) => !t.isDone);
	saveTasksToStorage(tasks);
	refresh();
});

// Filter chips
const filterChips = document.querySelectorAll(".chip");
filterChips.forEach((chip) => {
	chip.addEventListener("click", () => {
		// Cập nhật trạng thái active trên tất cả chips
		filterChips.forEach((c) => c.classList.remove("chip--active"));
		chip.classList.add("chip--active");

		if (chip.classList.contains("chip--deadline")) {
			// Nút Deadline: toggle chế độ sort, không thay đổi filter
			currentSort = currentSort === "deadline" ? "newest" : "deadline";
		} else {
			// Các nút filter: reset sort về mặc định
			currentSort = "newest";
			currentFilter =
				chip.classList.contains("chip--high")   ? "high"   :
				chip.classList.contains("chip--medium") ? "medium" :
				chip.classList.contains("chip--low")    ? "low"    : "all";
		}

		refresh();
	});
});

// --- BOOTSTRAP ---
document.addEventListener("DOMContentLoaded", () => {
	tasks = loadTasksFromStorage();
	renderPriorityPicker();
	initTags();
	refresh();
});