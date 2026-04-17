// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCBPpRvPqm5i7DKnz14t6-k8VuCor211mU",
    authDomain: "attendancesystem-ca485.firebaseapp.com",
    databaseURL: "https://attendancesystem-ca485-default-rtdb.firebaseio.com",
    projectId: "attendancesystem-ca485",
    storageBucket: "attendancesystem-ca485.firebasestorage.app",
    messagingSenderId: "916664297885",
    appId: "1:916664297885:web:7883b0302cf7475e5a2774"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 2. Navigation Logic
function showSection(sectionId) {
    document.querySelectorAll('.app-section').forEach(section => {
        section.style.display = 'none';
    });
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';

    if (sectionId === 'history-zone') loadAllHistory();
}

// 3. QR Generation (Fixed: all logic is now INSIDE the event listener)
document.getElementById('generateSessionBtn').addEventListener('click', () => {
    const user = firebase.auth().currentUser;

    if (!user) return alert("Access Denied: Please log in as a teacher.");

    const subject = document.getElementById('subject').value.trim();
    const date = document.getElementById('session-date').value;

    if (!subject || !date) return alert("Enter Subject and Date");

    const sessionID = `${subject}_${date}`.replace(/\s+/g, '_');
    const currentUrl = window.location.origin + window.location.pathname;
    const sessionUrl = `${currentUrl}?session=${encodeURIComponent(sessionID)}&subject=${encodeURIComponent(subject)}`;

    // Generate the QR Code
    document.getElementById('qrcode').innerHTML = "";
    new QRCode(document.getElementById("qrcode"), {
        text: sessionUrl,
        width: 200,
        height: 200
    });

    document.getElementById('qrcode-display').style.display = 'block';

    // Reset counter and start the Live Listener
    document.getElementById('count-present').innerText = "0";
    updateLiveStats(sessionID);
}); // <-- Listener correctly closes here

// 4. Student Mode Logic
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionID = urlParams.get('session');
    const subject = urlParams.get('subject');

    if (sessionID && subject) {
        showSection('student-zone');
        document.getElementById('active-session-name').innerText = "Class: " + subject;
    }
});

// Student attendance submission
document.getElementById('submitAttendanceBtn').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionID = urlParams.get('session');

    const name = document.getElementById('student-name').value.trim();
    const roll = document.getElementById('student-roll').value.trim();

    if (!name || !roll) return alert("Please enter your name and roll number.");

    const user = firebase.auth().currentUser;
    if (!user) return alert("Please log in to mark attendance.");

    const studentUID = user.uid;

    database.ref('history/' + sessionID).orderByChild('uid').equalTo(studentUID).once('value', snapshot => {
        if (snapshot.exists()) {
            alert("Proxy Error: Attendance already marked for this account.");
            return;
        }

        database.ref('history/' + sessionID).push({
            name: name,
            roll: roll,
            uid: studentUID,
            time: new Date().toLocaleTimeString()
        });

        document.getElementById('student-input-group').style.display = 'none';
        document.getElementById('confirmation-msg').style.display = 'block';
    });
});

// 5. Live Stats & History Display
function updateLiveStats(currentSessionId) {
    const sessionRef = database.ref('history/' + currentSessionId);
    sessionRef.on('value', (snapshot) => {
        const total = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        document.getElementById('count-present').innerText = total;
    });
}

function loadAllHistory() {
    const tbody = document.querySelector("#attendancetable tbody");
    tbody.innerHTML = "";
    database.ref('history').once('value', (parentSnapshot) => {
        parentSnapshot.forEach((sessionSnapshot) => {
            sessionSnapshot.forEach((studentSnapshot) => {
                renderRow(studentSnapshot.val());
            });
        });
    });
}

function renderRow(data) {
    const tbody = document.querySelector("#attendancetable tbody");
    const row = `<tr>
        <td>${data.roll}</td>
        <td><b>${data.name}</b></td>
        <td>${data.time}</td>
        <td><span style="color:var(--success)">● Verified</span></td>
    </tr>`;
    tbody.insertAdjacentHTML('afterbegin', row);
}

// CSV Export
document.getElementById('exportBtn').addEventListener('click', () => {
    const rows = document.querySelectorAll("#attendancetable tbody tr");
    if (rows.length === 0) return alert("No history data to download!");
    let csv = "Roll No,Name,Time,Status\n";
    rows.forEach(r => csv += Array.from(r.querySelectorAll("td")).map(c => c.innerText).join(",") + "\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Attendance_Report_${new Date().toLocaleDateString()}.csv`;
    a.click();
});
