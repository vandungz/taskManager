import { resetDeadlinePickerToToday } from "./calendar.js";
import { getSelectedPriority, renderPriorityPicker } from "./priority.js";

// Thêm sự kiện để mở modal
const openModalBtn = document.querySelector(".task-board__add");
const closeModalBtn = document.querySelector(".task-form__btn--cancel");
const submitModalBtn = document.querySelector(".btn--success");
const modal = document.querySelector(".modal");
const modalBackdrop = document.querySelector(".modal__backdrop");

openModalBtn.addEventListener("click", (e) => {
    // Ngăn chặn hành vi mặc định của nút (nếu có)
    e.preventDefault();
    resetFormToDefault();
    modal.classList.remove("modal--hidden");
});

closeModalBtn.addEventListener("click", (e) => {
    // Ngăn chặn hành vi mặc định của nút (nếu có)
    e.preventDefault();
    modal.classList.add("modal--hidden");
    resetFormToDefault();
});

// Đóng modal khi nhấp vào bên ngoài nội dung modal hoặc khi nhấp vào nút submit (nếu muốn giữ modal mở sau khi submit, bạn có thể bỏ phần này)
window.addEventListener("click", (e) => {
    // Chỉ đóng khi bấm vào nền xám (backdrop)
    if (e.target === modalBackdrop) {
        modal.classList.add("modal--hidden");
        resetFormToDefault();
    }
});

// --- STATE QUẢN LÝ ---
let tasks = []; // Mảng chứa toàn bộ task
let currentFilter = "all"; // Trạng thái bộ lọc hiện tại
let selectedTag = "Học tập";

// --- LOCAL STORAGE ---
const TASKS_STORAGE_KEY = "taskManager.tasks.v1";

function normalizeTask(raw) {
    if (!raw || typeof raw !== "object") return null;

    const id = typeof raw.id === "number" ? raw.id : Number(raw.id);
    if (!Number.isFinite(id)) return null;

    const name = typeof raw.name === "string" ? raw.name : "";
    const priority = ["high", "medium", "low"].includes(raw.priority) ? raw.priority : "medium";
    const tag = typeof raw.tag === "string" ? raw.tag : "Học tập";
    const deadline = typeof raw.deadline === "string" ? raw.deadline : "";
    const isDone = Boolean(raw.isDone);

    return { id, name, priority, tag, deadline, isDone };
}

function loadTasksFromStorage() {
    try {
        const raw = localStorage.getItem(TASKS_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        tasks = parsed.map(normalizeTask).filter(Boolean);
    } catch {
        // Nếu localStorage bị chặn/corrupt data thì bỏ qua
    }
}

function saveTasksToStorage() {
    try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
        // localStorage có thể bị chặn ở một số môi trường
    }
}

function startOfDay(date) {
    const clone = new Date(date);
    clone.setHours(0, 0, 0, 0);
    return clone;
}

function parseViDate(dateString) {
    const str = String(dateString ?? "").trim();
    const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;

    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);

    const d = new Date(year, month - 1, day);
    if (Number.isNaN(d.getTime())) return null;
    return startOfDay(d);
}

// --- TRUY XUẤT DOM ---
const taskListContainer = document.querySelector(".task-board__list");
const taskForm = document.querySelector(".task-form");
const deleteDoneBtn = document.querySelector(".btn--danger"); // Nút "Xóa xong"
const filterChips = document.querySelectorAll(".chip"); // Các nút bộ lọc[cite: 8]

// --- KHỞI TẠO TAGS ---
function initTags() {
    const tagButtons = document.querySelectorAll(".tag-group .tag");

    tagButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            // 1. Xóa trạng thái active cũ
            tagButtons.forEach(b => {
                b.classList.remove("tag--active");
                const icon = b.querySelector(".tag__icon");
                if (icon) icon.remove(); // Xóa dấu tích cũ
            });

            // 2. Kích hoạt tag mới
            btn.classList.add("tag--active");

            // 3. Thêm dấu tích (icon) bằng JS[cite: 15]
            const checkIcon = document.createElement("span");
            checkIcon.className = "tag__icon";
            checkIcon.setAttribute("aria-hidden", "true");
            checkIcon.textContent = "✓";
            btn.prepend(checkIcon);

            // 4. Lưu giá trị tag đang chọn
            selectedTag = btn.textContent.replace("✓", "").trim();
        });
    });
}

// --- HÀM RENDER CHÍNH ---
function renderTasks() {
    const taskListContainer = document.querySelector(".task-board__list");
    if (!taskListContainer) return;

    const filteredTasks = tasks.filter(task =>
        currentFilter === "all" ? true : task.priority === currentFilter
    );

    taskListContainer.innerHTML = filteredTasks.map(task => `
        <article class="task task--${task.priority} ${task.isDone ? 'task--done' : ''}" data-id="${task.id}">
            <label class="task__check">
                <input class="task__checkbox" type="checkbox" ${task.isDone ? 'checked' : ''} onchange="toggleTaskStatus(${task.id})">
                <span class="task__checkbox-ui" aria-hidden="true"></span>
            </label>
            <div class="task__content">
                <div class="task__top">
                    <h3 class="task__title">${task.name}</h3>
                    <span class="badge badge--${task.isDone ? 'muted' : task.priority}">
                        ${task.isDone ? 'Đã xong' : task.priority}
                    </span>
                </div>
                <div class="task__meta">
                    <span class="task__due">Hạn: ${task.deadline}</span>
                    <span class="badge badge--muted">${task.tag}</span> <!-- Hiển thị Nhãn ở đây -->
                </div>
            </div>
        </article>
    `).join('');

    updateProgress();
    updateSummary();
}

// --- KHỞI CHẠY HỆ THỐNG ---
document.addEventListener("DOMContentLoaded", () => {
    loadTasksFromStorage();
    renderPriorityPicker(); // Vẽ dropdown ưu tiên
    initTags(); // Kích hoạt chọn nhãn
    renderTasks();
});

// --- TÍNH NĂNG XỬ LÝ ---

// 1. Thêm task mới
taskForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.querySelector("#task-name");
    const taskName = nameInput.value.trim();

    // 1. Kiểm tra ràng buộc đầu tiên
    if (!taskName) {
        alert("Vui lòng nhập tên công việc!");
        nameInput.focus();
        return; // Dừng lại nếu không có tên
    }

    // 2. Nếu hợp lệ, tiến hành tạo object task mới
    const newTask = {
        id: Date.now(),
        name: taskName,
        priority: getSelectedPriority(),
        tag: selectedTag,
        deadline: document.querySelector("#task-deadline").value,
        isDone: false
    };

    // 3. Cập nhật dữ liệu và giao diện
    tasks.push(newTask);
    saveTasksToStorage();
    renderTasks();

    // 4. Đóng modal và reset form về mặc định
    modal.classList.add("modal--hidden");
    resetFormToDefault();
});

// 2. Xóa các task đã hoàn thành (Delete Done)
deleteDoneBtn?.addEventListener("click", () => {
    tasks = tasks.filter(task => !task.isDone); // Chỉ giữ lại task chưa xong
    saveTasksToStorage();
    renderTasks();
});

// 3. Xử lý bộ lọc (Filter)[cite: 8, 11]
filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
        // Cập nhật UI cho chip
        filterChips.forEach(c => c.classList.remove("chip--active"));
        chip.classList.add("chip--active");

        // Lấy giá trị lọc (ví dụ: chip--high -> high)
        const filterValue = chip.classList.contains("chip--high") ? "high" :
            chip.classList.contains("chip--medium") ? "medium" :
                chip.classList.contains("chip--low") ? "low" : "all";

        currentFilter = filterValue;
        renderTasks();
    });
});

// 4. Thay đổi trạng thái Task (Dùng cho sự kiện onchange)
window.toggleTaskStatus = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.isDone = !task.isDone;
        saveTasksToStorage();
        renderTasks();
    }
};

// 5. Cập nhật thanh tiến độ (UI Progress)[cite: 8, 11]
function updateProgress() {
    const doneCount = tasks.filter(t => t.isDone).length;
    const total = tasks.length;
    const progressPercent = total === 0 ? 0 : (doneCount / total) * 100;

    const progressBar = document.querySelector(".progress__bar");
    const progressValLabel = document.querySelector(".task-board__progress-value");

    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    if (progressValLabel) progressValLabel.textContent = `${doneCount} / ${total} hoàn thành`;
}


// 6. Cập nhật lại hàm reset form sau khi submit để quay về mặc định
function resetFormToDefault() {
    // 1. Reset text input[cite: 20]
    const nameInput = document.querySelector("#task-name");
    if (nameInput) nameInput.value = "";

    // 2. Đưa Deadline/Calendar về ngày hôm nay
    resetDeadlinePickerToToday();

    // 3. Reset Tags về "Học tập" và cập nhật UI[cite: 20]
    selectedTag = "Học tập";
    const tagButtons = document.querySelectorAll(".tag-group .tag");

    tagButtons.forEach((btn, index) => {
        // Xóa sạch trạng thái active và icon cũ[cite: 20]
        btn.classList.remove("tag--active");
        const oldIcon = btn.querySelector(".tag__icon");
        if (oldIcon) oldIcon.remove();

        // Thiết lập lại cho tag đầu tiên[cite: 20]
        if (index === 0) {
            btn.classList.add("tag--active");
            const checkIcon = document.createElement("span");
            checkIcon.className = "tag__icon";
            checkIcon.textContent = "✓";
            btn.prepend(checkIcon);
        }
    });
}

// 7. Cập nhật số task chưa xong và số task quá hạn
function updateSummary() {
    const summaryEl = document.querySelector(".task-board__summary");
    if (!summaryEl) return;

    const today = startOfDay(new Date());

    const unfinishedCount = tasks.filter(t => !t.isDone).length;
    const overdueCount = tasks.filter(t => {
        if (t.isDone) return false;
        const deadlineDate = parseViDate(t.deadline);
        return deadlineDate ? deadlineDate < today : false;
    }).length;

    summaryEl.textContent = `${unfinishedCount} task chưa xong · ${overdueCount} quá hạn`;
}

export { modal };