/**
 * utils.js — Các hàm tiện ích dùng chung (pure functions, không phụ thuộc DOM)
 *
 * Pure function: hàm chỉ nhận input → trả output, không đọc/ghi biến ngoài.
 * Lợi ích: dễ test, dễ tái sử dụng ở bất kỳ file nào.
 */

// --- DATE UTILITIES ---

/**
 * Chuẩn hóa một Date về 00:00:00 của ngày đó.
 * Mục đích: khi so sánh ngày (không quan tâm giờ), cần xóa phần giờ/phút/giây
 * để tránh sai lệch do múi giờ hay thời điểm trong ngày.
 *
 * @param {Date} date
 * @returns {Date}
 */
export function startOfDay(date) {
	// Tạo bản sao để không làm thay đổi object gốc (immutability)
	const clone = new Date(date);
	clone.setHours(0, 0, 0, 0);
	return clone;
}

/**
 * Chuyển chuỗi ngày định dạng "dd/mm/yyyy" thành đối tượng Date.
 * Trả về null nếu chuỗi không hợp lệ.
 *
 * Regex /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/ giải thích:
 *   ^          — bắt đầu chuỗi
 *   (\d{1,2})  — nhóm 1 hoặc 2 chữ số (ngày)
 *   \/         — dấu / (phải escape vì / có nghĩa đặc biệt trong regex)
 *   (\d{1,2})  — nhóm tháng
 *   \/
 *   (\d{4})    — nhóm 4 chữ số (năm)
 *   $          — kết thúc chuỗi
 *
 * @param {string} dateString — "10/05/2025"
 * @returns {Date|null}
 */
export function parseViDate(dateString) {
	const str = String(dateString ?? "").trim();
	const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!m) return null;

	// m[0] = toàn bộ chuỗi khớp, m[1..3] = các nhóm capture
	const day = Number(m[1]);
	const month = Number(m[2]);
	const year = Number(m[3]);

	// new Date(year, monthIndex, day) — monthIndex bắt đầu từ 0
	const d = new Date(year, month - 1, day);

	// Kiểm tra ngày hợp lệ (vd: 30/02 sẽ bị JS tự chuyển → invalid)
	if (Number.isNaN(d.getTime())) return null;
	return startOfDay(d);
}

/**
 * Tính số ngày còn lại đến deadline.
 * Trả về object { label, type } để render UI, hoặc null nếu không có deadline.
 *
 * @param {string} deadlineString
 * @returns {{ label: string, type: string }|null}
 */
export function getDaysRemaining(deadlineString) {
	const deadline = parseViDate(deadlineString);
	if (!deadline) return null;

	const today = startOfDay(new Date());

	// Tính khoảng cách ngày: chuyển ms → ngày, làm tròn để tránh lỗi DST
	const diff = Math.round((deadline - today) / (1000 * 60 * 60 * 24));

	if (diff < 0) return { label: "Đã quá hạn", type: "overdue" };
	if (diff === 0) return { label: "Hôm nay", type: "today" };
	if (diff === 1) return { label: "Còn 1 ngày", type: "soon" };
	return { label: `Còn ${diff} ngày`, type: "normal" };
}

// --- DOM UTILITIES ---

/**
 * Tạo một phần tử DOM với className và textContent.
 * Hàm factory nhỏ này giúp tránh lặp lại document.createElement + gán thuộc tính.
 *
 * @param {string} tag — tên thẻ HTML ("div", "button", "span", ...)
 * @param {object} options
 * @param {string} [options.className]
 * @param {string} [options.text]
 * @param {Record<string, string>} [options.attrs] — các thuộc tính bổ sung
 * @returns {HTMLElement}
 */
export function createElement(tag, { className = "", text = "", attrs = {} } = {}) {
	const el = document.createElement(tag);
	if (className) el.className = className;

	// Dùng textContent thay innerHTML để tránh XSS
	// XSS (Cross-Site Scripting): tấn công bằng cách chèn code HTML/JS vào trang
	if (text) el.textContent = text;

	// Object.entries() trả về mảng [key, value] của object
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	return el;
}