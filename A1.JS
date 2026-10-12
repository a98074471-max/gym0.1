/* =========================================================
   ELITE FITNESS - Gym Management
   Keeps the original student attendance/history features
   and adds subscriptions, income reports and trainer fees.
========================================================= */

let students = readStorage("students", []);
let incomes = readStorage("gymIncomes", []);
let trainers = readStorage("gymTrainers", []);

function readStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : fallback;
    } catch (error) {
        console.warn("مشکل در خواندن اطلاعات ذخیره‌شده:", key, error);
        return fallback;
    }
}

function saveStudents() {
    localStorage.setItem("students", JSON.stringify(students));
}

function saveIncomes() {
    localStorage.setItem("gymIncomes", JSON.stringify(incomes));
}

function saveTrainers() {
    localStorage.setItem("gymTrainers", JSON.stringify(trainers));
}

function todayISO() {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function currentMonthISO() {
    return todayISO().slice(0, 7);
}

function setDefaultDates() {
    const today = todayISO();

    const start = document.getElementById("membershipStart");
    const incomeDate = document.getElementById("incomeDate");
    const reportMonth = document.getElementById("reportMonth");

    if (start && !start.value) start.value = today;
    if (incomeDate && !incomeDate.value) incomeDate.value = today;
    if (reportMonth && !reportMonth.value) reportMonth.value = currentMonthISO();
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[character];
    });
}

function formatRial(value) {
    return `${Math.round(Number(value) || 0).toLocaleString("fa-IR")} ریال`;
}

function formatNumber(value) {
    return (Number(value) || 0).toLocaleString("fa-IR");
}

function formatDate(dateString) {
    if (!dateString) return "ثبت نشده";

    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) return dateString;

    return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(date);
}

function addMonthsToISO(dateString, months) {
    if (!dateString) return "";

    const parts = dateString.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) return "";

    const [year, month, day] = parts;

    const firstOfTarget = new Date(
        year,
        month - 1 + Number(months),
        1
    );

    const lastDay = new Date(
        firstOfTarget.getFullYear(),
        firstOfTarget.getMonth() + 1,
        0
    ).getDate();

    const finalDay = Math.min(day, lastDay);

    return `${firstOfTarget.getFullYear()}-${String(firstOfTarget.getMonth() + 1).padStart(2, "0")}-${String(finalDay).padStart(2, "0")}`;
}

function incomeCategoryLabel(category) {
    const labels = {
        membership: "شهریه ثابت / اشتراک",
        aerobicMonthly: "شهریه ایروبیک ماهانه",
        aerobicDaily: "شهریه ایروبیک روزانه",
        programming: "درآمد برنامه‌نویسی"
    };

    return labels[category] || "سایر درآمدها";
}

function getSelectedMonth() {
    return document.getElementById("reportMonth")?.value || currentMonthISO();
}

/* -------------------- STUDENT REGISTRATION -------------------- */

function addStudent() {
    const name = document.getElementById("name").value.trim();

    const sessions = Number(
        document.getElementById("sessions").value
    );

    const membershipType = Number(
        document.getElementById("membershipType").value
    );

    const membershipStart =
        document.getElementById("membershipStart").value || todayISO();

    const membershipPrice = Number(
        document.getElementById("membershipPrice").value || 0
    );

    const aerobicWeekly = Number(
        document.getElementById("aerobicWeekly").value || 0
    );

    const aerobicMonthly = Number(
        document.getElementById("aerobicMonthly").value || 0
    );

    const aerobicMonthlyPrice = Number(
        document.getElementById("aerobicMonthlyPrice").value || 0
    );

    if (!name || !Number.isInteger(sessions) || sessions <= 0) {
        alert("لطفاً نام شاگرد و تعداد جلسات معتبر را وارد کنید.");
        return;
    }

    if (
        ![
            membershipPrice,
            aerobicWeekly,
            aerobicMonthly,
            aerobicMonthlyPrice
        ].every(Number.isFinite) ||
        membershipPrice < 0 ||
        aerobicWeekly < 0 ||
        aerobicMonthly < 0 ||
        aerobicMonthlyPrice < 0
    ) {
        alert("مقادیر مالی و تعداد جلسات ایروبیک باید صفر یا بیشتر باشند.");
        return;
    }

    if (
        !Number.isInteger(aerobicWeekly) ||
        !Number.isInteger(aerobicMonthly)
    ) {
        alert("تعداد جلسات ایروبیک را به عدد صحیح وارد کنید.");
        return;
    }

    const student = {
        id: Date.now(),
        name,
        totalSessions: sessions,
        sessions,
        history: [],

        membershipType: membershipType === 3 ? 3 : 1,
        membershipStart,

        membershipEnd: addMonthsToISO(
            membershipStart,
            membershipType === 3 ? 3 : 1
        ),

        membershipPrice,
        aerobicWeekly,
        aerobicMonthly,
        aerobicMonthlyPrice
    };

    students.push(student);

    saveStudents();
    showStudents();

    [
        "name",
        "sessions",
        "membershipPrice",
        "aerobicMonthlyPrice"
    ].forEach(id => {
        document.getElementById(id).value = "";
    });

    document.getElementById("aerobicWeekly").value = "0";
    document.getElementById("aerobicMonthly").value = "0";
    document.getElementById("membershipType").value = "1";
    document.getElementById("membershipStart").value = todayISO();
}

function ensureStudentDefaults(student) {
    if (!Array.isArray(student.history)) {
        student.history = [];
    }

    if (typeof student.totalSessions !== "number") {
        student.totalSessions = Number(student.sessions) || 0;
    }

    if (typeof student.sessions !== "number") {
        student.sessions = Number(student.totalSessions) || 0;
    }

    if (!student.membershipType) {
        student.membershipType = 1;
    }

    if (!student.membershipStart) {
        student.membershipStart = todayISO();
    }

    if (!student.membershipEnd) {
        student.membershipEnd = addMonthsToISO(
            student.membershipStart,
            Number(student.membershipType) === 3 ? 3 : 1
        );
    }

    if (typeof student.membershipPrice !== "number") {
        student.membershipPrice = 0;
    }

    if (typeof student.aerobicWeekly !== "number") {
        student.aerobicWeekly = 0;
    }

    if (typeof student.aerobicMonthly !== "number") {
        student.aerobicMonthly = 0;
    }

    if (typeof student.aerobicMonthlyPrice !== "number") {
        student.aerobicMonthlyPrice = 0;
    }
}

function getMembershipStatus(student) {
    const today = todayISO();

    if (student.membershipEnd && student.membershipEnd < today) {
        return "🔴 اشتراک پایان‌یافته";
    }

    if (student.membershipEnd === today) {
        return "🟠 آخرین روز اشتراک";
    }

    if (student.sessions <= 0) {
        return "🔴 جلسات تمام شده";
    }

    if (student.sessions <= 2) {
        return "🟠 جلسات رو به پایان";
    }

    return "🟢 فعال";
}

function showStudents() {
    const box = document.getElementById("students");
    const searchInput = document.getElementById("search");

    if (!box || !searchInput) return;

    students.forEach(ensureStudentDefaults);

    const search = searchInput.value
        .trim()
        .toLocaleLowerCase("fa");

    box.innerHTML = "";

    const filteredStudents = students.filter(student =>
        String(student.name || "")
            .toLocaleLowerCase("fa")
            .includes(search)
    );

    if (filteredStudents.length === 0) {
        box.innerHTML = '<p class="empty-card">شاگردی پیدا نشد.</p>';
        return;
    }

    filteredStudents.forEach(student => {
        const div = document.createElement("article");

        div.className = "student-card";

        const membershipTypeText =
            Number(student.membershipType) === 3
                ? "سه‌ماهه"
                : "یک‌ماهه";

        const status = getMembershipStatus(student);

        div.innerHTML = `
            <h3>${escapeHTML(student.name)}</h3>

            <p class="d">
                <span>کل جلسات تمرینی</span>
                <strong>${formatNumber(student.totalSessions)}</strong>
            </p>

            <p class="d">
                <span>جلسات باقی‌مانده</span>
                <strong>${formatNumber(student.sessions)}</strong>
            </p>

            <p class="d">
                <span>وضعیت</span>
                <strong>${status}</strong>
            </p>

            <p class="d">
                <span>نوع اشتراک</span>
                <strong>${membershipTypeText}</strong>
            </p>

            <p class="d">
                <span>شروع اشتراک</span>
                <strong>${formatDate(student.membershipStart)}</strong>
            </p>

            <p class="d">
                <span>پایان اشتراک</span>
                <strong>${formatDate(student.membershipEnd)}</strong>
            </p>

            <p class="d">
                <span>شهریه اشتراک</span>
                <strong>${formatRial(student.membershipPrice)}</strong>
            </p>

            <p class="d">
                <span>ایروبیک در هفته</span>
                <strong>${formatNumber(student.aerobicWeekly)} جلسه</strong>
            </p>

            <p class="d">
                <span>ایروبیک در ماه</span>
                <strong>${formatNumber(student.aerobicMonthly)} جلسه</strong>
            </p>

            <p class="d">
                <span>شهریه ایروبیک ماهانه</span>
                <strong>${formatRial(student.aerobicMonthlyPrice)}</strong>
            </p>

            <div class="card-actions">
                <button
                    class="S1"
                    type="button"
                    onclick="attendance(${Number(student.id)})"
                >ثبت حضور</button>

                <button
                    class="S2"
                    type="button"
                    onclick="absence(${Number(student.id)})"
                >ثبت غیبت</button>

                <button
                    class="S3"
                    type="button"
                    onclick="showHistory(${Number(student.id)})"
                >نمایش تاریخچه</button>

                <button
                    class="S2"
                    type="button"
                    onclick="deleteStudent(${Number(student.id)})"
                >حذف شاگرد</button>
            </div>

            <div
                class="history-panel"
                id="history-${Number(student.id)}"
            ></div>
        `;

        box.appendChild(div);
    });

    saveStudents();
}

/* -------------------- ATTENDANCE / ABSENCE / HISTORY -------------------- */

function attendance(id) {
    const student = students.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) return;

    if (student.sessions <= 0) {
        alert(`⚠️ جلسات ${student.name} تمام شده است.`);
        return;
    }

    const now = new Date();

    student.sessions--;

    student.history.push({
        date: now.toLocaleDateString("fa-IR"),
        time: now.toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit"
        }),
        status: "حاضر"
    });

    saveStudents();
    showStudents();

    if (student.sessions === 0) {
        alert(`⚠️ جلسات ${student.name} به پایان رسید.`);
    } else if (student.sessions <= 2) {
        alert(
            `⚠️ فقط ${student.sessions} جلسه برای ${student.name} باقی مانده است.`
        );
    }
}

function absence(id) {
    const student = students.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) return;

    const now = new Date();

    student.history.push({
        date: now.toLocaleDateString("fa-IR"),
        time: now.toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit"
        }),
        status: "غایب"
    });

    saveStudents();
    showStudents();
}

function showHistory(id) {
    const student = students.find(
        item => Number(item.id) === Number(id)
    );

    if (!student) return;

    const historyBox = document.getElementById(`history-${id}`);

    if (!historyBox) return;

    historyBox.innerHTML = "";

    if (!student.history.length) {
        historyBox.innerHTML =
            "<p>هنوز حضور یا غیبتی ثبت نشده است.</p>";
        return;
    }

    const title = document.createElement("h4");

    title.textContent = "تاریخچه حضور و غیاب";

    historyBox.appendChild(title);

    student.history.forEach((item, index) => {
        const p = document.createElement("p");

        p.textContent =
            `جلسه ${index + 1} | ${item.date} | ${item.time} | وضعیت: ${item.status}`;

        historyBox.appendChild(p);
    });
}

function deleteStudent(id) {
    if (
        !confirm(
            "آیا مطمئن هستید که می‌خواهید این شاگرد را حذف کنید؟"
        )
    ) {
        return;
    }

    students = students.filter(
        student => Number(student.id) !== Number(id)
    );

    saveStudents();
    showStudents();
}

/* -------------------- INCOME RECORDS -------------------- */

function addIncome() {
    const category =
        document.getElementById("incomeCategory").value;

    const amount =
        Number(document.getElementById("incomeAmount").value);

    const date =
        document.getElementById("incomeDate").value;

    const note =
        document.getElementById("incomeNote").value.trim();

    if (!date || !Number.isFinite(amount) || amount <= 0) {
        alert("لطفاً تاریخ و مبلغ دریافتی معتبر را وارد کنید.");
        return;
    }

    incomes.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        category,
        amount: Math.round(amount),
        date,
        note
    });

    saveIncomes();

    document.getElementById("incomeAmount").value = "";
    document.getElementById("incomeNote").value = "";
    document.getElementById("incomeDate").value = todayISO();

    renderIncomeRows();
    renderReports();
}

function renderIncomeRows() {
    const tbody = document.getElementById("incomeRows");
    const empty = document.getElementById("incomeEmpty");

    if (!tbody) return;

    tbody.innerHTML = "";

    const sorted = [...incomes].sort((a, b) =>
        String(b.date).localeCompare(String(a.date))
    );

    sorted.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(formatDate(item.date))}</td>
            <td>${escapeHTML(incomeCategoryLabel(item.category))}</td>
            <td>${escapeHTML(formatRial(item.amount))}</td>
            <td>${escapeHTML(item.note || "—")}</td>
            <td>
                <button
                    class="small-delete"
                    type="button"
                    onclick="deleteIncome(${Number(item.id)})"
                >حذف</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    if (empty) {
        empty.hidden = incomes.length > 0;
    }

    const table = tbody.closest(".table-wrap");

    if (table) {
        table.hidden = incomes.length === 0;
    }
}

function deleteIncome(id) {
    if (!confirm("این درآمد از گزارش مالی حذف شود؟")) {
        return;
    }

    incomes = incomes.filter(
        item => Number(item.id) !== Number(id)
    );

    saveIncomes();

    renderIncomeRows();
    renderReports();
}

/* -------------------- MONTHLY REPORT -------------------- */

function renderReports() {
    const month = getSelectedMonth();

    const monthIncomes = incomes.filter(
        item => String(item.date || "").slice(0, 7) === month
    );

    const totals = {
        membership: 0,
        aerobicMonthly: 0,
        aerobicDaily: 0,
        programming: 0
    };

    monthIncomes.forEach(item => {
        const category =
            Object.prototype.hasOwnProperty.call(
                totals,
                item.category
            )
                ? item.category
                : null;

        if (category) {
            totals[category] += Number(item.amount) || 0;
        }
    });

    const total = Object.values(totals).reduce(
        (sum, amount) => sum + amount,
        0
    );

    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = formatRial(value);
        }
    };

    setText("monthlyTotal", total);
    setText("membershipTotal", totals.membership);
    setText("aerobicMonthlyTotal", totals.aerobicMonthly);
    setText("aerobicDailyTotal", totals.aerobicDaily);
    setText("programmingTotal", totals.programming);

    renderTrainerRows(total);
}

/* -------------------- TRAINER COMMISSIONS -------------------- */

function addTrainer() {
    const name =
        document.getElementById("trainerName").value.trim();

    const percent =
        Number(document.getElementById("trainerPercent").value);

    if (
        !name ||
        document.getElementById("trainerPercent").value === "" ||
        !Number.isFinite(percent) ||
        percent < 0 ||
        percent > 100
    ) {
        alert("نام مربی و درصدی بین صفر تا ۱۰۰ وارد کنید.");
        return;
    }

    trainers.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        percent
    });

    saveTrainers();

    document.getElementById("trainerName").value = "";
    document.getElementById("trainerPercent").value = "";

    renderReports();
}

function renderTrainerRows(monthlyTotal) {
    const tbody = document.getElementById("trainerRows");
    const empty = document.getElementById("trainerEmpty");

    if (!tbody) return;

    tbody.innerHTML = "";

    trainers.forEach(trainer => {
        const commission =
            monthlyTotal * (Number(trainer.percent) || 0) / 100;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(trainer.name)}</td>
            <td>${formatNumber(trainer.percent)}٪</td>
            <td>${escapeHTML(formatRial(commission))}</td>
            <td>
                <button
                    class="small-delete"
                    type="button"
                    onclick="deleteTrainer(${Number(trainer.id)})"
                >حذف</button>
            </td>
        `;

        tbody.appendChild(row);
    });

    if (empty) {
        empty.hidden = trainers.length > 0;
    }

    const table = tbody.closest(".table-wrap");

    if (table) {
        table.hidden = trainers.length === 0;
    }
}

function deleteTrainer(id) {
    if (!confirm("این مربی از فهرست حذف شود؟")) {
        return;
    }

    trainers = trainers.filter(
        trainer => Number(trainer.id) !== Number(id)
    );

    saveTrainers();
    renderReports();
}

/* -------------------- INITIALIZE -------------------- */

setDefaultDates();

students.forEach(ensureStudentDefaults);

saveStudents();
showStudents();
renderIncomeRows();
renderReports();
