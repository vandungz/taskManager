// Tham chiếu đến các phần tử DOM — lấy một lần, dùng nhiều lần
// Lý do: document.querySelector() tìm kiếm trong toàn bộ DOM (tốn kém nếu gọi nhiều lần)
const modal = document.querySelector(".modal");
const modalBackdrop = document.querySelector(".modal__backdrop");
const modalTitle = document.querySelector("#add-task-title");

export function openModal(title = "Thêm task mới") {
	if (modalTitle) modalTitle.textContent = title;
	modal?.classList.remove("modal--hidden");
}

export function closeModal(onClose) {
	if (modalTitle) modalTitle.textContent = "Thêm task mới";
	modal?.classList.add("modal--hidden");

	// Optional callback — gọi hàm nếu được truyền vào
	// Dùng typeof để kiểm tra an toàn trước khi gọi
	if (typeof onClose === "function") onClose();
}

export function initModalBackdropClose(onClose) {
	window.addEventListener("click", (e) => {
		// e.target: phần tử thực sự được click (có thể là phần tử con)
		// So sánh bằng === vì chúng ta muốn đúng phần tử backdrop, không phải con của nó
		if (e.target === modalBackdrop) {
			closeModal(onClose);
		}
	});
}