/**
 * modal.js — Quản lý vòng đời (open/close) của modal dialog
 *
 * Tách ra vì logic mở/đóng modal bị lặp lại ở nhiều nơi trong script.js gốc:
 *   - nút "Thêm task", nút "Huỷ", click backdrop, sau khi submit...
 * Một hàm openModal/closeModal dùng chung giải quyết vấn đề này.
 */

// Tham chiếu đến các phần tử DOM — lấy một lần, dùng nhiều lần
// Lý do: document.querySelector() tìm kiếm trong toàn bộ DOM (tốn kém nếu gọi nhiều lần)
const modal = document.querySelector(".modal");
const modalBackdrop = document.querySelector(".modal__backdrop");
const modalTitle = document.querySelector("#add-task-title");

/**
 * Mở modal và cập nhật tiêu đề.
 *
 * classList.remove() xóa class khỏi element — ở đây xóa class ẩn để hiện modal.
 * CSS class "modal--hidden" thường có display:none hoặc visibility:hidden.
 *
 * @param {string} [title="Thêm task mới"]
 */
export function openModal(title = "Thêm task mới") {
	if (modalTitle) modalTitle.textContent = title;
	modal?.classList.remove("modal--hidden");
}

/**
 * Đóng modal và reset tiêu đề về mặc định.
 *
 * @param {Function} [onClose] — callback tùy chọn, chạy sau khi đóng
 *                              (ví dụ: resetForm, clear state...)
 */
export function closeModal(onClose) {
	if (modalTitle) modalTitle.textContent = "Thêm task mới";
	modal?.classList.add("modal--hidden");

	// Optional callback — gọi hàm nếu được truyền vào
	// Dùng typeof để kiểm tra an toàn trước khi gọi
	if (typeof onClose === "function") onClose();
}

/**
 * Gắn sự kiện đóng modal khi click vào backdrop (vùng tối phía sau dialog).
 * Gọi một lần khi khởi tạo app.
 *
 * Pattern: tách "gắn sự kiện" (initX) ra khỏi "xử lý sự kiện" (handler)
 * để dễ kiểm soát khi nào sự kiện được gắn.
 *
 * @param {Function} onClose — callback khi đóng
 */
export function initModalBackdropClose(onClose) {
	// window.addEventListener vs document.addEventListener:
	// - window: nhận sự kiện từ toàn bộ cửa sổ trình duyệt (kể cả scroll, resize)
	// - document: chỉ nhận sự kiện từ nội dung trang HTML
	// Click event nên dùng window hoặc document đều được.
	window.addEventListener("click", (e) => {
		// e.target: phần tử thực sự được click (có thể là phần tử con)
		// So sánh bằng === vì chúng ta muốn đúng phần tử backdrop, không phải con của nó
		if (e.target === modalBackdrop) {
			closeModal(onClose);
		}
	});
}