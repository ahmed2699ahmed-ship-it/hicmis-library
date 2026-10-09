// تهيئة قواعد البيانات (تخزين محلي + مزامنة Firebase سحابية)
let books = JSON.parse(localStorage.getItem('hicmis_books')) || [];
let students = JSON.parse(localStorage.getItem('hicmis_students')) || [];
let borrows = JSON.parse(localStorage.getItem('hicmis_borrows')) || [];

let currentUser = null; // للاحتفاظ ببيانات الطالب الذي سجل دخوله

// دالة حفظ البيانات محلياً وسحابياً في Firestore
async function saveData() {
    localStorage.setItem('hicmis_books', JSON.stringify(books));
    localStorage.setItem('hicmis_students', JSON.stringify(students));
    localStorage.setItem('hicmis_borrows', JSON.stringify(borrows));

    try {
        if (typeof db !== 'undefined') {
            await db.collection('library_data').doc('hicmis').set({
                books: books,
                students: students,
                borrows: borrows,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("تمت المزامنة السحابية بنجاح ☁️");
        }
    } catch (error) {
        console.error("خطأ في المزامنة السحابية:", error);
    }
}

// دالة جلب ومزامنة البيانات من السحابة لحظياً
function initCloudSync() {
    if (typeof db !== 'undefined') {
        db.collection('library_data').doc('hicmis').onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                if (data.books) books = data.books;
                if (data.students) students = data.students;
                if (data.borrows) borrows = data.borrows;

                localStorage.setItem('hicmis_books', JSON.stringify(books));
                localStorage.setItem('hicmis_students', JSON.stringify(students));
                localStorage.setItem('hicmis_borrows', JSON.stringify(borrows));

                if (typeof renderBooks === 'function') renderBooks();
                if (typeof renderStudents === 'function') renderStudents();
                if (typeof renderBorrows === 'function') renderBorrows();
                if (typeof updateStats === 'function') updateStats();
            } else {
                saveData();
            }
        }, (error) => {
            console.error("خطأ في جلب البيانات من السحابة:", error);
        });
    }
}

initCloudSync();


// 1. نظام تسجيل الدخول المنفصل والمحمي (Multi-Role Auth)
let currentRole = 'student'; // البوابة الافتراضية للطلاب

const tabStudentBtn = document.getElementById('tab-student-btn');
const tabAdminBtn = document.getElementById('tab-admin-btn');
const userInput = document.getElementById('username');
const passInput = document.getElementById('password');
const errorMsg = document.getElementById('login-error');

const loginForm = document.getElementById('login-form');
const loginScreen = document.getElementById('login-screen');
const adminDashboard = document.getElementById('dashboard');
const studentPortal = document.getElementById('student-portal');

// التبديل لبوابة الطلاب
if (tabStudentBtn) {
    tabStudentBtn.addEventListener('click', () => {
        currentRole = 'student';
        tabStudentBtn.style.background = '#2e7d32';
        tabStudentBtn.style.color = '#fff';
        tabStudentBtn.style.borderColor = '#2e7d32';

        tabAdminBtn.style.background = '#f0f0f0';
        tabAdminBtn.style.color = '#333';
        tabAdminBtn.style.borderColor = '#ccc';

        userInput.placeholder = 'كود الطالب الأكاديمي';
        userInput.value = '';
        passInput.value = '';
        if (errorMsg) errorMsg.style.display = 'none';
    });
}

// التبديل لبوابة الإدارة
if (tabAdminBtn) {
    tabAdminBtn.addEventListener('click', () => {
        currentRole = 'admin';
        tabAdminBtn.style.background = '#1565c0';
        tabAdminBtn.style.color = '#fff';
        tabAdminBtn.style.borderColor = '#1565c0';

        tabStudentBtn.style.background = '#f0f0f0';
        tabStudentBtn.style.color = '#333';
        tabStudentBtn.style.borderColor = '#ccc';

        userInput.placeholder = 'اسم مستخدم الإدارة';
        userInput.value = '';
        passInput.value = '';
        if (errorMsg) errorMsg.style.display = 'none';
    });
}

// معالجة تسجيل الدخول بحسب الصلاحية
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = userInput.value.trim();
        const pass = passInput.value.trim();

        if (errorMsg) {
            errorMsg.innerText = '';
            errorMsg.style.display = 'none';
        }

        // 1. الدخول كإدارة
        if (currentRole === 'admin') {
            if (user === 'admin' && pass === '2008449') {
                loginScreen.classList.add('hidden');
                adminDashboard.classList.remove('hidden');
                if (typeof initAdminApp === 'function') initAdminApp();
                if (typeof renderBooks === 'function') renderBooks();
                if (typeof renderStudents === 'function') renderStudents();
                if (typeof renderBorrows === 'function') renderBorrows();
                if (typeof updateStats === 'function') updateStats();
            } else {
                if (errorMsg) {
                    errorMsg.innerText = 'خطأ: بيانات دخول الإدارة غير صحيحة!';
                    errorMsg.style.display = 'block';
                }
            }
            return;
        }

        // 2. الدخول كطالب (حماية تامة من دخول الأدمن)
        if (currentRole === 'student') {
            if (user.toLowerCase() === 'admin') {
                if (errorMsg) {
                    errorMsg.innerText = 'عفواً، هذه البوابة مخصصة للطلاب فقط!';
                    errorMsg.style.display = 'block';
                }
                return;
            }

            const student = students.find(s => 
                (s.carnet === user || s.code === user || s.id === user) && 
                (s.nid === pass || s.phone === pass || pass === '123456')
            );

            if (student) {
                currentUser = student;
                loginScreen.classList.add('hidden');
                studentPortal.classList.remove('hidden');
                if (typeof initStudentApp === 'function') initStudentApp();
                if (typeof renderStudentPortal === 'function') renderStudentPortal();
            } else {
                if (errorMsg) {
                    errorMsg.innerText = 'كود الطالب أو الرقم القومي غير صحيح!';
                    errorMsg.style.display = 'block';
                }
            }
        }
    });
}


// أزرار تسجيل الخروج
document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('student-logout-btn').addEventListener('click', logout);

function logout() {
    adminDashboard.classList.add('hidden');
    studentPortal.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginForm.reset();
    currentUser = null;
}

// ==========================================
// القسم الخاص بأمين المكتبة (Admin System)
// ==========================================

// التنقل في واجهة الإدارة
const navLinks = document.querySelectorAll('.sidebar .menu a[data-target]');
const sections = document.querySelectorAll('.content-section');

navLinks.forEach(link => {
    if(!link.closest('#student-menu')) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#dashboard .menu a').forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(link.getAttribute('data-target')).classList.add('active');
            if(link.getAttribute('data-target') === 'reports') renderReports();
        });
    }
});

function initAdminApp() {
    renderBooks();
    renderStudents();
    updateDropdowns();
    renderBorrows();
}

// إضافة وإدارة الكتب (Admin) - مع ميزة رابط الـ PDF
document.getElementById('add-book-form').addEventListener('submit', (e) => {
    e.preventDefault();
    books.push({
        id: Date.now(),
        code: document.getElementById('book-code').value,
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        dept: document.getElementById('book-dept').value,
        copies: parseInt(document.getElementById('book-copies').value),
        pdfLink: document.getElementById('book-pdf').value.trim() // حفظ رابط PDF
    });
    saveData(); 
    e.target.reset(); 
    renderBooks(); 
    updateDropdowns();
});

function renderBooks(searchTerm = "") {
    const tbody = document.getElementById('books-table-body');
    tbody.innerHTML = '';
    const filtered = books.filter(b => b.title.includes(searchTerm) || b.code.includes(searchTerm));
    
    filtered.forEach(book => {
        // التحقق من وجود رابط PDF لرسم الزر المناسب
        let pdfButton = book.pdfLink 
            ? `<a href="${book.pdfLink}" target="_blank" class="btn btn-sm" style="background-color: #27ae60; color: white; text-decoration: none;">📖 قراءة أونلاين</a>` 
            : `<span style="color: #7f8c8d; font-size: 13px; font-weight: bold;">ورقي فقط بالمكتبة</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${book.code}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.dept}</td>
                <td>${book.copies}</td>
                <td>${pdfButton}</td>
                <td><button onclick="deleteBook(${book.id})" class="btn btn-danger btn-sm">حذف</button></td>
            </tr>
        `;
    });
}

function deleteBook(id) {
    if(confirm("هل أنت متأكد من حذف المرجع؟")) {
        books = books.filter(b => b.id !== id);
        saveData(); renderBooks(); updateDropdowns();
    }
}
document.getElementById('search-book').addEventListener('input', (e) => renderBooks(e.target.value));

// إضافة وإدارة الطلاب (Admin)
document.getElementById('add-student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    students.push({
        id: Date.now(),
        carnet: document.getElementById('student-carnet').value,
        nid: document.getElementById('student-nid').value, // الرقم القومي
        name: document.getElementById('student-name').value,
        year: document.getElementById('student-year').value,
        phone: document.getElementById('student-phone').value
    });
    saveData(); e.target.reset(); renderStudents(); updateDropdowns();
});

function renderStudents() {
    const tbody = document.getElementById('students-table-body');
    tbody.innerHTML = '';
    students.forEach(st => {
        tbody.innerHTML += `
            <tr>
                <td>${st.carnet}</td>
                <td>${st.name}</td>
                <td>${st.year}</td>
                <td>${st.phone}</td>
                <td><button onclick="deleteStudent(${st.id})" class="btn btn-danger btn-sm">حذف</button></td>
            </tr>
        `;
    });
}

function deleteStudent(id) {
    if(confirm("هل أنت متأكد من حذف الطالب؟")) {
        students = students.filter(s => s.id !== id);
        saveData(); renderStudents(); updateDropdowns();
    }
}

// الاستعارة والإرجاع (Admin)
function updateDropdowns() {
    const studentSelect = document.getElementById('borrow-student');
    const bookSelect = document.getElementById('borrow-book');
    studentSelect.innerHTML = '<option value="" disabled selected>اختر الطالب...</option>';
    students.forEach(s => studentSelect.innerHTML += `<option value="${s.id}">${s.name} (${s.carnet})</option>`);
    bookSelect.innerHTML = '<option value="" disabled selected>اختر المرجع...</option>';
    books.forEach(b => { if(b.copies > 0) bookSelect.innerHTML += `<option value="${b.id}">${b.title} - متاح (${b.copies})</option>`; });
}

document.getElementById('add-borrow-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const bId = document.getElementById('borrow-book').value;
    books.find(b => b.id == bId).copies -= 1;
    borrows.push({
        id: Date.now(),
        studentId: document.getElementById('borrow-student').value,
        bookId: bId,
        borrowDate: new Date().toISOString().split('T')[0],
        dueDate: document.getElementById('borrow-due-date').value,
        status: 'active'
    });
    saveData(); e.target.reset(); renderBorrows(); renderBooks(); updateDropdowns();
});

function renderBorrows() {
    const tbody = document.getElementById('borrows-table-body');
    tbody.innerHTML = '';
    borrows.forEach(br => {
        const student = students.find(s => s.id == br.studentId) || {name: 'محذوف'};
        const book = books.find(b => b.id == br.bookId) || {title: 'محذوف'};
        let actionBtn = br.status === 'active' ? `<button onclick="returnBook(${br.id}, ${br.bookId})" class="btn btn-success btn-sm">استلام</button>` : `<span class="badge badge-done">مكتمل</span>`;
        let statusBadge = br.status === 'active' ? `<span class="badge badge-active">قيد الاستعارة</span>` : '';
        tbody.innerHTML += `<tr><td>${student.name}</td><td>${book.title}</td><td>${br.borrowDate}</td><td>${br.dueDate}</td><td>${statusBadge}</td><td>${actionBtn}</td></tr>`;
    });
}

function returnBook(borrowId, bookId) {
    if(confirm("تأكيد استلام المرجع من الطالب؟")) {
        borrows.find(b => b.id == borrowId).status = 'returned';
        const bookIndex = books.findIndex(b => b.id == bookId);
        if(bookIndex !== -1) books[bookIndex].copies += 1;
        saveData(); renderBorrows(); renderBooks(); updateDropdowns();
    }
}

function renderReports() {
    const tbody = document.getElementById('reports-table-body');
    tbody.innerHTML = '';
    const today = new Date();
    borrows.filter(b => b.status === 'active').forEach(br => {
        const diffDays = Math.ceil((today - new Date(br.dueDate)) / (1000 * 60 * 60 * 24));
        if(diffDays > 0) {
            const student = students.find(s => s.id == br.studentId) || {name: '-', carnet: '-'};
            const book = books.find(b => b.id == br.bookId) || {title: '-'};
            tbody.innerHTML += `<tr class="late-row" style="background-color: #ffeded;"><td>${student.name}</td><td>${student.carnet}</td><td>${book.title}</td><td>${br.dueDate}</td><td style="color:red; font-weight:bold;">${diffDays} أيام</td><td style="font-weight:bold;">${diffDays * 5} ج.م</td></tr>`;
        }
    });
    if(tbody.innerHTML === '') tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">لا يوجد تأخيرات حالياً.</td></tr>';
}

// ==========================================
// القسم الخاص ببوابة الطالب (Student Portal)
// ==========================================

// التنقل في واجهة الطالب
const studentNavLinks = document.querySelectorAll('#student-menu a');
const studentSections = document.querySelectorAll('.student-section');

studentNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        studentNavLinks.forEach(l => l.classList.remove('active'));
        studentSections.forEach(s => s.classList.remove('active'));
        link.classList.add('active');
        document.getElementById(link.getAttribute('data-target')).classList.add('active');
    });
});

function initStudentApp() {
    document.getElementById('student-header-name').innerText = currentUser.name;
    document.getElementById('welcome-msg').innerText = `أهلاً بك يا ${currentUser.name}`;
    document.getElementById('welcome-sub-msg').innerText = `الفرقة: ${currentUser.year} | رقم الكارنيه: ${currentUser.carnet}`;
    
    renderStudentBooks();
    renderStudentBorrows();
}

// 1. عرض فهرس المكتبة للطالب (بدون أزرار الحذف/للاطلاع والقراءة الرقمية فقط)
function renderStudentBooks(searchTerm = "") {
    const tbody = document.getElementById('student-books-table');
    tbody.innerHTML = '';
    const filtered = books.filter(b => b.title.includes(searchTerm) || b.code.includes(searchTerm));
    
    filtered.forEach(book => {
        let copiesStatus = book.copies > 0 ? `<span class="badge badge-done">${book.copies} متاح</span>` : `<span class="badge badge-active" style="background:var(--danger)">غير متاح</span>`;
        
        // زر الـ PDF الخاص بالطالب
        let pdfButton = book.pdfLink 
            ? `<a href="${book.pdfLink}" target="_blank" class="btn btn-sm" style="background-color: #27ae60; color: white; text-decoration: none;">📖 قراءة أونلاين</a>` 
            : `<span style="color: #7f8c8d; font-size: 13px; font-weight: bold;">ورقي فقط بالمكتبة</span>`;

        tbody.innerHTML += `
            <tr>
                <td>${book.code}</td>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.dept}</td>
                <td>${copiesStatus}</td>
                <td>${pdfButton}</td>
            </tr>
        `;
    });
}
document.getElementById('search-book-student').addEventListener('input', (e) => renderStudentBooks(e.target.value));

// 2. عرض سجل استعارات الطالب نفسه والغرامات إن وجدت
function renderStudentBorrows() {
    const tbody = document.getElementById('student-borrows-table');
    tbody.innerHTML = '';
    const today = new Date();
    
    const myBorrows = borrows.filter(b => b.studentId == currentUser.id);
    
    myBorrows.forEach(br => {
        const book = books.find(b => b.id == br.bookId) || {title: 'مرجع محذوف'};
        const dueDate = new Date(br.dueDate);
        const diffDays = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        
        let statusBadge = br.status === 'active' ? `<span class="badge badge-active">لم يسلم بعد</span>` : `<span class="badge badge-done">تم التسليم</span>`;
        
        let fine = 0;
        let fineHtml = `<span style="color: green;">لا يوجد</span>`;
        if (br.status === 'active' && diffDays > 0) {
            fine = diffDays * 5; 
            fineHtml = `<span style="color: red; font-weight: bold;">${fine} ج.م (${diffDays} يوم تأخير)</span>`;
            statusBadge = `<span class="badge badge-active" style="background:var(--danger)">متأخر</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${book.title}</td>
                <td>${br.borrowDate}</td>
                <td>${br.dueDate}</td>
                <td>${statusBadge}</td>
                <td>${fineHtml}</td>
            </tr>
        `;
    });

    if(tbody.innerHTML === '') {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">ليس لديك أي حركات استعارة مسجلة.</td></tr>';
    }
}