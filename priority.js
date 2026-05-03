// Danh sách cấu hình các mức độ ưu tiên (giữ đúng UI dropdown như thiết kế cũ)
const priorityOptions = [
	{ id: "high", label: "Cao" },
	{ id: "medium", label: "Trung bình" },
	{ id: "low", label: "Thấp" },
];

let selectedPriority = "medium"; // Trạng thái mặc định

let removeOutsideHandlers = null;

function getOptionLabel(priorityId) {
	return priorityOptions.find((o) => o.id === priorityId)?.label ?? "";
}

function getSelectToneClass(priorityId) {
	if (priorityId === "high") return "select--high";
	if (priorityId === "medium") return "select--medium";
	if (priorityId === "low") return "select--low";
	return "";
}

function closeMenu(selectEl, triggerEl) {
	selectEl.classList.remove("select--open");
	triggerEl.setAttribute("aria-expanded", "false");
}

function toggleMenu(selectEl, triggerEl) {
	const willOpen = !selectEl.classList.contains("select--open");
	if (willOpen) {
		selectEl.classList.add("select--open");
		triggerEl.setAttribute("aria-expanded", "true");
	} else {
		closeMenu(selectEl, triggerEl);
	}
}

function applySelection({
	selectEl,
	triggerValueEl,
	hiddenInputEl,
	optionButtons,
	newPriority,
}) {
	selectedPriority = newPriority;

	// Update wrapper tone
	selectEl.classList.remove("select--high", "select--medium", "select--low");
	const toneClass = getSelectToneClass(selectedPriority);
	if (toneClass) selectEl.classList.add(toneClass);

	// Update trigger label
	triggerValueEl.textContent = getOptionLabel(selectedPriority);

	// Keep hidden input in sync (optional but useful)
	hiddenInputEl.value = selectedPriority;

	// Update active state in menu
	optionButtons.forEach((btn) => {
		const isActive = btn.dataset.priorityId === selectedPriority;
		btn.classList.toggle("select__option--active", isActive);
		btn.setAttribute("aria-selected", isActive ? "true" : "false");
	});
}

export function renderPriorityPicker() {
	const container = document.querySelector("#priority-picker-container");
	if (!container) return;

	// Cleanup previous global handlers if re-rendered
	if (typeof removeOutsideHandlers === "function") {
		removeOutsideHandlers();
		removeOutsideHandlers = null;
	}

	container.innerHTML = "";

	const selectEl = document.createElement("div");
	selectEl.className = `select ${getSelectToneClass(selectedPriority)}`;
	selectEl.setAttribute("aria-label", "Mức độ ưu tiên");

	const triggerEl = document.createElement("button");
	triggerEl.className = "select__trigger";
	triggerEl.id = "task-priority";
	triggerEl.type = "button";
	triggerEl.setAttribute("aria-haspopup", "listbox");
	triggerEl.setAttribute("aria-expanded", "false");
	triggerEl.setAttribute("aria-controls", "priority-menu");

	const dotEl = document.createElement("span");
	dotEl.className = "select__dot";
	dotEl.setAttribute("aria-hidden", "true");

	const valueEl = document.createElement("span");
	valueEl.className = "select__value";
	valueEl.textContent = getOptionLabel(selectedPriority);

	const chevronEl = document.createElement("span");
	chevronEl.className = "select__chevron";
	chevronEl.setAttribute("aria-hidden", "true");
	chevronEl.textContent = "▾";

	triggerEl.append(dotEl, valueEl, chevronEl);

	const hiddenInputEl = document.createElement("input");
	hiddenInputEl.className = "select__native";
	hiddenInputEl.id = "task-priority-value";
	hiddenInputEl.name = "priority";
	hiddenInputEl.type = "hidden";
	hiddenInputEl.value = selectedPriority;

	const menuEl = document.createElement("div");
	menuEl.className = "select__menu";
	menuEl.id = "priority-menu";
	menuEl.setAttribute("role", "listbox");
	menuEl.setAttribute("aria-label", "Chọn ưu tiên");

	const optionButtons = priorityOptions.map((option) => {
		const optionBtn = document.createElement("button");
		optionBtn.type = "button";
		optionBtn.className = `select__option select__option--${option.id}`;
		optionBtn.setAttribute("role", "option");
		optionBtn.dataset.priorityId = option.id;
		optionBtn.setAttribute("aria-selected", option.id === selectedPriority ? "true" : "false");
		if (option.id === selectedPriority) {
			optionBtn.classList.add("select__option--active");
		}

		const optionDot = document.createElement("span");
		optionDot.className = "select__dot";
		optionDot.setAttribute("aria-hidden", "true");

		optionBtn.append(optionDot, document.createTextNode(option.label));

		optionBtn.addEventListener("click", () => {
			applySelection({
				selectEl,
				triggerValueEl: valueEl,
				hiddenInputEl,
				optionButtons,
				newPriority: option.id,
			});
			closeMenu(selectEl, triggerEl);
			console.log("Độ ưu tiên đã chọn:", selectedPriority);
		});

		return optionBtn;
	});

	optionButtons.forEach((btn) => menuEl.appendChild(btn));

	triggerEl.addEventListener("click", (e) => {
		e.preventDefault();
		toggleMenu(selectEl, triggerEl);
	});

	selectEl.append(triggerEl, hiddenInputEl, menuEl);
	container.appendChild(selectEl);

	const onDocumentClick = (e) => {
		if (!selectEl.contains(e.target)) {
			closeMenu(selectEl, triggerEl);
		}
	};

	const onDocumentKeydown = (e) => {
		if (e.key === "Escape") {
			closeMenu(selectEl, triggerEl);
		}
	};

	document.addEventListener("click", onDocumentClick);
	document.addEventListener("keydown", onDocumentKeydown);

	removeOutsideHandlers = () => {
		document.removeEventListener("click", onDocumentClick);
		document.removeEventListener("keydown", onDocumentKeydown);
	};
}

// Hàm để lấy giá trị hiện tại khi submit form
export const getSelectedPriority = () => selectedPriority;
