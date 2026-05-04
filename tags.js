let selectedTag = "Học tập";
export const getSelectedTag = () => selectedTag;

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

export function resetTag() {
	setActiveTag("Học tập");
}