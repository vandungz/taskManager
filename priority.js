import { createElement } from "./utils.js";

// --- CONFIG ---
const PRIORITY_OPTIONS = [
	{ id: "high",   label: "Cao" },
	{ id: "medium", label: "Trung bình" },
	{ id: "low",    label: "Thấp" },
];

// --- MODULE STATE ---
let selectedPriority = "medium";
let cleanupDocumentListeners = null;

// --- GETTERS / SETTERS ---
export const getSelectedPriority = () => selectedPriority;

export function setSelectedPriority(id) {
	if (PRIORITY_OPTIONS.some((o) => o.id === id)) {
		selectedPriority = id;
	}
}

// --- HELPERS ---
function getToneClass(id) {
	const map = { high: "select--high", medium: "select--medium", low: "select--low" };
	return map[id] ?? "";
}

function closeMenu(selectEl, triggerEl) {
	selectEl.classList.remove("select--open");
	// aria-expanded: thuộc tính ARIA thông báo cho screen reader biết trạng thái dropdown
	triggerEl.setAttribute("aria-expanded", "false");
}

function applySelection({ selectEl, triggerValueEl, hiddenInputEl, optionButtons, newPriority }) {
	selectedPriority = newPriority;

	// Cập nhật class tô màu trên wrapper
	selectEl.classList.remove("select--high", "select--medium", "select--low");
	const tone = getToneClass(selectedPriority);
	if (tone) selectEl.classList.add(tone);

	// Cập nhật text hiển thị
	const option = PRIORITY_OPTIONS.find((o) => o.id === selectedPriority);
	triggerValueEl.textContent = option?.label ?? "";

	// Đồng bộ giá trị vào input ẩn (để form submit lấy được)
	hiddenInputEl.value = selectedPriority;

	// Cập nhật trạng thái active + ARIA cho từng option button
	optionButtons.forEach((btn) => {
		const isActive = btn.dataset.priorityId === selectedPriority;
		btn.classList.toggle("select__option--active", isActive);
		btn.setAttribute("aria-selected", String(isActive));
	});
}

// --- BUILD DOM ---
function buildTrigger() {
	const triggerEl = createElement("button", {
		className: "select__trigger",
		attrs: {
			id: "task-priority",
			type: "button",
			"aria-haspopup": "listbox",
			"aria-expanded": "false",
			"aria-controls": "priority-menu",
		},
	});

	// Chấm màu
	triggerEl.appendChild(createElement("span", {
		className: "select__dot",
		attrs: { "aria-hidden": "true" },
	}));

	// Text giá trị
	const valueEl = createElement("span", { className: "select__value" });
	triggerEl.appendChild(valueEl);

	// Icon mũi tên (unicode ▾)
	triggerEl.appendChild(createElement("span", {
		className: "select__chevron",
		text: "▾",
		attrs: { "aria-hidden": "true" },
	}));

	return { triggerEl, valueEl };
}

function buildOptionButtons(onSelect) {
	return PRIORITY_OPTIONS.map((option) => {
		const btn = createElement("button", {
			className: `select__option select__option--${option.id}`,
			attrs: {
				type: "button",
				role: "option",
				"aria-selected": String(option.id === selectedPriority),
				"data-priority-id": option.id,
			},
		});

		if (option.id === selectedPriority) {
			btn.classList.add("select__option--active");
		}

		// Chấm màu
		btn.appendChild(createElement("span", {
			className: "select__dot",
			attrs: { "aria-hidden": "true" },
		}));

		// Text label (thêm bằng TextNode để không ghi đè dot element)
		btn.appendChild(document.createTextNode(option.label));

		btn.addEventListener("click", () => onSelect(option.id));

		return btn;
	});
}

// --- MAIN RENDER ---
export function renderPriorityPicker() {
	const container = document.querySelector("#priority-picker-container");
	if (!container) return;

	// Dọn dẹp document listeners từ lần render trước
	if (typeof cleanupDocumentListeners === "function") {
		cleanupDocumentListeners();
		cleanupDocumentListeners = null;
	}

	// Xóa nội dung cũ
	container.innerHTML = "";

	// --- Tạo wrapper ---
	const selectEl = createElement("div", {
		className: `select ${getToneClass(selectedPriority)}`,
		attrs: { "aria-label": "Mức độ ưu tiên" },
	});

	// --- Trigger ---
	const { triggerEl, valueEl } = buildTrigger();

	// --- Hidden input ---
	const hiddenInputEl = createElement("input", {
		className: "select__native",
		attrs: {
			id: "task-priority-value",
			name: "priority",
			type: "hidden",
		},
	});

	// --- Menu ---
	const menuEl = createElement("div", {
		className: "select__menu",
		attrs: {
			id: "priority-menu",
			role: "listbox",
			"aria-label": "Chọn ưu tiên",
		},
	});

	// Tạo option buttons và kết nối với applySelection
	const optionButtons = buildOptionButtons((newPriority) => {
		applySelection({ selectEl, triggerValueEl: valueEl, hiddenInputEl, optionButtons, newPriority });
		closeMenu(selectEl, triggerEl);
	});

	optionButtons.forEach((btn) => menuEl.appendChild(btn));

	// Render giá trị ban đầu lên trigger
	applySelection({ selectEl, triggerValueEl: valueEl, hiddenInputEl, optionButtons, newPriority: selectedPriority });

	// Toggle menu khi click trigger
	triggerEl.addEventListener("click", (e) => {
		e.preventDefault();
		const willOpen = !selectEl.classList.contains("select--open");
		selectEl.classList.toggle("select--open", willOpen);
		triggerEl.setAttribute("aria-expanded", String(willOpen));
	});

	selectEl.append(triggerEl, hiddenInputEl, menuEl);
	container.appendChild(selectEl);

	// --- Document-level listeners (đóng khi click ngoài / nhấn Esc) ---
	const onOutsideClick = (e) => {
		if (!selectEl.contains(e.target)) closeMenu(selectEl, triggerEl);
	};
	const onEscKey = (e) => {
		if (e.key === "Escape") closeMenu(selectEl, triggerEl);
	};

	document.addEventListener("click", onOutsideClick);
	document.addEventListener("keydown", onEscKey);

	// Lưu hàm cleanup để gọi trước lần render tiếp theo
	cleanupDocumentListeners = () => {
		document.removeEventListener("click", onOutsideClick);
		document.removeEventListener("keydown", onEscKey);
	};
}