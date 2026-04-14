// Initialize Pins in LocalStorage
function initDatabase() {
    if (!localStorage.getItem('gfa_database')) {
        let pins = [];
        for (let i = 0; i < 1000; i++) {
            let serialNumber = 'GFA-' + (10000 + i);
            let pin = Math.floor(100000 + Math.random() * 900000).toString();
            pins.push({
                serial: serialNumber,
                pin: pin,
                used: false,
                formData: null
            });
        }
        localStorage.setItem('gfa_database', JSON.stringify(pins));
        console.log("Database initialized with 1000 pins.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDatabase();

    // DOM Elements
    const gateSection = document.getElementById('gate-section');
    const formSection = document.getElementById('form-section');
    const successSection = document.getElementById('success-section');
    const loginError = document.getElementById('login-error');

    const inputSerial = document.getElementById('gate-serial');
    const inputPin = document.getElementById('gate-pin');
    const adminBtn = document.getElementById('btn-generate-pins');
    const loginBtn = document.getElementById('btn-login');

    const form = document.getElementById('admission-form');
    const readOnlyBanner = document.getElementById('readonly-banner');
    const submitWrapper = document.getElementById('submit-wrapper');
    const readOnlyMsg = document.getElementById('read-only-msg');

    const fashionBgRadios = document.getElementsByName('first_time');
    const prevSchoolDiv = document.getElementById('previous-school-div');
    const currentSerialInput = document.getElementById('current-serial');

    // Admin: Download Pins
    adminBtn.addEventListener('click', () => {
        let db = JSON.parse(localStorage.getItem('gfa_database'));
        let csvContent = "Serial Number,PIN,Used Status\n";

        db.forEach(row => {
            csvContent += `${row.serial},${row.pin},${row.used ? 'Used' : 'Unused'}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "gfa_serial_pins.csv");
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // Toggle Previous School Field
    Array.from(fashionBgRadios).forEach(radio => {
        radio.addEventListener('change', () => {
            if (document.getElementById('ft-no').checked) {
                prevSchoolDiv.classList.remove('hidden');
                document.querySelector('textarea[name="previous_school"]').required = true;
            } else {
                prevSchoolDiv.classList.add('hidden');
                document.querySelector('textarea[name="previous_school"]').required = false;
            }
        });
    });

    // Passport Preview Logic
    const passportUpload = document.getElementById('passport-upload');
    const previewImg = document.getElementById('preview-img');
    const previewText = document.getElementById('preview-text');

    if (passportUpload) {
        passportUpload.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const url = URL.createObjectURL(this.files[0]);
                previewImg.src = url;
                previewImg.style.display = 'block';
                previewText.style.display = 'none';
            } else {
                previewImg.style.display = 'none';
                previewText.style.display = 'inline';
            }
        });
    }

    // Handle Login
    loginBtn.addEventListener('click', () => {
        const serial = inputSerial.value.trim().toUpperCase();
        const pin = inputPin.value.trim();

        if (!serial || !pin) {
            loginError.innerText = "Please enter both Serial and PIN.";
            loginError.style.display = 'block';
            return;
        }

        let db = JSON.parse(localStorage.getItem('gfa_database'));
        let record = db.find(r => r.serial === serial && r.pin === pin);

        if (record) {
            loginError.style.display = 'none';
            openForm(record);
        } else {
            loginError.innerText = "Invalid Serial Number or PIN.";
            loginError.style.display = 'block';
        }
    });

    // Open Form State (New or Read-Only)
    function openForm(record) {
        gateSection.classList.add('hidden');
        formSection.classList.remove('hidden');
        currentSerialInput.value = record.serial;

        if (record.used) {
            // Apply Read-Only Mode
            readOnlyBanner.classList.remove('hidden');
            submitWrapper.classList.add('hidden');
            readOnlyMsg.classList.remove('hidden');
            form.classList.add('read-only');

            // Populate data safely
            let data = record.formData;
            for (let key in data) {
                let elems = form.elements[key];
                if (!elems) continue;

                if (elems.length !== undefined && elems.type !== 'select-one') {
                    // Radio buttons or multiple inputs
                    Array.from(elems).forEach(el => {
                        if (el.value === data[key]) el.checked = true;
                    });
                } else {
                    if (elems.type === 'checkbox') {
                        elems.checked = (data[key] === true || data[key] === "on");
                    } else {
                        elems.value = data[key];
                    }
                }
            }

            // Check if we need to show the previous school
            if (data['first_time'] === "No") {
                prevSchoolDiv.classList.remove('hidden');
            }

            // Handle passport visual for Read-Only
            const previewText = document.getElementById('preview-text');
            if (previewText) {
                previewText.innerText = "Submitted\nSafely";
                previewText.style.color = "#137333";
            }
            const pUpload = document.getElementById('passport-upload');
            if (pUpload) {
                pUpload.type = "text";
                pUpload.value = "Image stored securely.";
                pUpload.style.border = "none";
                pUpload.style.background = "transparent";
            }
        }
    }

    // Submit Logic
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Gather Data
        const formData = new FormData(form);
        const dataObj = Object.fromEntries(formData.entries());

        // 2. Formatting Email
        let emailBody = `GFA ADMISSION APPLICATION\n`;
        emailBody += `Serial Number: ${dataObj['current-serial']}\n\n`;
        emailBody += `--- SECTION A: PARTICULARS ---\n`;
        emailBody += `Name: ${dataObj.surname}, ${dataObj.firstname} ${dataObj.othernames}\n`;
        emailBody += `Gender: ${dataObj.gender}\n`;
        emailBody += `DOB / POB: ${dataObj.dob} / ${dataObj.pob}\n`;
        emailBody += `Hometown: ${dataObj.hometown}\n`;
        emailBody += `Religion: ${dataObj.religion}\n`;
        emailBody += `Status: ${dataObj.residential}\n\n`;

        emailBody += `--- SECTION B: CONTACT & BACKGROUND ---\n`;
        emailBody += `Address: ${dataObj.contact_address}\n`;
        emailBody += `Living Situation: ${dataObj.living_situation}\n`;
        emailBody += `First Time in Fashion Center?: ${dataObj.first_time}\n`;
        if (dataObj.first_time === 'No') {
            emailBody += `Previous School: ${dataObj.previous_school}\n`;
        }

        emailBody += `\n--- SECTION C: FAMILY ---\n`;
        emailBody += `Father: ${dataObj.father_name} (${dataObj.father_phone}) - ${dataObj.father_job}\n`;
        emailBody += `Mother: ${dataObj.mother_name} (${dataObj.mother_phone}) - ${dataObj.mother_job}\n`;
        emailBody += `Emergency Contact: ${dataObj.emergency_name} (${dataObj.emergency_phone})\n\n`;

        emailBody += `--- SECTION D: MEDICAL ---\n`;
        emailBody += `Doctor: ${dataObj.doctor_name} (${dataObj.doctor_phone})\n`;
        emailBody += `Asthma: ${dataObj.asthma}\n`;
        emailBody += `NHIS: ${dataObj.nhis}\n`;
        emailBody += `Other Needs: ${dataObj.other_needs}\n`;

        // 3. Mark in DB as Used
        let db = JSON.parse(localStorage.getItem('gfa_database'));
        let index = db.findIndex(r => r.serial === dataObj['current-serial']);
        if (index > -1) {
            db[index].used = true;
            db[index].formData = dataObj;
            localStorage.setItem('gfa_database', JSON.stringify(db));
        }

        // 4. Send background email via standard FormSubmit POST
        // (Bypasses browser security blocks for local files)
        const subject = `New Admission Application: ${dataObj.firstname} ${dataObj.surname} (${dataObj['current-serial']})`;

        // Change button to show loading state
        const btnSubmit = document.getElementById('btn-submit');
        btnSubmit.innerText = "Redirecting to Mail Server...";
        btnSubmit.disabled = true;

        // Build a temporary form to submit the data natively
        const mailForm = document.createElement("form");
        mailForm.method = "POST";
        mailForm.action = "https://formsubmit.co/generalfashionacademyaccra@gmail.com";
        mailForm.enctype = "multipart/form-data";

        // Attach Passport Photo File Input to the mailForm
        const passportInput = document.getElementById('passport-upload');
        if (passportInput && passportInput.files.length > 0) {
            // We append the original input node to the hidden form so it brings the file along!
            mailForm.appendChild(passportInput);
        }

        const inputSubject = document.createElement("input");
        inputSubject.type = "hidden";
        inputSubject.name = "_subject";
        inputSubject.value = subject;
        mailForm.appendChild(inputSubject);

        const inputData = document.createElement("input");
        inputData.type = "hidden";
        inputData.name = "Applicant Details";
        inputData.value = emailBody;
        mailForm.appendChild(inputData);

        const inputCaptcha = document.createElement("input");
        inputCaptcha.type = "hidden";
        inputCaptcha.name = "_captcha";
        inputCaptcha.value = "false";
        mailForm.appendChild(inputCaptcha);

        document.body.appendChild(mailForm);
        mailForm.submit();
    });
});
