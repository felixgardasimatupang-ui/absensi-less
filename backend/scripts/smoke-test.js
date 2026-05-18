require('dotenv/config');
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    rootDir: '.',
  },
});

const { app } = require('../src/server');

async function main() {
  const server = await new Promise((resolve) => {
    const instance = app.listen(3100, () => resolve(instance));
  });

  const baseUrl = 'http://127.0.0.1:3100/api';

  try {
    const tutorLogin = await post(`${baseUrl}/auth/login`, {
      email: 'tutor@absensiles.local',
      password: 'Tutor1234!',
    });
    assert(tutorLogin.ok, `Tutor login gagal: ${JSON.stringify(tutorLogin.body)}`);
    const tutorToken = tutorLogin.body.token;

    const createSession = await post(
      `${baseUrl}/attendance/session`,
      { classInfo: 'Matematika SMA XII - Smoke Test' },
      tutorToken,
    );
    assert(createSession.ok, `Create session gagal: ${JSON.stringify(createSession.body)}`);
    const sessionId = createSession.body.session.id;

    const studentLogin = await post(`${baseUrl}/auth/login`, {
      email: 'student@absensiles.local',
      password: 'Student1234!',
    });
    assert(studentLogin.ok, `Student login gagal: ${JSON.stringify(studentLogin.body)}`);
    const studentToken = studentLogin.body.token;

    const submitAttendance = await post(
      `${baseUrl}/attendance`,
      {
        sessionId,
        status: 'hadir',
        lat: -6.2,
        lng: 106.8,
      },
      studentToken,
    );
    assert(submitAttendance.ok, `Submit attendance gagal: ${JSON.stringify(submitAttendance.body)}`);

    const studentHistory = await get(`${baseUrl}/attendance/history`, studentToken);
    assert(studentHistory.ok, `Get history gagal: ${JSON.stringify(studentHistory.body)}`);
    assert(Array.isArray(studentHistory.body.history), 'History response bukan array.');
    assert(studentHistory.body.history.some((item) => item.sessionId === sessionId), 'Session baru tidak muncul di history.');

    const studentsList = await get(`${baseUrl}/attendance/students`, tutorToken);
    assert(studentsList.ok, `Get students gagal: ${JSON.stringify(studentsList.body)}`);
    assert(Array.isArray(studentsList.body.students), 'Students response bukan array.');
    const secondStudent = studentsList.body.students.find((student) => student.email === 'student2@absensiles.local');
    assert(secondStudent, 'Akun student2 tidak ditemukan untuk uji manual attendance.');

    const manualAttendance = await post(
      `${baseUrl}/attendance/manual`,
      {
        classInfo: 'Fisika SMA XI - Smoke Test',
        studentIds: [secondStudent.id],
      },
      tutorToken,
    );
    assert(manualAttendance.ok, `Manual attendance gagal: ${JSON.stringify(manualAttendance.body)}`);

    console.log('Smoke test backend berhasil: login, session, attendance, history, students, manual attendance.');
  } finally {
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }
}

async function post(url, body, token) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.json(),
  };
}

async function get(url, token) {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.json(),
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
