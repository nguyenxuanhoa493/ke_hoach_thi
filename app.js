// ===== CẤU HÌNH CHUNG =====
const GRADE_COLORS = [
    { color: '#7c3aed', light: '#ede9fe' }, // tím
    { color: '#0891b2', light: '#e0f2fe' }, // lam
    { color: '#ea580c', light: '#fff7ed' }, // cam
    { color: '#059669', light: '#d1fae5' }, // lục
    { color: '#db2777', light: '#fce7f3' }, // hồng
    { color: '#2563eb', light: '#dbeafe' }, // xanh
    { color: '#dc2626', light: '#fee2e2' }, // đỏ
    { color: '#ca8a04', light: '#fef9c3' }, // vàng
];

let nextSchoolId = 1;
let nextGradeId = 1;
let schools = [
    {
        id: nextSchoolId++,
        name: 'Cổ Nhuế',
        numRooms: 1,
        grades: [
            { id: nextGradeId++, name: 'Lớp 4', students: 163 },
            { id: nextGradeId++, name: 'Lớp 5', students: 161 },
        ],
    },
    {
        id: nextSchoolId++,
        name: 'Nguyễn Văn Cẩn',
        numRooms: 1,
        grades: [
            { id: nextGradeId++, name: 'Lớp 4', students: 545 },
            { id: nextGradeId++, name: 'Lớp 5', students: 547 },
        ],
    },
    {
        id: nextSchoolId++,
        name: 'Xuân Phương',
        numRooms: 1,
        grades: [
            { id: nextGradeId++, name: 'Lớp 4', students: 25 },
            { id: nextGradeId++, name: 'Lớp 5', students: 30 },
        ],
    },
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
function escapeAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function parseTimeInput(id) {
    const val = document.getElementById(id).value;
    const [h, m] = val.split(':').map(Number);
    return { h, m };
}

function getInt(id) { return parseInt(document.getElementById(id).value) || 0; }
function getComputersPerRoomLive() {
    return Math.max(1, parseInt(document.getElementById('computersPerRoom')?.value) || 60);
}
function getGradeColor(idx) { return GRADE_COLORS[idx % GRADE_COLORS.length]; }

// ===== QUẢN LÝ TRƯỜNG / KHỐI (DYNAMIC) =====
function syncSchoolsFromDOM() {
    schools = schools.map(school => {
        const card = document.querySelector(`.school-card[data-school-id="${school.id}"]`);
        if (!card) return school;
        const nameVal = card.querySelector('.school-name-input').value.trim();
        const roomsVal = parseInt(card.querySelector('.school-rooms-input').value);
        const newGrades = school.grades.map(g => {
            const row = card.querySelector(`.grade-row[data-id="${g.id}"]`);
            if (!row) return g;
            const nm = row.querySelector('.grade-name').value.trim();
            const st = parseInt(row.querySelector('.grade-students').value);
            return {
                ...g,
                name: nm || g.name,
                students: isNaN(st) ? g.students : st,
            };
        });
        return {
            ...school,
            name: nameVal || school.name,
            numRooms: isNaN(roomsVal) ? school.numRooms : Math.max(1, roomsVal),
            grades: newGrades,
        };
    });
}

function renderSchools() {
    const container = document.getElementById('schoolsList');
    if (!container) return;
    const cpr = getComputersPerRoomLive();
    let globalGradeIdx = 0;
    container.innerHTML = schools.map((school, sIdx) => {
        const cap = school.numRooms * cpr;
        const totalStudents = school.grades.reduce((s, g) => s + g.students, 0);
        const sessionsTotal = school.grades.reduce((s, g) => s + Math.ceil(g.students / cap), 0);

        const gradesHtml = school.grades.map((g, gIdx) => {
            const c = getGradeColor(globalGradeIdx++);
            return `
            <div class="grade-row" data-id="${g.id}">
                <span class="grade-color-dot" style="background:${c.color}"></span>
                <input type="text" class="grade-name" value="${escapeAttr(g.name)}" placeholder="Tên khối">
                <input type="number" class="grade-students" value="${g.students}" min="1" max="5000">
                <span class="grade-row-suffix">HS</span>
                <button type="button" class="grade-btn" onclick="moveGrade(${school.id}, ${g.id}, -1)" title="Lên" ${gIdx === 0 ? 'disabled' : ''}>▲</button>
                <button type="button" class="grade-btn" onclick="moveGrade(${school.id}, ${g.id}, 1)" title="Xuống" ${gIdx === school.grades.length - 1 ? 'disabled' : ''}>▼</button>
                <button type="button" class="grade-btn grade-btn-remove" onclick="removeGrade(${school.id}, ${g.id})" title="Xóa" ${school.grades.length <= 1 ? 'disabled' : ''}>✕</button>
            </div>`;
        }).join('');

        return `
        <div class="school-card" data-school-id="${school.id}">
            <div class="school-card-header">
                <span class="school-card-num">🏫 Trường ${sIdx + 1}</span>
                <input type="text" class="school-name-input" value="${escapeAttr(school.name)}" placeholder="Tên trường thi">
                <label class="school-rooms-label">Số phòng:</label>
                <input type="number" class="school-rooms-input" value="${school.numRooms}" min="1" max="20">
                <button type="button" class="school-btn-up" onclick="moveSchool(${school.id}, -1)" title="Lên" ${sIdx === 0 ? 'disabled' : ''}>▲</button>
                <button type="button" class="school-btn-down" onclick="moveSchool(${school.id}, 1)" title="Xuống" ${sIdx === schools.length - 1 ? 'disabled' : ''}>▼</button>
                <button type="button" class="school-btn-remove" onclick="removeSchool(${school.id})" ${schools.length <= 1 ? 'disabled' : ''} title="Xóa trường">✕</button>
            </div>
            <div class="school-card-stats">
                <span>👥 <strong>${totalStudents.toLocaleString()}</strong> học sinh</span>
                <span>🎯 <strong>${sessionsTotal}</strong> ca thi</span>
                <span>💻 sức chứa <strong>${cap}</strong>/ca = ${school.numRooms} phòng × ${cpr} máy</span>
            </div>
            <div class="school-grades-list">${gradesHtml}</div>
            <button type="button" class="btn-add-grade-inner" onclick="addGrade(${school.id})">+ Thêm khối vào trường này</button>
        </div>`;
    }).join('');
}

function addSchool() {
    syncSchoolsFromDOM();
    schools.push({
        id: nextSchoolId++,
        name: `Trường ${schools.length + 1}`,
        numRooms: 1,
        grades: [{ id: nextGradeId++, name: 'Lớp 1', students: 100 }],
    });
    renderSchools();
}

function removeSchool(schoolId) {
    if (schools.length <= 1) return;
    syncSchoolsFromDOM();
    schools = schools.filter(s => s.id !== schoolId);
    renderSchools();
}

function moveSchool(schoolId, delta) {
    syncSchoolsFromDOM();
    const idx = schools.findIndex(s => s.id === schoolId);
    const newIdx = idx + delta;
    if (idx < 0 || newIdx < 0 || newIdx >= schools.length) return;
    [schools[idx], schools[newIdx]] = [schools[newIdx], schools[idx]];
    renderSchools();
}

function addGrade(schoolId) {
    syncSchoolsFromDOM();
    const school = schools.find(s => s.id === schoolId);
    if (!school) return;
    school.grades.push({ id: nextGradeId++, name: `Khối mới`, students: 100 });
    renderSchools();
}

function removeGrade(schoolId, gradeId) {
    syncSchoolsFromDOM();
    const school = schools.find(s => s.id === schoolId);
    if (!school || school.grades.length <= 1) return;
    school.grades = school.grades.filter(g => g.id !== gradeId);
    renderSchools();
}

function moveGrade(schoolId, gradeId, delta) {
    syncSchoolsFromDOM();
    const school = schools.find(s => s.id === schoolId);
    if (!school) return;
    const idx = school.grades.findIndex(g => g.id === gradeId);
    const newIdx = idx + delta;
    if (idx < 0 || newIdx < 0 || newIdx >= school.grades.length) return;
    [school.grades[idx], school.grades[newIdx]] = [school.grades[newIdx], school.grades[idx]];
    renderSchools();
}

// ===== ĐỌC CẤU HÌNH TỪ FORM =====
function readConfig() {
    const morningStart = parseTimeInput('morningStart');
    const afternoonStart = parseTimeInput('afternoonStart');
    const morningMax = getInt('morningMax');
    const afternoonMax = getInt('afternoonMax');
    const examMin = getInt('examDuration');
    const breakMin = getInt('breakMinutes');
    const maxPerDay = morningMax + afternoonMax;
    const computersPerRoom = Math.max(1, getInt('computersPerRoom'));

    syncSchoolsFromDOM();
    let globalGradeIdx = 0;
    const cfgSchools = schools.map(school => {
        const cap = school.numRooms * computersPerRoom;
        const cfgGrades = school.grades.map(g => {
            const c = getGradeColor(globalGradeIdx++);
            return {
                id: g.id, name: g.name, students: g.students,
                color: c.color, colorLight: c.light,
            };
        });
        return {
            id: school.id,
            name: school.name,
            numRooms: school.numRooms,
            computersPerRoom,
            capacityPerSession: cap,
            grades: cfgGrades,
            totalStudents: cfgGrades.reduce((s, g) => s + g.students, 0),
        };
    });

    const totalStudents = cfgSchools.reduce((s, sc) => s + sc.totalStudents, 0);
    const totalRooms = cfgSchools.reduce((s, sc) => s + sc.numRooms, 0);
    const totalComputers = totalRooms * computersPerRoom;

    const hasMakeupDay = document.getElementById('hasMakeupDay').value === 'yes';
    const orgName = (document.getElementById('schoolName').value.trim()) || 'Đơn vị tổ chức';
    const planTitle = (document.getElementById('planTitle').value.trim()) || '📋 KẾ HOẠCH TỔ CHỨC THI';
    const schoolYear = (document.getElementById('schoolYear').value.trim()) || '';

    return {
        morningStart, afternoonStart, morningMax, afternoonMax, maxPerDay,
        examMin, breakMin,
        computersPerRoom, totalRooms, totalComputers,
        schools: cfgSchools, totalStudents, hasMakeupDay,
        orgName, planTitle, schoolYear,
    };
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
    const day = date.getDay();
    if (day === 6 && document.getElementById('skipSaturday').checked) return true;
    if (day === 0 && document.getElementById('skipSunday').checked) return true;
    return false;
}

// ===== TÍNH TOÁN CA THI =====
function buildSessionTimes(cfg) {
    const sessions = [];
    let h, m, count;

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

// Lập lịch ca thi cho 1 trường (độc lập, dùng chung cùng startDate)
function buildSchoolSchedule(school, startDate, sessionTimes, cfg) {
    const cap = school.capacityPerSession;
    const gradeSchedules = school.grades.map(g => ({
        ...g, sessionsNeeded: Math.ceil(g.students / cap)
    }));

    const flatSessions = [];
    gradeSchedules.forEach(g => {
        let remaining = g.students;
        for (let i = 0; i < g.sessionsNeeded; i++) {
            const stu = Math.min(cap, remaining);
            remaining -= stu;
            flatSessions.push({ grade: g, sessionIdx: i + 1, students: stu });
        }
    });

    const examDays = [];
    const currentDate = new Date(startDate);
    let pointer = 0;
    let dayCount = 0;

    while (pointer < flatSessions.length) {
        while (isSkipped(currentDate)) currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
        const limit = Math.min(cfg.maxPerDay, flatSessions.length - pointer);
        const daySessions = [];
        for (let i = 0; i < limit; i++) {
            daySessions.push({ ...flatSessions[pointer], time: sessionTimes[i] });
            pointer++;
        }
        examDays.push({ dayNum: dayCount, date: new Date(currentDate), sessions: daySessions, isMakeup: false });
        currentDate.setDate(currentDate.getDate() + 1);
    }

    let makeupSessions = [];
    if (cfg.hasMakeupDay && gradeSchedules.length > 0) {
        while (isSkipped(currentDate)) currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
        gradeSchedules.forEach((g, idx) => {
            if (sessionTimes[idx]) {
                makeupSessions.push({
                    grade: g, sessionIdx: 0, students: cap,
                    time: sessionTimes[idx], note: 'Thi bù – ' + g.name,
                });
            }
        });
        if (makeupSessions.length > 0) {
            examDays.push({ dayNum: dayCount, date: new Date(currentDate), sessions: makeupSessions, isMakeup: true });
        }
    }

    const regularSessions = gradeSchedules.reduce((s, g) => s + g.sessionsNeeded, 0);
    return {
        gradeSchedules, examDays,
        regularSessions, makeupCount: makeupSessions.length,
        totalSessions: regularSessions + makeupSessions.length,
        endDate: examDays.length ? examDays[examDays.length - 1].date : startDate,
        daysCount: examDays.length,
    };
}

// ===== RENDER TỪNG PHẦN =====
function renderOverview(cfg, totalSessions, startDate, endDate, examDaysCount) {
    const schoolRows = cfg.schools.map((sc, sIdx) => `
        <tr>
            <td><strong>${sIdx + 1}. ${sc.name}</strong></td>
            <td>${sc.totalStudents.toLocaleString()}</td>
            <td>${sc.numRooms}</td>
            <td><strong>${sc.capacityPerSession}</strong></td>
            <td><strong>${sc.totalSessions} ca</strong></td>
            <td><strong>${sc.daysCount} ngày</strong></td>
        </tr>`).join('');

    const gradeBreakdownByCfgSchool = cfg.schools.map(sc => {
        const parts = sc.gradeSchedules.map(g => `${g.name}: ${g.students}→${g.sessionsNeeded} ca`).join(', ');
        return `<strong>${sc.name}</strong> (${parts})`;
    }).join(' · ');

    return `
    <div class="card">
        <div class="section-num">Phần 1</div>
        <div class="card-title">
            <div class="icon" style="background:var(--primary-light);color:var(--primary);">📊</div>
            Thông tin tổng quan
        </div>
        <div class="stats-grid">
            <div class="stat-card"><div class="value">${cfg.schools.length}</div><div class="label">Trường thi</div></div>
            <div class="stat-card"><div class="value">${cfg.totalStudents.toLocaleString()}</div><div class="label">Tổng học sinh</div></div>
            <div class="stat-card"><div class="value">${examDaysCount}</div><div class="label">Ngày thi</div></div>
            <div class="stat-card"><div class="value">${totalSessions}</div><div class="label">Tổng số ca</div></div>
        </div>
        <table>
            <thead><tr><th>Trường</th><th>Số HS</th><th>Phòng</th><th>HS/ca</th><th>Số ca</th><th>Ngày thi</th></tr></thead>
            <tbody>${schoolRows}</tbody>
        </table>
        <div class="two-cols" style="margin-top:14px;">
            <div>
                <table>
                    <thead><tr><th>Thông số chung</th><th>Giá trị</th></tr></thead>
                    <tbody>
                        <tr><td style="text-align:left">⏱️ Thời gian mỗi ca</td><td><strong>${cfg.examMin} phút</strong></td></tr>
                        <tr><td style="text-align:left">⏸️ Nghỉ giữa các ca</td><td><strong>${cfg.breakMin} phút</strong></td></tr>
                        <tr><td style="text-align:left">🔢 Ca tối đa / ngày</td><td><strong>${cfg.maxPerDay} ca</strong> (${cfg.morningMax} sáng + ${cfg.afternoonMax} chiều)</td></tr>
                    </tbody>
                </table>
            </div>
            <div>
                <table>
                    <thead><tr><th>Quy mô tổng</th><th>Giá trị</th></tr></thead>
                    <tbody>
                        <tr><td style="text-align:left">💻 Số máy / phòng</td><td><strong>${cfg.computersPerRoom} máy</strong></td></tr>
                        <tr><td style="text-align:left">🏫 Tổng số phòng (cả cụm)</td><td><strong>${cfg.totalRooms} phòng</strong></td></tr>
                        <tr><td style="text-align:left">🖥️ Tổng số máy huy động</td><td><strong>${cfg.totalComputers} máy</strong></td></tr>
                        <tr><td style="text-align:left">📅 Kỳ thi</td><td><strong>${formatDateShort(startDate)} → ${formatDateShort(endDate)}</strong></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="note-box">
            <strong>💡 Tự động tính:</strong>
            ${gradeBreakdownByCfgSchool} ·
            Tổng <strong>${cfg.totalStudents.toLocaleString()}</strong> HS, <strong>${totalSessions}</strong> ca,
            <strong>${cfg.maxPerDay}</strong> ca/ngày → kéo dài <strong>${examDaysCount}</strong> ngày thi
            (${formatDateVN(startDate)} → ${formatDateVN(endDate)}).
        </div>
    </div>`;
}

function renderSchedule(cfg) {
    let html = `
    <div class="card page-break">
        <div class="section-num">Phần 2</div>
        <div class="card-title">
            <div class="icon" style="background:var(--success-light);color:var(--success);">📅</div>
            Lịch thi chi tiết theo từng trường
        </div>`;

    cfg.schools.forEach((sc, sIdx) => {
        html += `
        <div class="school-section ${sIdx > 0 ? 'page-break' : ''}">
            <div class="school-section-header">
                🏫 ${sIdx + 1}. ${sc.name}
                <span class="school-section-meta">${sc.totalStudents.toLocaleString()} HS · ${sc.numRooms} phòng × ${sc.computersPerRoom} máy = ${sc.capacityPerSession}/ca · ${sc.totalSessions} ca · ${sc.daysCount} ngày</span>
            </div>`;

        sc.examDays.forEach(day => {
            const gradesOnDay = [...new Set(day.sessions.map(s => s.grade.name))];
            const mainGrade = day.sessions[0].grade;
            const isMakeup = day.isMakeup;

            const headerStyle = isMakeup
                ? 'background:var(--danger-light) !important;color:var(--danger) !important;border-left-color:var(--danger) !important;'
                : `background:${mainGrade.colorLight} !important;color:${mainGrade.color} !important;border-left-color:${mainGrade.color} !important;`;

            const label = isMakeup
                ? `🔄 NGÀY ${day.dayNum} — ${formatDateVN(day.date)} — CA THI BÙ (tất cả các khối)`
                : `📌 NGÀY ${day.dayNum} — ${formatDateVN(day.date)} — ${gradesOnDay.join(', ')}`;

            html += `
            <div class="day-header${isMakeup ? ' day-extra' : ''}" style="${headerStyle}">
                <span>${label}</span>
                <span style="margin-left:auto;font-size:12px;font-weight:500;">${day.sessions.length} ca thi</span>
            </div>
            <table>
                <thead><tr><th>Ca</th><th>Buổi</th><th>Khối</th><th>Bắt đầu</th><th>Kết thúc</th><th>Số HS</th><th>Ghi chú</th></tr></thead>
                <tbody>`;

            day.sessions.forEach(s => {
                const isLast = s.students < sc.capacityPerSession;
                const badgeClass = s.time.buoi === 'Sáng' ? 'badge-morning' : 'badge-afternoon';
                html += `
                    <tr>
                        <td><strong>Ca ${s.time.index}</strong></td>
                        <td><span class="badge ${badgeClass}">${s.time.buoi}</span></td>
                        <td><span class="grade-tag" style="background:${s.grade.colorLight};color:${s.grade.color}">${s.grade.name}</span></td>
                        <td>${timeStr(s.time.startH, s.time.startM)}</td>
                        <td>${timeStr(s.time.endH, s.time.endM)}</td>
                        <td>${s.students}</td>
                        <td>${s.note || (isLast ? 'Ca vét' : '')}</td>
                    </tr>`;
            });

            html += `</tbody></table><br>`;
        });

        html += `</div>`;
    });

    // Timeline visual chung
    html += `
        <h4 style="margin-top:14px; margin-bottom:8px; font-size:13px; color:var(--gray-500);">⏳ Mô hình thời gian 1 ngày thi (${cfg.morningMax} sáng + ${cfg.afternoonMax} chiều = ${cfg.maxPerDay} ca, áp dụng cho mọi trường)</h4>
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
            Flow tổ chức mỗi ca thi (áp dụng tại mỗi trường)
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
                    <p>Cán bộ kỹ thuật của mỗi trường kiểm tra toàn bộ máy hoạt động (theo cấu hình từng trường, ${cfg.computersPerRoom} máy/phòng), mở phần mềm thi, reset đề thi. Xác nhận tất cả máy sẵn sàng.</p>
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

function renderStaff(cfg) {
    return `
    <div class="card">
        <div class="section-num">Phần 4</div>
        <div class="card-title">
            <div class="icon" style="background:var(--danger-light);color:var(--danger);">👥</div>
            Phân công nhân sự (mỗi trường)
        </div>
        <table>
            <thead><tr><th>Vai trò</th><th>Số lượng / trường</th><th>Nhiệm vụ chính</th></tr></thead>
            <tbody>
                <tr><td style="text-align:left"><strong>🎯 Trưởng ban thi</strong></td><td>1</td><td style="text-align:left">Chỉ đạo chung tại trường, xử lý tình huống phát sinh, quyết định các vấn đề ngoài quy trình</td></tr>
                <tr><td style="text-align:left"><strong>👁️ Giám thị phòng thi</strong></td><td>2–3 / phòng</td><td style="text-align:left">Coi thi, giám sát thí sinh, thu bài sự cố, lập biên bản ca thi</td></tr>
                <tr><td style="text-align:left"><strong>🔧 Cán bộ kỹ thuật</strong></td><td>2</td><td style="text-align:left">Vận hành hệ thống, xử lý sự cố máy/mạng, backup dữ liệu</td></tr>
                <tr><td style="text-align:left"><strong>📢 Điều phối thí sinh</strong></td><td>2</td><td style="text-align:left">Gọi tên, điểm danh, sắp xếp, hướng dẫn HS ra/vào phòng</td></tr>
            </tbody>
        </table>
        <p style="margin-top:10px; font-size:12px; color:var(--gray-500);"><strong>Tổng nhân sự tối thiểu:</strong> 7–8 người/trường/ngày thi · Toàn cụm <strong>${cfg.schools.length}</strong> trường ⇒ ~<strong>${cfg.schools.length * 8}</strong> người/ngày</p>
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
                    <li><span class="check-icon">✓</span>Lập danh sách HS theo trường/khối, chia ca, gán số máy</li>
                    <li><span class="check-icon">✓</span>Kiểm tra toàn bộ <strong>${cfg.totalComputers}</strong> máy tính tại <strong>${cfg.totalRooms}</strong> phòng (cả cụm ${cfg.schools.length} trường), cập nhật phần mềm</li>
                    <li><span class="check-icon">✓</span>Chuẩn bị 5–10 máy dự phòng/trường (nếu có)</li>
                    <li><span class="check-icon">✓</span>Nạp đề thi vào hệ thống, test thử</li>
                    <li><span class="check-icon">✓</span>Thông báo lịch thi đến HS và phụ huynh từng trường</li>
                    <li><span class="check-icon">✓</span>Tập huấn cán bộ coi thi, kỹ thuật</li>
                </ul>
            </div>
            <div>
                <h4 style="margin-bottom:10px; color:var(--success);">🔹 Trong kỳ thi (${examDaysCount} ngày)</h4>
                <ul class="checklist">
                    <li><span class="check-icon">✓</span>Mỗi ca: điểm danh → vào phòng → thi → thu bài</li>
                    <li><span class="check-icon">✓</span>Ghi nhận sự cố kỹ thuật, lập biên bản ngay</li>
                    <li><span class="check-icon">✓</span>Backup dữ liệu bài thi sau mỗi ca</li>
                    <li><span class="check-icon">✓</span>Kiểm tra chéo danh sách HS đã thi / chưa thi từng trường</li>
                    <li><span class="check-icon">✓</span>Đảm bảo HS ca sau không tiếp xúc HS ca trước</li>
                    <li><span class="check-icon">✓</span>Tổng kết cuối ngày: báo cáo số HS hoàn thành theo trường</li>
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

function renderPreparation(cfg) {
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
                    <li><span class="check-icon">✓</span>Tổng <strong>${cfg.totalComputers}</strong> máy tại <strong>${cfg.totalRooms}</strong> phòng (${cfg.schools.length} trường) đã kiểm tra, cài đặt phần mềm thi</li>
                    <li><span class="check-icon">✓</span>Hệ thống mạng LAN / WiFi ổn định tại từng trường</li>
                    <li><span class="check-icon">✓</span>Server chấm thi / quản lý đề thi</li>
                    <li><span class="check-icon">✓</span>Ổ cắm điện, dây nối, UPS dự phòng</li>
                    <li><span class="check-icon">✓</span>USB / ổ cứng backup dữ liệu</li>
                </ul>
            </div>
            <div>
                <h4 style="margin-bottom:10px;">📄 Hồ sơ & Biểu mẫu</h4>
                <ul class="checklist">
                    <li><span class="check-icon">✓</span>Danh sách HS theo trường/ca (có số máy)</li>
                    <li><span class="check-icon">✓</span>Biên bản ca thi (mẫu in sẵn)</li>
                    <li><span class="check-icon">✓</span>Phiếu xử lý sự cố</li>
                    <li><span class="check-icon">✓</span>Bảng tổng hợp kết quả theo trường / theo ngày</li>
                    <li><span class="check-icon">✓</span>Sơ đồ vị trí máy & lối đi từng trường</li>
                </ul>
            </div>
        </div>
    </div>`;
}

function renderSummary(examDaysCount, cfg, totalSessions, startDate, endDate) {
    return `
    <div class="summary-box">
        <h3>📌 Tóm tắt Kế hoạch Tổ chức Thi (cụm ${cfg.schools.length} trường)</h3>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="val">${examDaysCount} ngày</div>
                <div class="lbl">${formatDateShort(startDate)} → ${formatDateShort(endDate)}</div>
            </div>
            <div class="summary-item">
                <div class="val">${cfg.totalStudents.toLocaleString()} HS</div>
                <div class="lbl">${cfg.schools.length} trường thi</div>
            </div>
            <div class="summary-item">
                <div class="val">${totalSessions} ca</div>
                <div class="lbl">Tổng số ca (gồm bù)</div>
            </div>
            <div class="summary-item">
                <div class="val">${cfg.totalRooms} phòng</div>
                <div class="lbl">${cfg.totalComputers} máy (${cfg.computersPerRoom}/phòng)</div>
            </div>
            <div class="summary-item">
                <div class="val">${cfg.examMin} + ${cfg.breakMin}</div>
                <div class="lbl">Phút thi + nghỉ</div>
            </div>
            <div class="summary-item">
                <div class="val">~${cfg.schools.length * 8} người</div>
                <div class="lbl">Nhân sự / ngày (cả cụm)</div>
            </div>
        </div>
    </div>`;
}

function renderFooter(cfg) {
    const today = new Date();
    return `
    <div class="footer">
        <p><strong>${cfg.orgName}</strong> — Kế hoạch Tổ chức Thi trên Máy tính</p>
        <p>${cfg.schoolYear} &nbsp;•&nbsp; Phê duyệt bởi: _________________________ &nbsp;•&nbsp; Ngày: ____/____/${today.getFullYear()}</p>
    </div>`;
}

// ===== HEADER =====
function updateHeader() {
    const orgName = document.getElementById('schoolName').value.trim() || 'Cụm trường thi';
    const planTitle = document.getElementById('planTitle').value.trim() || '📋 KẾ HOẠCH TỔ CHỨC THI';
    const schoolYear = document.getElementById('schoolYear').value.trim() || '';

    const elName = document.getElementById('headerSchoolName');
    const elTitle = document.getElementById('headerTitle');
    const elYear = document.getElementById('headerYear');
    if (elName) elName.textContent = orgName;
    if (elTitle) elTitle.textContent = planTitle;
    if (elYear) elYear.textContent = schoolYear;
    document.title = `${planTitle.replace(/^[^\p{L}\d]+/u, '')} - ${orgName}`;
}

// ===== GENERATE CHÍNH =====
function generateSchedule() {
    const startDateStr = document.getElementById('startDate').value;
    if (!startDateStr) { alert('Vui lòng chọn ngày bắt đầu thi'); return; }

    const cfg = readConfig();
    const startDate = new Date(startDateStr + 'T00:00:00');
    const sessionTimes = buildSessionTimes(cfg);

    cfg.schools.forEach(school => {
        const sched = buildSchoolSchedule(school, startDate, sessionTimes, cfg);
        Object.assign(school, sched);
    });

    const overallEndDate = cfg.schools.reduce((max, s) => s.endDate > max ? s.endDate : max, startDate);
    const overallDaysCount = Math.max(...cfg.schools.map(s => s.daysCount), 0);
    const overallTotalSessions = cfg.schools.reduce((s, sc) => s + sc.totalSessions, 0);

    let html = '';
    html += renderOverview(cfg, overallTotalSessions, startDate, overallEndDate, overallDaysCount);
    html += renderSchedule(cfg);
    html += renderFlow(cfg);
    html += renderStaff(cfg);
    html += renderManagement(overallDaysCount, cfg);
    html += renderPreparation(cfg);
    html += renderSummary(overallDaysCount, cfg, overallTotalSessions, startDate, overallEndDate);
    html += renderFooter(cfg);

    updateHeader();
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

    renderSchools();

    // Khi đổi số máy/phòng, cập nhật stats trong từng card trường
    const cprEl = document.getElementById('computersPerRoom');
    if (cprEl) cprEl.addEventListener('input', () => {
        syncSchoolsFromDOM();
        renderSchools();
    });

    ['schoolName', 'planTitle', 'schoolYear'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateHeader);
    });
    updateHeader();

    renderSkipDates();
    generateSchedule();
})();
