/**
 * calendar.js — Date Picker tùy chỉnh
 *
 * Chức năng:
 *   - Hiển thị lịch theo tháng/năm
 *   - Chọn ngày → ghi vào input text
 *   - Chuyển tháng (prev/next)
 *   - Đóng khi click outside
 *
 * Dependency: startOfDay từ utils.js
 */

import { startOfDay } from "./utils.js";

// --- MODULE STATE ---
// Các biến này chỉ tồn tại trong phạm vi module (không phải global),
// nhờ cơ chế Module Scope của ES Modules.

let currentViewDate = new Date(); // Tháng/năm đang hiển thị trên lịch
let selectedDate = null;          // Ngày người dùng đã chọn

// --- RENDER ---

/**
 * Vẽ lại lưới ngày dựa trên currentViewDate và selectedDate.
 * Gọi lại mỗi khi chuyển tháng hoặc chọn ngày.
 *
 * Thuật toán điền lịch:
 *   1. Tính thứ của ngày 1 trong tháng (firstDayOfMonth)
 *   2. Điền ô trống cho các ngày của tháng trước
 *   3. Điền các ngày của tháng hiện tại với class phù hợp
 */
function renderCalendar() {
	const year = currentViewDate.getFullYear();
	const month = currentViewDate.getMonth(); // 0–11

	// Cập nhật tiêu đề tháng/năm
	const monthDisplay = document.querySelector(".date-picker__month");
	if (monthDisplay) {
		monthDisplay.textContent = `Tháng ${month + 1}, ${year}`;
	}

	// new Date(year, month, 0).getDate() = tổng số ngày của tháng trước
	// → dùng để tính ngày của tháng hiện tại
	const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=CN, 1=T2...
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const today = startOfDay(new Date());

	const dateGrid = document.querySelector(".date-picker__grid");
	if (!dateGrid) return;

	// innerHTML = "" xóa toàn bộ nội dung cũ trong phần tử
	dateGrid.innerHTML = "";

	// DocumentFragment: tạo một "khung chứa ảo" để gom nhiều DOM node lại,
	// rồi append một lần vào DOM thật → giảm số lần "reflow" của trình duyệt
	const fragment = document.createDocumentFragment();

	// Lịch bắt đầu từ Thứ 2 (index 1), CN = 0 → cần offset 6
	// Ví dụ: ngày 1 là CN (0) → offset = 6 (cần 6 ô trống T2→T7)
	const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

	// Điền ô trống (ngày tháng trước)
	for (let i = 0; i < startOffset; i++) {
		fragment.appendChild(createDayButton("", "date-picker__day date-picker__day--muted"));
	}

	// Điền ngày của tháng hiện tại
	for (let day = 1; day <= daysInMonth; day++) {
		const dateObj = startOfDay(new Date(year, month, day));
		const isPast = dateObj < today;
		const isSelected = selectedDate && dateObj.getTime() === selectedDate.getTime();

		// Xây dựng className theo trạng thái của ngày
		let className = "date-picker__day";
		if (isPast) className += " date-picker__day--muted";
		if (isSelected) className += " date-picker__day--selected";

		fragment.appendChild(createDayButton(String(day), className));
	}

	dateGrid.appendChild(fragment);
}

/**
 * Tạo một button ngày trong lịch.
 * Hàm factory nhỏ: tách ra để renderCalendar() dễ đọc hơn.
 *
 * Dùng textContent thay innerHTML để tránh XSS và nhanh hơn.
 *
 * @param {string} text
 * @param {string} className
 * @returns {HTMLButtonElement}
 */
function createDayButton(text, className) {
	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = className;
	btn.textContent = text;
	return btn;
}

// --- TOGGLE ---

/**
 * Mở hoặc đóng panel lịch.
 *
 * @param {HTMLElement} datePicker
 * @param {boolean} isOpen
 */
function toggleCalendar(datePicker, isOpen) {
	// classList.toggle(class, force): thêm nếu force=true, xóa nếu force=false
	// Tương đương với if/else nhưng ngắn hơn
	datePicker.classList.toggle("date-picker--open", isOpen);
}

// --- INIT ---

/**
 * Khởi tạo toàn bộ Date Picker: gắn sự kiện, set ngày mặc định, render lần đầu.
 * Gọi một lần khi DOM sẵn sàng.
 *
 * Các sự kiện được gắn:
 *   - Click icon/input → toggle panel
 *   - Click nav prev/next → chuyển tháng
 *   - Click ngày (delegation) → chọn ngày, đóng panel
 *   - Click outside (document) → đóng panel
 */
function initCalendar() {
	const datePicker = document.querySelector(".date-picker");
	if (!datePicker) return;

	const toggleBtn = datePicker.querySelector(".input__icon");
	const deadlineInput = datePicker.querySelector("#task-deadline");
	const grid = datePicker.querySelector(".date-picker__grid");
	const today = new Date();

	// Set ngày mặc định là hôm nay
	if (deadlineInput) {
		selectedDate = startOfDay(today);
		currentViewDate = new Date(today);
		deadlineInput.value = selectedDate.toLocaleDateString("vi-VN");
	}

	// Icon lịch: toggle panel khi click
	// stopPropagation() ngăn sự kiện nổi bọt lên document
	// (nếu không, click sẽ nổi lên handler "click outside" và đóng ngay lập tức)
	if (toggleBtn) {
		toggleBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			toggleCalendar(datePicker, !datePicker.classList.contains("date-picker--open"));
		});
	}

	// Input text: click vào cũng mở panel
	if (deadlineInput) {
		deadlineInput.addEventListener("click", () => toggleCalendar(datePicker, true));
	}

	// Nút chuyển tháng: querySelectorAll trả về NodeList theo thứ tự xuất hiện trong HTML
	// index 0 = nút trước, index 1 = nút sau
	datePicker.querySelectorAll(".date-picker__nav").forEach((nav, index) => {
		nav.addEventListener("click", () => {
			// setDate(1) trước khi setMonth() để tránh tràn tháng
			// Ví dụ: 31/01 + 1 tháng → 31/02 → JS tự chuyển sang 03/03 (sai!)
			currentViewDate.setDate(1);
			currentViewDate.setMonth(currentViewDate.getMonth() + (index === 0 ? -1 : 1));
			renderCalendar();
		});
	});

	// Event Delegation: gắn một listener trên CONTAINER thay vì từng button con.
	// Lý do: các button ngày được tạo động (innerHTML = ""), nên không thể gắn
	// listener trực tiếp lên chúng — chúng bị xóa và tạo lại mỗi khi renderCalendar().
	if (grid) {
		grid.addEventListener("click", (e) => {
			// closest() đi ngược cây DOM từ e.target lên, tìm phần tử khớp selector
			const btn = e.target.closest(".date-picker__day");
			if (!btn || btn.classList.contains("date-picker__day--muted")) return;

			const day = Number.parseInt(btn.textContent, 10);
			if (!Number.isFinite(day)) return;

			selectedDate = startOfDay(
				new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day)
			);

			if (deadlineInput) {
				deadlineInput.value = selectedDate.toLocaleDateString("vi-VN");
			}

			renderCalendar();
			toggleCalendar(datePicker, false);
		});
	}

	// Đóng panel khi click ra ngoài
	// Lưu ý: document.addEventListener được gắn mỗi lần initCalendar() chạy.
	// Vì initCalendar chỉ chạy một lần, không cần cleanup.
	document.addEventListener("click", (e) => {
		if (!datePicker.contains(e.target)) {
			toggleCalendar(datePicker, false);
		}
	});

	renderCalendar();
}

// --- PUBLIC API ---

/**
 * Set ngày cụ thể cho date picker từ bên ngoài (dùng khi mở form edit).
 *
 * @param {string} dateString — "dd/mm/yyyy"
 */
export function setDeadlinePickerDate(dateString) {
	const m = String(dateString).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!m) return;

	const date = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
	if (Number.isNaN(date.getTime())) return;

	selectedDate = startOfDay(date);
	currentViewDate = new Date(date);

	const deadlineInput = document.querySelector("#task-deadline");
	if (deadlineInput) {
		deadlineInput.value = selectedDate.toLocaleDateString("vi-VN");
	}

	// Đóng panel nếu đang mở
	const datePicker = document.querySelector(".date-picker");
	if (datePicker) datePicker.classList.remove("date-picker--open");

	renderCalendar();
}

/**
 * Reset date picker về ngày hôm nay (dùng khi reset/đóng form).
 */
export function resetDeadlinePickerToToday() {
	const today = new Date();
	currentViewDate = new Date(today);
	selectedDate = startOfDay(today);

	const deadlineInput = document.querySelector("#task-deadline");
	if (deadlineInput) {
		deadlineInput.value = selectedDate.toLocaleDateString("vi-VN");
	}

	const datePicker = document.querySelector(".date-picker");
	if (datePicker) datePicker.classList.remove("date-picker--open");

	renderCalendar();
}

// --- BOOTSTRAP ---
// Kiểm tra trạng thái DOM trước khi khởi tạo.
// "loading": HTML chưa parse xong → chờ DOMContentLoaded
// "interactive"/"complete": DOM đã sẵn sàng → gọi ngay
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initCalendar);
} else {
	initCalendar();
}