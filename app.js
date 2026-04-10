// ===== CẤU HÌNH CHUNG =====
const COMPUTERS = 60;

const GRADE_META = [
    { id: 6, name: 'Khối 6', inputId: 'studentsGrade6', cssClass: 'grade-6', dayClass: 'day-1', color: 'var(--grade6)', colorLight: 'var(--grade6-light)' },
    { id: 7, name: 'Khối 7', inputId: 'studentsGrade7', cssClass: 'grade-7', dayClass: 'day-2', color: 'var(--grade7)', colorLight: 'var(--grade7-light)' },
    { id: 8, name: 'Khối 8', inputId: 'studentsGrade8', cssClass: 'grade-8', dayClass: 'day-3', color: 'var(--grade8)', colorLight: 'var(--grade8-light)' },
];

let skipDates = [];

// ===== UTILS =====
function formatISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDateVN(d) {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[d.getDay()] + ', ' + String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

function formatDateShort(d) {
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

function pad(n) { return String(n).padStart(2, '0'); }
function timeStr(h, m) { return pad(h) + ':' + pad(m); }

function parseTimeInput(id) {
    const val = document.getElementById(id).value;
    const [h, m] = val.split(':').map(Number);
    return { h, m };
}

function getInt(id) { return parseInt(document.getElementById(id).value) || 0; }

// ===== ĐỌC CẤU HÌNH TỪ FORM =====
function readConfig() {
    const morningStart = parseTimeInput('morningStart');
    const afternoonStart = parseTimeInput('afternoonStart');
    const morningMax = getInt('morningMax');
    const afternoonMax = getInt('afternoonMax');
    const examMin = getInt('examDuration');
    const breakMin = getInt('breakMinutes');
    const maxPerDay = morningMax + afternoonMax;

    const grades = GRADE_META.map(g => ({
        ...g,
        students: getInt(g.inputId)
    }));
    const totalStudents = grades.reduce((s, g) => s + g.students, 0);

    return { morningStart, afternoonStart, morningMax, afternoonMax, maxPerDay, examMin, breakMin, grades, totalStudents };
}

// ===== SKIP DATES =====
function addSkipDate() {
    const input = document.getElementById('skipDateInput');
    if (!input.value) return;
    if (!skipDates.includes(input.value)) {
        skipDates.push(input.value);
        skipDates.sort();
        renderSkipDates();
    }
    input.value = '';
}

function removeSkipDate(val) {
    skipDates = skipDates.filter(d => d !== val);
    renderSkipDates();
}

function renderSkipDates() {
    const container = document.getElementById('skipDatesList');
    if (skipDates.length === 0) {
        container.innerHTML = '<span style="font-size:12px;color:var(--gray-500);">Chưa có ngày nghỉ nào được thêm</span>';
        return;
    }
    container.innerHTML = skipDates.map(d => {
        const dt = new Date(d + 'T00:00:00');
        return `<span class="skip-tag">🚫 ${formatDateVN(dt)} <span class="remove-skip" onclick="removeSkipDate('${d}')">✕</span></span>`;
    }).join('');
}

function isSkipped(date) {
    if (skipDates.includes(formatISO(date))) return true;
    if (document.getElementById('skipWeekends').checked) {
        const day = date.getDay();
        if (day === 0 || day === 6) return true;
    }
    return false;
}

// ===== TÍNH TOÁN CA THI =====
function buildSessionTimes(cfg) {
    const sessions = [];
    let h, m, count;

    // Buổi sáng
    h = cfg.morningStart.h; m = cfg.morningStart.m; count = 0;
    while (count < cfg.morningMax) {
        const startH = h, startM = m;
        let endM = m + cfg.examMin, endH = h;
        while (endM >= 60) { endH++; endM -= 60; }

        sessions.push({ index: sessions.length + 1, startH, startM, endH, endM, buoi: 'Sáng' });
        count++;

        let nextM = endM + cfg.breakMin, nextH = endH;
        while (nextM >= 60) { nextH++; nextM -= 60; }
        h = nextH; m = nextM;
    }

    // Buổi chiều
    if (cfg.afternoonMax > 0) {
        h = cfg.afternoonStart.h; m = cfg.afternoonStart.m; count = 0;
        while (count < cfg.afternoonMax) {
            const startH = h, startM = m;
            let endM = m + cfg.examMin, endH = h;
            while (endM >= 60) { endH++; endM -= 60; }

            sessions.push({ index: sessions.length + 1, startH, startM, endH, endM, buoi: 'Chiều' });
            count++;

            let nextM = endM + cfg.breakMin, nextH = endH;
            while (nextM >= 60) { nextH++; nextM -= 60; }
            h = nextH; m = nextM;
        }
    }

    return sessions;
}

// ===== RENDER TỪNG PHẦN =====

function renderOverview(cfg, gradeSchedules, totalSessions, startDate, endDate, examDaysCount) {
    return `
    <div class="card">
        <div class="section-num">Phần 1</div>
        <div class="card-title">
            <div class="icon" style="background:var(--primary-light);color:var(--primary);">📊</div>
            Thông tin tổng quan
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="value">${cfg.totalStudents.toLocaleString()}</div><div class="label">Tổng học sinh</div></div>
            <div class="stat-card"><div class="value">${examDaysCount}</div><div class="label">Ngày thi</div></div>
            <div class="stat-card"><div class="value">${totalSessions}</div><div class="label">Tổng số ca</div></div>
            <div class="stat-card"><div class="value">${cfg.maxPerDay}</div><div class="label">Ca tối đa/ngày</div></div>
        </div>
        <div class="two-cols">
            <div>
                <table>
                    <thead><tr><th>Khối</th><th>Số HS</th><th>Số ca</th></tr></thead>
                    <tbody>
                        ${gradeSchedules.map(g => `
                        <tr>
                            <td><span class="grade-tag ${g.cssClass}">${g.name}</span></td>
                            <td><strong>${g.students}</strong></td>
                            <td><strong>${g.sessionsNeeded} ca</strong></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div>
                <table>
                    <thead><tr><th>Thông số</th><th>Giá trị</th></tr></thead>
                    <tbody>
                        <tr><td style="text-align:left">⏱️ Thời gian mỗi ca</td><td><strong>${cfg.examMin} phút</strong></td></tr>
                        <tr><td style="text-align:left">⏸️ Nghỉ giữa các ca</td><td><strong>${cfg.breakMin} phút</strong></td></tr>
                        <tr><td style="text-align:left">💻 HS/ca (tối đa)</td><td><strong>${COMPUTERS} em</strong></td></tr>
                        <tr><td style="text-align:left">📅 Kỳ thi</td><td><strong>${formatDateShort(startDate)} → ${formatDateShort(endDate)}</strong></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="note-box">
            <strong>💡 Tự động tính:</strong>
            ${gradeSchedules.map(g => `${g.name}: ${g.students} HS → ${g.sessionsNeeded} ca`).join(' · ')} ·
            Tổng ${totalSessions} ca, ${cfg.maxPerDay} ca/ngày → <strong>${examDaysCount} ngày thi</strong>
            (${formatDateVN(startDate)} → ${formatDateVN(endDate)}).
        </div>
    </div>`;
}

function renderSchedule(examDays, cfg) {
    const dayStyles = ['day-1', 'day-2', 'day-3'];

    let html = `
    <div class="card page-break">
        <div class="section-num">Phần 2</div>
        <div class="card-title">
            <div class="icon" style="background:var(--success-light);color:var(--success);">📅</div>
            Lịch thi chi tiết
        </div>`;

    examDays.forEach((day, dayIdx) => {
        const gradesOnDay = [...new Set(day.sessions.map(s => s.grade.name))];
        const mainGrade = day.sessions[0].grade;
        const styleClass = dayStyles[dayIdx % 3] || 'day-extra';
        const isMakeup = day.isMakeup;

        const headerStyle = isMakeup
            ? 'background:var(--danger-light);color:var(--danger);border-left-color:var(--danger);'
            : `background:${mainGrade.colorLight};color:${mainGrade.color};border-left-color:${mainGrade.color};`;

        const label = isMakeup
            ? `🔄 NGÀY ${day.dayNum} — ${formatDateVN(day.date)} — CA THI BÙ (tất cả các khối)`
            : `📌 NGÀY ${day.dayNum} — ${formatDateVN(day.date)} — ${gradesOnDay.join(', ')}`;

        html += `
        <div class="day-header ${isMakeup ? 'day-extra' : styleClass}" style="${headerStyle}">
            <span>${label}</span>
            <span style="margin-left:auto;font-size:12px;font-weight:500;">${day.sessions.length} ca thi</span>
        </div>
        <table>
            <thead><tr><th>Ca</th><th>Buổi</th><th>Khối</th><th>Bắt đầu</th><th>Kết thúc</th><th>Số HS</th><th>Ghi chú</th></tr></thead>
            <tbody>`;

        day.sessions.forEach(s => {
            const isLast = s.students < COMPUTERS;
            const badgeClass = s.time.buoi === 'Sáng' ? 'badge-morning' : 'badge-afternoon';
            html += `
                <tr>
                    <td><strong>Ca ${s.time.index}</strong></td>
                    <td><span class="badge ${badgeClass}">${s.time.buoi}</span></td>
                    <td><span class="grade-tag ${s.grade.cssClass}">${s.grade.name}</span></td>
                    <td>${timeStr(s.time.startH, s.time.startM)}</td>
                    <td>${timeStr(s.time.endH, s.time.endM)}</td>
                    <td>${s.students}</td>
                    <td>${s.note || (isLast ? 'Ca vét' : '')}</td>
                </tr>`;
        });

        html += `</tbody></table><br>`;
    });

    // Timeline visual
    html += `
        <h4 style="margin-top:10px; margin-bottom:8px; font-size:13px; color:var(--gray-500);">⏳ Mô hình thời gian 1 ngày thi (${cfg.morningMax} sáng + ${cfg.afternoonMax} chiều = ${cfg.maxPerDay} ca)</h4>
        <div class="timeline-bar">`;

    for (let i = 0; i < cfg.morningMax; i++) {
        const w = (100 / (cfg.maxPerDay + (cfg.afternoonMax > 0 ? 1 : 0))).toFixed(1);
        html += `<div class="exam" style="width:${parseFloat(w) * 0.7}%">Ca ${i + 1}</div>`;
        if (i < cfg.morningMax - 1 || cfg.afternoonMax > 0)
            html += `<div class="break-slot" style="width:${parseFloat(w) * 0.3}%"></div>`;
    }
    if (cfg.afternoonMax > 0) {
        html += `<div class="lunch" style="width:${(100 / (cfg.maxPerDay + 1) * 0.8).toFixed(1)}%">🍚</div>`;
        for (let i = 0; i < cfg.afternoonMax; i++) {
            const w = (100 / (cfg.maxPerDay + 1)).toFixed(1);
            html += `<div class="exam" style="width:${parseFloat(w) * 0.7}%">C${cfg.morningMax + i + 1}</div>`;
            if (i < cfg.afternoonMax - 1)
                html += `<div class="break-slot" style="width:${parseFloat(w) * 0.3}%"></div>`;
        }
    }

    html += `</div>
        <div style="display:flex; gap:14px; font-size:11px; color:var(--gray-500); margin-top:4px;">
            <span>🟦 Thi (${cfg.examMin} phút)</span>
            <span>🟨 Nghỉ (${cfg.breakMin} phút)</span>
            ${cfg.afternoonMax > 0 ? '<span>⬜ Nghỉ trưa</span>' : ''}
        </div>
    </div>`;

    return html;
}

function renderFlow(cfg) {
    return `
    <div class="card page-break">
        <div class="section-num">Phần 3</div>
        <div class="card-title">
            <div class="icon" style="background:var(--grade6-light);color:var(--grade6);">🔄</div>
            Flow tổ chức mỗi ca thi
        </div>
        <div class="flow-container">
            <div class="flow-step">
                <div><div class="flow-node node-blue">1</div><div class="flow-line"></div></div>
                <div class="flow-content">
                    <h4>📢 Gọi thí sinh tập trung (T-15 phút)</h4>
                    <p>Gọi danh sách thí sinh ca tiếp theo tập trung tại khu vực chờ. Điểm danh, kiểm tra thẻ/giấy tờ. Phát số máy cho từng thí sinh.</p>
                </div>
            </div>
            <div class="flow-step">
                <div><div class="flow-node node-green">2</div><div class="flow-line"></div></div>
                <div class="flow-content">
                    <h4>🖥️ Chuẩn bị phòng máy (T-10 phút)</h4>
                    <p>Cán bộ kỹ thuật kiểm tra ${COMPUTERS} máy hoạt động, mở phần mềm thi, reset đề thi. Xác nhận tất cả máy sẵn sàng.</p>
                </div>
            </div>
            <div class="flow-step">
                <div><div class="flow-node node-purple">3</div><div class="flow-line"></div></div>
                <div class="flow-content">
                    <h4>🚪 Vào phòng & Đăng nhập (T-5 phút)</h4>
                    <p>Thí sinh vào phòng theo số máy. Cán bộ coi thi hướng dẫn đăng nhập bằng SBD. Kiểm tra thông tin hiển thị đúng.</p>
                </div>
            </div>
            <div class="flow-step">
                <div><div class="flow-node node-orange">4</div><div class="flow-line"></div></div>
                <div class="flow-content">
                    <h4>▶️ Bắt đầu thi (T = 0)</h4>
                    <p>Giám thị phát lệnh bắt đầu. Hệ thống tự đếm ngược ${cfg.examMin} phút. Cán bộ coi thi giám sát, xử lý sự cố (nếu có).</p>
                </div>
            </div>
            <div class="flow-step">
                <div><div class="flow-node node-red">5</div><div class="flow-line"></div></div>
                <div class="flow-content">
                    <h4>⏹️ Kết thúc & Thu bài (T+${cfg.examMin} phút)</h4>
                    <p>Hệ thống tự nộp bài khi hết giờ. Cán bộ kiểm tra dữ liệu đã lưu thành công. Xác nhận kết quả trên hệ thống quản lý.</p>
                </div>
            </div>
            <div class="flow-step">
                <div><div class="flow-node node-green">6</div></div>
                <div class="flow-content">
                    <h4>🔄 Chuyển ca (${cfg.breakMin} phút nghỉ)</h4>
                    <p>Thí sinh rời phòng. Reset hệ thống cho ca tiếp theo. Gọi nhóm thí sinh ca tiếp theo tập trung (lặp lại bước 1).</p>
                </div>
            </div>
        </div>
    </div>`;
}

function renderStaff() {
    return `
    <div class="card">
        <div class="section-num">Phần 4</div>
        <div class="card-title">
            <div class="icon" style="background:var(--danger-light);color:var(--danger);">👥</div>
            Phân công nhân sự
        </div>
        <table>
            <thead><tr><th>Vai trò</th><th>Số lượng</th><th>Nhiệm vụ chính</th></tr></thead>
            <tbody>
                <tr><td style="text-align:left"><strong>🎯 Trưởng ban thi</strong></td><td>1</td><td style="text-align:left">Chỉ đạo chung, xử lý tình huống phát sinh, quyết định các vấn đề ngoài quy trình</td></tr>
                <tr><td style="text-align:left"><strong>👁️ Giám thị phòng thi</strong></td><td>2–3</td><td style="text-align:left">Coi thi, giám sát thí sinh, thu bài sự cố, lập biên bản ca thi</td></tr>
                <tr><td style="text-align:left"><strong>🔧 Cán bộ kỹ thuật</strong></td><td>2</td><td style="text-align:left">Vận hành hệ thống, xử lý sự cố máy/mạng, backup dữ liệu</td></tr>
                <tr><td style="text-align:left"><strong>📢 Điều phối thí sinh</strong></td><td>2</td><td style="text-align:left">Gọi tên, điểm danh, sắp xếp, hướng dẫn HS ra/vào phòng</td></tr>
            </tbody>
        </table>
        <p style="margin-top:10px; font-size:12px; color:var(--gray-500);"><strong>Tổng nhân sự tối thiểu:</strong> 7–8 người/ngày thi</p>
    </div>`;
}

function renderManagement(examDaysCount, cfg) {
    return `
    <div class="card page-break">
        <div class="section-num">Phần 5</div>
        <div class="card-title">
            <div class="icon" style="background:var(--warning-light);color:var(--warning);">⚙️</div>
            Quy trình quản lý khoa học
        </div>
        <div class="two-cols">
            <div>
                <h4 style="margin-bottom:10px; color:var(--primary);">🔹 Trước kỳ thi (T-3 ngày)</h4>
                <ul class="checklist">
                    <li><span class="check-icon">✓</span>Lập danh sách HS theo khối, chia ca, gán số máy</li>
                    <li><span class="check-icon">✓</span>Kiểm tra toàn bộ ${COMPUTERS} máy tính, cập nhật phần mềm</li>
                    <li><span class="check-icon">✓</span>Chuẩn bị 5–10 máy dự phòng (nếu có)</li>
                    <li><span class="check-icon">✓</span>Nạp đề thi vào hệ thống, test thử</li>
                    <li><span class="check-icon">✓</span>Thông báo lịch thi đến HS và phụ huynh</li>
                    <li><span class="check-icon">✓</span>Tập huấn cán bộ coi thi, kỹ thuật</li>
                </ul>
            </div>
            <div>
                <h4 style="margin-bottom:10px; color:var(--success);">🔹 Trong kỳ thi (${examDaysCount} ngày)</h4>
                <ul class="checklist">
                    <li><span class="check-icon">✓</span>Mỗi ca: điểm danh → vào phòng → thi → thu bài</li>
                    <li><span class="check-icon">✓</span>Ghi nhận sự cố kỹ thuật, lập biên bản ngay</li>
                    <li><span class="check-icon">✓</span>Backup dữ liệu bài thi sau mỗi ca</li>
                    <li><span class="check-icon">✓</span>Kiểm tra chéo danh sách HS đã thi / chưa thi</li>
                    <li><span class="check-icon">✓</span>Đảm bảo HS ca sau không tiếp xúc HS ca trước</li>
                    <li><span class="check-icon">✓</span>Tổng kết cuối ngày: báo cáo số HS hoàn thành</li>
                </ul>
            </div>
        </div>
        <div style="margin-top:20px;">
            <h4 style="margin-bottom:10px; color:var(--danger);">🔹 Xử lý sự cố</h4>
            <table>
                <thead><tr><th>Sự cố</th><th>Phương án xử lý</th></tr></thead>
                <tbody>
                    <tr><td style="text-align:left">💻 Máy tính bị lỗi/treo</td><td style="text-align:left">Chuyển HS sang máy dự phòng, bù thời gian. Lập biên bản.</td></tr>
                    <tr><td style="text-align:left">🌐 Mất mạng/server</td><td style="text-align:left">HS tiếp tục làm bài trên máy. Khi hết giờ, lưu file bài làm ra USB/ổ đĩa và nộp trực tiếp cho giám thị. Cán bộ kỹ thuật thu thập file, import vào hệ thống sau khi khôi phục kết nối.</td></tr>
                    <tr><td style="text-align:left">⚡ Mất điện</td><td style="text-align:left">Sử dụng UPS (nếu có). Lưu bài tự động. Thi bù ca sau.</td></tr>
                    <tr><td style="text-align:left">🤒 HS vắng mặt</td><td style="text-align:left">Ghi nhận. Sắp xếp thi bù vào ca thi bù chung cuối kỳ.</td></tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

function renderPreparation() {
    return `
    <div class="card">
        <div class="section-num">Phần 6</div>
        <div class="card-title">
            <div class="icon" style="background:var(--success-light);color:var(--success);">✅</div>
            Danh mục chuẩn bị
        </div>
        <div class="two-cols">
            <div>
                <h4 style="margin-bottom:10px;">🖥️ Kỹ thuật & Thiết bị</h4>
                <ul class="checklist">
                    <li><span class="check-icon">✓</span>${COMPUTERS} máy tính đã kiểm tra, cài đặt phần mềm thi</li>
                    <li><span class="check-icon">✓</span>Hệ thống mạng LAN / WiFi ổn định</li>
                    <li><span class="check-icon">✓</span>Server chấm thi / quản lý đề thi</li>
                    <li><span class="check-icon">✓</span>Ổ cắm điện, dây nối, UPS dự phòng</li>
                    <li><span class="check-icon">✓</span>USB / ổ cứng backup dữ liệu</li>
                </ul>
            </div>
            <div>
                <h4 style="margin-bottom:10px;">📄 Hồ sơ & Biểu mẫu</h4>
                <ul class="checklist">
                    <li><span class="check-icon">✓</span>Danh sách HS theo ca (có số máy)</li>
                    <li><span class="check-icon">✓</span>Biên bản ca thi (mẫu in sẵn)</li>
                    <li><span class="check-icon">✓</span>Phiếu xử lý sự cố</li>
                    <li><span class="check-icon">✓</span>Bảng tổng hợp kết quả theo ngày</li>
                    <li><span class="check-icon">✓</span>Sơ đồ vị trí máy & lối đi</li>
                </ul>
            </div>
        </div>
    </div>`;
}

function renderSummary(examDaysCount, cfg, totalSessions, startDate, endDate) {
    return `
    <div class="summary-box">
        <h3>📌 Tóm tắt Kế hoạch Tổ chức Thi</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="val">${examDaysCount} ngày</div>
                <div class="lbl">${formatDateShort(startDate)} → ${formatDateShort(endDate)}</div>
            </div>
            <div class="summary-item">
                <div class="val">${cfg.maxPerDay} ca/ngày</div>
                <div class="lbl">${cfg.morningMax} sáng + ${cfg.afternoonMax} chiều</div>
            </div>
            <div class="summary-item">
                <div class="val">${totalSessions} ca</div>
                <div class="lbl">Tổng số ca (gồm bù)</div>
            </div>
            <div class="summary-item">
                <div class="val">${COMPUTERS} HS/ca</div>
                <div class="lbl">Tối đa mỗi ca</div>
            </div>
            <div class="summary-item">
                <div class="val">${cfg.examMin} + ${cfg.breakMin}</div>
                <div class="lbl">Phút thi + nghỉ</div>
            </div>
            <div class="summary-item">
                <div class="val">~8 người</div>
                <div class="lbl">Nhân sự mỗi ngày</div>
            </div>
        </div>
    </div>`;
}

function renderFooter() {
    return `
    <div class="footer">
        <p><strong>Trường THCS Thái Thịnh</strong> — Kế hoạch Tổ chức Thi trên Máy tính</p>
        <p>Năm học 2025–2026 &nbsp;•&nbsp; Phê duyệt bởi: _________________________ &nbsp;•&nbsp; Ngày: ____/____/2026</p>
    </div>`;
}

// ===== GENERATE CHÍNH =====
function generateSchedule() {
    const startDateStr = document.getElementById('startDate').value;
    if (!startDateStr) { alert('Vui lòng chọn ngày bắt đầu thi'); return; }

    const cfg = readConfig();
    const startDate = new Date(startDateStr + 'T00:00:00');
    const sessionTimes = buildSessionTimes(cfg);

    // Tính số ca cần cho mỗi khối
    const gradeSchedules = cfg.grades.map(g => ({
        ...g,
        sessionsNeeded: Math.ceil(g.students / COMPUTERS)
    }));
    const regularSessions = gradeSchedules.reduce((s, g) => s + g.sessionsNeeded, 0);

    // Tạo danh sách ca thi phẳng
    const remainingSessions = [];
    gradeSchedules.forEach(g => {
        let remaining = g.students;
        for (let i = 0; i < g.sessionsNeeded; i++) {
            const stu = Math.min(COMPUTERS, remaining);
            remaining -= stu;
            remainingSessions.push({ grade: g, sessionIdx: i + 1, students: stu });
        }
    });

    // Phân bổ ca vào từng ngày thi
    const examDays = [];
    let currentDate = new Date(startDate);
    let sessionPointer = 0;
    let dayCount = 0;

    while (sessionPointer < remainingSessions.length) {
        while (isSkipped(currentDate)) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        dayCount++;
        const dailyLimit = Math.min(cfg.maxPerDay, remainingSessions.length - sessionPointer);
        const daySessions = [];

        for (let i = 0; i < dailyLimit; i++) {
            daySessions.push({
                ...remainingSessions[sessionPointer],
                time: sessionTimes[i]
            });
            sessionPointer++;
        }

        examDays.push({
            dayNum: dayCount,
            date: new Date(currentDate),
            sessions: daySessions,
            isMakeup: false
        });

        currentDate.setDate(currentDate.getDate() + 1);
    }

    // === NGÀY THI BÙ: 1 ca mỗi khối ===
    while (isSkipped(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
    }
    dayCount++;
    const makeupSessions = [];
    gradeSchedules.forEach((g, idx) => {
        if (sessionTimes[idx]) {
            makeupSessions.push({
                grade: g,
                sessionIdx: 0,
                students: COMPUTERS,
                time: sessionTimes[idx],
                note: 'Thi bù – ' + g.name
            });
        }
    });
    examDays.push({
        dayNum: dayCount,
        date: new Date(currentDate),
        sessions: makeupSessions,
        isMakeup: true
    });

    const endDate = examDays[examDays.length - 1].date;
    const totalSessions = regularSessions + makeupSessions.length;

    // Ghép tất cả các phần
    let html = '';
    html += renderOverview(cfg, gradeSchedules, totalSessions, startDate, endDate, examDays.length);
    html += renderSchedule(examDays, cfg);
    html += renderFlow(cfg);
    html += renderStaff();
    html += renderManagement(examDays.length, cfg);
    html += renderPreparation();
    html += renderSummary(examDays.length, cfg, totalSessions, startDate, endDate);
    html += renderFooter();

    document.getElementById('generatedContent').innerHTML = html;
}

// ===== KHỞI TẠO =====
(function init() {
    const today = new Date();
    document.getElementById('headerDate').textContent = formatDateVN(today);

    const nextMon = new Date(today);
    nextMon.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));
    document.getElementById('startDate').value = formatISO(nextMon);
    document.getElementById('skipDateInput').value = '';

    renderSkipDates();
    generateSchedule();
})();
