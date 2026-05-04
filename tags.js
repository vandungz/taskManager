/**
 * tags.js — Quản lý UI chọn nhãn (tag) trong form
 *
 * Tách ra vì logic tag (activate/deactivate, lưu trạng thái) xuất hiện ở
 * nhiều nơi: initTags, resetFormToDefault, openEditModal.
 * Gom vào một module giúp tránh lặp code và dễ bảo trì.
 */

// Trạng thái tag đang được chọn — module-level state
let selectedTag = "Học tập";

/**
 * Trả về tag hiện tại đang được chọn.
 * Dùng getter function thay vì export biến trực tiếp để kiểm soát quyền đọc.
 *
 * @returns {string}
 */
export const getSelectedTag = () => selectedTag;

/**
 * Áp dụng trạng thái active cho một tag button cụ thể.
 * Tách hàm nhỏ này để tái sử dụng trong cả initTags và setActiveTag.
 *
 * DOM pattern: thêm/xóa class để điều khiển giao diện thay vì gán style trực tiếp.
 * Lợi ích: CSS chịu trách nhiệm về giao diện, JS chỉ quản lý trạng thái.
 *
 * @param {NodeList} allButtons — tất cả tag button
 * @param {HTMLButtonElement} activeBtn — button cần được kích hoạt
 */
function applyActiveTag(allButtons, activeBtn) {
	// Bước 1: Xóa trạng thái active của TẤT CẢ button
	allButtons.forEach((btn) => {
		btn.classList.remove("tag--active");

		// Xóa icon dấu tích nếu có
		// querySelector tìm phần tử con đầu tiên khớp selector
		const icon = btn.querySelector(".tag__icon");
		if (icon) icon.remove();
	});

	// Bước 2: Kích hoạt button được chọn
	activeBtn.classList.add("tag--active");

	// Tạo icon dấu tích bằng JS thay vì hardcode trong HTML
	// để icon xuất hiện/biến mất theo trạng thái
	const checkIcon = document.createElement("span");
	checkIcon.className = "tag__icon";
	checkIcon.setAttribute("aria-hidden", "true");
	checkIcon.textContent = "✓";

	// prepend() chèn vào VỊ TRÍ ĐẦU TIÊN bên trong button (trước text)
	activeBtn.prepend(checkIcon);
}

/**
 * Khởi tạo sự kiện click cho tất cả tag button.
 * Gọi một lần khi trang load.
 *
 * Event Delegation pattern không dùng ở đây vì số button ít và cố định.
 * Nếu tag có thể thêm/xóa động thì nên dùng delegation trên container.
 */
export function initTags() {
	// querySelectorAll trả về NodeList (không phải Array),
	// nhưng NodeList cũng có .forEach()
	const tagButtons = document.querySelectorAll(".tag-group .tag");

	tagButtons.forEach((btn) => {
		btn.addEventListener("click", () => {
			applyActiveTag(tagButtons, btn);

			// Lấy text của button, bỏ ký tự "✓" nếu có (do icon đã prepend)
			// .trim() xóa khoảng trắng đầu/cuối
			selectedTag = btn.textContent.replace("✓", "").trim();
		});
	});
}

/**
 * Đặt tag active theo tên (dùng khi mở form edit hoặc reset form).
 * So sánh text của từng button để tìm button cần activate.
 *
 * @param {string} tagName — tên tag cần set active ("Học tập", "Công việc", ...)
 */
export function setActiveTag(tagName) {
	selectedTag = tagName;

	const tagButtons = document.querySelectorAll(".tag-group .tag");

	// Tìm button có text khớp với tagName
	const targetBtn = Array.from(tagButtons).find(
		(btn) => btn.textContent.replace("✓", "").trim() === tagName
	);

	// Nếu tìm thấy thì activate, không tìm thấy thì bỏ qua
	if (targetBtn) applyActiveTag(tagButtons, targetBtn);
}

/**
 * Reset tag về mặc định "Học tập" (dùng khi đóng/reset form).
 * Gọi setActiveTag để tái sử dụng logic, tránh lặp code.
 */
export function resetTag() {
	setActiveTag("Học tập");
}