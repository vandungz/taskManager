// Khởi tạo trạng thái ban đầu là tháng/năm hiện tại
let currentViewDate = new Date();
let selectedDate = null; // Lưu ngày người dùng đã chọn

function startOfDay(date) {
	const clone = new Date(date);
	clone.setHours(0, 0, 0, 0);
	return clone;
}

function renderCalendar() {
	const year = currentViewDate.getFullYear();
	const month = currentViewDate.getMonth(); // 0 - 11

	// 1. Hiển thị tiêu đề Tháng/Năm
	const monthDisplay = document.querySelector(".date-picker__month");
	if (monthDisplay) {
		monthDisplay.textContent = `Tháng ${month + 1}, ${year}`;
	}

	// 2. Tính toán ngày
	const firstDayOfMonth = new Date(year, month, 1).getDay(); // Thứ của ngày 1
	const daysInMonth = new Date(year, month + 1, 0).getDate(); // Tổng số ngày trong tháng
	const today = startOfDay(new Date());

	const dateGrid = document.querySelector(".date-picker__grid");
	if (!dateGrid) return;
	dateGrid.innerHTML = ""; // Xóa lưới cũ

	// 3. Tạo các ngày "muted" của tháng trước (để làm đầy hàng đầu tiên)
	// Giả sử lịch của bạn bắt đầu từ Thứ 2 (T2=1, ..., CN=0)
	const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
	for (let i = 0; i < startOffset; i++) {
		const btn = createDayButton("", "date-picker__day date-picker__day--muted");
		dateGrid.appendChild(btn);
	}

	// 4. Tạo các ngày trong tháng hiện tại
	for (let day = 1; day <= daysInMonth; day++) {
		const dateObj = startOfDay(new Date(year, month, day));
		let className = "date-picker__day";

		// Logic: Làm mờ ngày quá khứ
		if (dateObj < today) {
			className += " date-picker__day--muted";
		}

		// Logic: Đánh dấu ngày đang chọn
		if (selectedDate && dateObj.getTime() === selectedDate.getTime()) {
			className += " date-picker__day--selected";
		}

		const btn = createDayButton(String(day), className);
		dateGrid.appendChild(btn);
	}
}

// Hàm hỗ trợ tạo thẻ button an toàn
function createDayButton(text, className) {
	const btn = document.createElement("button");
	btn.type = "button";
	btn.className = className;
	btn.textContent = text; // Dùng textContent để bảo mật XSS
	return btn;
}

function initCalendar() {
	const datePicker = document.querySelector(".date-picker");
	if (!datePicker) return;

	const toggleBtn = datePicker.querySelector(".input__icon");
	const deadlineInput = datePicker.querySelector("#task-deadline");
	const grid = datePicker.querySelector(".date-picker__grid");
	const today = new Date();

	// Set default value = hôm nay và đồng bộ ngày đang chọn
	if (deadlineInput) {
		selectedDate = startOfDay(today);
		currentViewDate = new Date(today);
		deadlineInput.value = selectedDate.toLocaleDateString("vi-VN");
	}

	// Hàm điều khiển trạng thái đóng/mở
	const toggleCalendar = (isOpen) => {
		if (isOpen) {
			datePicker.classList.add("date-picker--open");
		} else {
			datePicker.classList.remove("date-picker--open");
		}
	};

	// 1. Click icon để Toggle (chặn nổi bọt để không kích hoạt click ở document)
	if (toggleBtn) {
		toggleBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			const isCurrentlyOpen = datePicker.classList.contains("date-picker--open");
			toggleCalendar(!isCurrentlyOpen);
		});
	}

	// Click vào input cũng mở panel
	if (deadlineInput) {
		deadlineInput.addEventListener("click", () => {
			toggleCalendar(true);
		});
	}

	// Nút chuyển tháng
	datePicker.querySelectorAll(".date-picker__nav").forEach((nav, index) => {
		nav.addEventListener("click", () => {
			const step = index === 0 ? -1 : 1; // 0 là Prev, 1 là Next
			// Tránh lỗi tràn tháng khi currentViewDate đang ở ngày 29-31
			currentViewDate.setDate(1);
			currentViewDate.setMonth(currentViewDate.getMonth() + step);
			renderCalendar();
		});
	});

	// 2. Click vào ngày để chọn và TỰ ĐÓNG (Event Delegation)
	if (grid) {
		grid.addEventListener("click", (e) => {
			const btn = e.target.closest(".date-picker__day");
			if (btn && !btn.classList.contains("date-picker__day--muted")) {
				const day = Number.parseInt(btn.textContent, 10);
				if (!Number.isFinite(day)) return;

				selectedDate = startOfDay(
					new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day)
				);

				// Cập nhật giá trị vào Input để Submit Form
				if (deadlineInput) {
					deadlineInput.value = selectedDate.toLocaleDateString("vi-VN");
				}

				renderCalendar(); // Vẽ lại để cập nhật class --selected
				toggleCalendar(false); // Đóng panel sau khi chọn ngày
			}
		});
	}

	// 3. Click OUTSIDE để đóng panel
	document.addEventListener("click", (e) => {
		if (!datePicker.contains(e.target)) {
			toggleCalendar(false);
		}
	});

	// Chạy lần đầu tiên
	renderCalendar();
}

export function resetDeadlinePickerToToday() {
	const datePicker = document.querySelector(".date-picker");
	const deadlineInput = document.querySelector("#task-deadline");
	const today = new Date();

	currentViewDate = new Date(today);
	selectedDate = startOfDay(today);

	if (deadlineInput) {
		deadlineInput.value = selectedDate.toLocaleDateString("vi-VN");
	}

	if (datePicker) {
		datePicker.classList.remove("date-picker--open");
	}

	renderCalendar();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initCalendar);
} else {
	initCalendar();
}



