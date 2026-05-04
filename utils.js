export function startOfDay(date) {
	// Tạo bản sao để không làm thay đổi object gốc (immutability)
	const clone = new Date(date);
	clone.setHours(0, 0, 0, 0);
	return clone;
}

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
export function createElement(tag, { className = "", text = "", attrs = {} } = {}) {
	const el = document.createElement(tag);
	if (className) el.className = className;

	if (text) el.textContent = text;

	// Object.entries() trả về mảng [key, value] của object
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	return el;
}