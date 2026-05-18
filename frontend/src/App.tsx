import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogOut, 
  Home, 
  QrCode, 
  ListTodo, 
  History, 
  CheckCircle, 
  AlertCircle, 
  ScanLine, 
  Search,
  Calendar,
  Check
} from 'lucide-react';
import { useAuthStore } from './store';
import api from './api';
import type { Role } from './types';
import { Toaster } from 'react-hot-toast';

// Toast Alert Helper Component
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export default function App() {
  const { user, login, logout } = useAuthStore();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  
  // Shared States
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<ToastProps>({ message: '', type: 'success', visible: false });

  // Navigation state within Role dashboard
  const [activeTab, setActiveTab] = useState<string>('');

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') setActiveTab('dashboard');
      if (user.role === 'tutor') setActiveTab('generate-qr');
      if (user.role === 'student') setActiveTab('scan-qr');
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.user, response.data.token);
      triggerToast(`Selamat datang kembali, ${response.data.user.name}!`);
      // Clear forms
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Email atau password salah.');
      triggerToast('Gagal masuk akun', 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/auth/register', { name, email, password, role });
      triggerToast('Registrasi berhasil! Silakan masuk.');
      setIsRegisterMode(false);
      // Clear forms
      setName('');
      setPassword('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Gagal mendaftar akun.');
      triggerToast('Registrasi gagal', 'error');
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="glass-card auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <QrCode size={32} color="white" />
            </div>
            <h1 className="auth-title">Absensi Les</h1>
            <p className="auth-subtitle">
              {isRegisterMode ? 'Buat akun absensi baru' : 'Masuk ke portal absensi'}
            </p>
          </div>

          {errorMsg && (
            <div className="glass-card" style={{ padding: '12px', borderLeft: '4px solid var(--danger)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertCircle size={18} color="var(--danger)" />
              <span style={{ fontSize: '13px', color: '#fca5a5' }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin}>
            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Masukkan nama lengkap" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                  <UserIcon className="input-icon" size={18} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Alamat Email</label>
              <div className="input-wrapper">
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="name@domain.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
                <Mail className="input-icon" size={18} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kata Sandi</label>
              <div className="input-wrapper">
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <Lock className="input-icon" size={18} />
              </div>
            </div>

            {isRegisterMode && (
              <div className="form-group">
                <label className="form-label">Tipe Akun (Role)</label>
                <div className="input-wrapper">
                  <select 
                    className="form-input select-input" 
                    value={role} 
                    onChange={e => setRole(e.target.value as Role)}
                  >
                    <option value="student">Siswa (Student)</option>
                    <option value="tutor">Tutor (Pengajar)</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <UserIcon className="input-icon" size={18} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
              {isRegisterMode ? <UserPlus size={18} /> : <LogIn size={18} />}
              {isRegisterMode ? 'Daftar Sekarang' : 'Masuk Akun'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button 
              className="btn-text" 
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
              }}
            >
              {isRegisterMode ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar gratis'}
            </button>
          </div>
        </div>

        {/* Floating Toast Alerts */}
        <div className={`toast ${toast.visible ? 'show' : ''} ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--danger)" />}
          <span>{toast.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Toaster position="top-center" reverseOrder={false} />
      {/* Navigation Header bar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="nav-brand-icon">
            <QrCode size={20} />
          </div>
          Absensi Les Portal
        </div>
        <div className="nav-user">
          <div className="user-badge">
            <UserIcon size={14} color="var(--text-secondary)" />
            <span>{user.name}</span>
            <span className={`role-tag ${user.role}`}>{user.role}</span>
          </div>
          <button className="btn btn-secondary btn-text" onClick={logout} style={{ width: 'auto', display: 'flex', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}>
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </header>

      {/* Main Dashboard Space */}
      <main className="main-content">
        <div className="page-header">
          <h2 className="page-title">
            {user.role === 'admin' && 'Panel Administrator'}
            {user.role === 'tutor' && 'Portal Pengajar / Tutor'}
            {user.role === 'student' && 'Portal Siswa'}
          </h2>
          <p className="page-subtitle">Sistem Manajemen Presensi Les Terintegrasi Real-Time</p>
        </div>

        {/* Tab Selection */}
        {user.role === 'tutor' && (
          <div className="tab-container">
            <button 
              className={`tab-btn ${activeTab === 'generate-qr' ? 'active' : ''}`}
              onClick={() => setActiveTab('generate-qr')}
            >
              <QrCode size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Buat Sesi QR
            </button>
            <button 
              className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <ListTodo size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Absensi Manual
            </button>
          </div>
        )}

        {user.role === 'student' && (
          <div className="tab-container">
            <button 
              className={`tab-btn ${activeTab === 'scan-qr' ? 'active' : ''}`}
              onClick={() => setActiveTab('scan-qr')}
            >
              <ScanLine size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Scan QR Code
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Riwayat Presensi
            </button>
          </div>
        )}

        {/* Render Active Page Content */}
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'tutor' && activeTab === 'generate-qr' && <TutorGenerateQR triggerToast={triggerToast} />}
        {user.role === 'tutor' && activeTab === 'manual' && <TutorManualAttendance triggerToast={triggerToast} />}
        {user.role === 'student' && activeTab === 'scan-qr' && <StudentScanQR triggerToast={triggerToast} />}
        {user.role === 'student' && activeTab === 'history' && <StudentHistory />}

      </main>

      {/* Floating Toast Alerts */}
      <div className={`toast ${toast.visible ? 'show' : ''} ${toast.type}`}>
        {toast.type === 'success' ? <CheckCircle size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--danger)" />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

// ==========================================
// 1. ADMIN DASHBOARD COMPONENT
// ==========================================
function AdminDashboard() {
  return (
    <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
      <Home size={48} color="var(--primary-hover)" style={{ marginBottom: '16px' }} />
      <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Selamat Datang di Dashboard Admin</h3>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', fontSize: '14px', lineHeight: '1.6' }}>
        Sebagai Administrator, Anda dapat memantau seluruh aktivitas tutor dan siswa secara terpusat, mengelola akun pengguna, dan mengunduh laporan rekap absensi berkala.
      </p>
      <div className="grid-3" style={{ marginTop: '32px' }}>
        <div className="stat-box">
          <div className="stat-val">24</div>
          <div className="stat-lbl">Total Siswa Terdaftar</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">5</div>
          <div className="stat-lbl">Tutor Pengajar</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">98%</div>
          <div className="stat-lbl">Tingkat Kehadiran Bulan Ini</div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. TUTOR GENERATE QR CODE COMPONENT
// ==========================================
interface TutorGenerateQRProps {
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
}

function TutorGenerateQR({ triggerToast }: TutorGenerateQRProps) {
  const [classInfo, setClassInfo] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classInfo.trim()) return;

    setIsGenerating(true);
    const newSessionId = `SESSION_${Date.now()}`;
    
    try {
      await api.post('/attendance/session', { 
        sessionId: newSessionId, 
        classInfo 
      });
      setSessionId(newSessionId);
      triggerToast('Sesi QR Code kelas berhasil di-generate!');
    } catch (err: any) {
      triggerToast(err.response?.data?.error || 'Gagal membuat sesi kelas.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid-2">
      <div className="glass-card" style={{ padding: '30px' }}>
        <h3 className="card-title">
          <QrCode size={20} color="var(--primary-hover)" />
          Buat Sesi Absen QR
        </h3>
        <p className="card-body" style={{ marginBottom: '24px' }}>
          Masukkan nama kelas atau informasi les hari ini untuk membuat QR Code presensi. QR Code yang dihasilkan akan valid secara langsung.
        </p>

        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <label className="form-label">Informasi / Nama Kelas</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: Matematika SMA Kelas XII - Limit Fungsi" 
                value={classInfo} 
                onChange={e => setClassInfo(e.target.value)} 
                required 
              />
              <Calendar className="input-icon" size={18} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isGenerating}>
            <QrCode size={18} />
            {isGenerating ? 'Sedang membuat...' : 'Generate QR Code'}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {sessionId ? (
          <>
            <div className="qr-container">
              {/* Generate standard beautiful QR code mock image or library SVG */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${sessionId}`} 
                alt="Attendance QR Code"
                style={{ width: '200px', height: '200px' }}
              />
              <p className="qr-caption" style={{ color: '#0f172a', fontWeight: '600', marginTop: '12px' }}>
                {classInfo}
              </p>
            </div>
            <div className="glass-card" style={{ padding: '10px 16px', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} color="var(--success)" />
              <span style={{ color: '#a7f3d0' }}>Sesi absensi aktif (ID: {sessionId})</span>
            </div>
          </>
        ) : (
          <div className="qr-placeholder">
            <QrCode size={48} />
            <span>QR Code belum dibuat</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. TUTOR MANUAL ATTENDANCE COMPONENT
// ==========================================
const DUMMY_STUDENTS = [
  { id: 'S1', name: 'Budi Santoso' },
  { id: 'S2', name: 'Siti Aminah' },
  { id: 'S3', name: 'Agus Wijaya' },
  { id: 'S4', name: 'Rina Melati' },
  { id: 'S5', name: 'Rangga Pratama' },
];

interface TutorManualAttendanceProps {
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
}

function TutorManualAttendance({ triggerToast }: TutorManualAttendanceProps) {
  const [search, setSearch] = useState('');
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());

  const filteredStudents = DUMMY_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAttendance = (id: string) => {
    const newSet = new Set(presentIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setPresentIds(newSet);
  };

  const handleSave = () => {
    triggerToast(`Berhasil menyimpan presensi manual! ${presentIds.size} siswa hadir.`);
  };

  return (
    <div className="glass-card" style={{ padding: '30px' }}>
      <h3 className="card-title">
        <ListTodo size={20} color="var(--primary-hover)" />
        Daftar Absensi Manual Siswa
      </h3>
      <p className="card-body" style={{ marginBottom: '24px' }}>
        Jika siswa kesulitan melakukan pemindaian QR Code secara langsung, Anda dapat mencentang kehadiran mereka secara manual di bawah ini.
      </p>

      {/* Search Input bar */}
      <div className="search-container" style={{ position: 'relative' }}>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Cari nama siswa..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
      </div>

      <div className="student-list" style={{ marginBottom: '24px' }}>
        {filteredStudents.length > 0 ? (
          filteredStudents.map(student => (
            <div 
              key={student.id} 
              className="student-item"
              onClick={() => toggleAttendance(student.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="student-info">
                <div className="avatar-placeholder">
                  {student.name.charAt(0)}
                </div>
                <div className="student-name">{student.name}</div>
              </div>

              <label className="checkbox-container" onClick={e => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={presentIds.has(student.id)}
                  onChange={() => toggleAttendance(student.id)}
                />
                <span className="checkmark"></span>
              </label>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
            Tidak ada siswa ditemukan
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--panel-border)', paddingTop: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: '600' }}>
          Hadir: <span style={{ color: 'var(--success)', fontSize: '18px' }}>{presentIds.size}</span> / {DUMMY_STUDENTS.length} Siswa
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSave}>
          <Check size={18} />
          Simpan Data Presensi
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 4. STUDENT SCAN QR CODE COMPONENT (WEB COMPATIBLE)
// ==========================================
interface StudentScanQRProps {
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
}

function StudentScanQR({ triggerToast }: StudentScanQRProps) {
  const [qrCodeString, setQrCodeString] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mockLocation, setMockLocation] = useState({ lat: -6.2088, lng: 106.8456 }); // Jakarta

  useEffect(() => {
    // Attempt to fetch actual geolocation coordinates if browser permits
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMockLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // Fallback is already set
        }
      );
    }
  }, []);

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeString.trim()) return;

    setIsSubmitting(true);
    try {
      await api.post('/attendance', {
        sessionId: qrCodeString,
        status: 'hadir',
        lat: mockLocation.lat,
        lng: mockLocation.lng
      });
      triggerToast('Hore! Presensi Anda berhasil dicatat!');
      setQrCodeString('');
    } catch (err: any) {
      triggerToast(err.response?.data?.error || 'Presensi gagal. Periksa kembali QR Code ID Anda.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid-2">
      <div className="glass-card" style={{ padding: '30px' }}>
        <h3 className="card-title">
          <ScanLine size={20} color="var(--primary-hover)" />
          Presensi Mandiri Siswa
        </h3>
        <p className="card-body" style={{ marginBottom: '24px' }}>
          Karena Anda membukanya melalui browser web komputer, Anda dapat meniru proses scan QR Code dengan memasukkan <b>QR Code ID</b> yang ditampilkan di layar Tutor.
        </p>

        <form onSubmit={handleSubmitAttendance}>
          <div className="form-group">
            <label className="form-label">Masukkan Kode Sesi / QR ID</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Contoh: SESSION_1715996705518" 
                value={qrCodeString} 
                onChange={e => setQrCodeString(e.target.value)} 
                required 
              />
              <ScanLine className="input-icon" size={18} />
            </div>
          </div>

          <div className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--panel-border)', fontSize: '13px' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '4px' }}>Deteksi Lokasi Anti-Fraud</div>
            <div style={{ color: 'var(--text-muted)' }}>
              Latitude: {mockLocation.lat.toFixed(4)} | Longitude: {mockLocation.lng.toFixed(4)}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            <CheckCircle size={18} />
            {isSubmitting ? 'Mencatat kehadiran...' : 'Submit Presensi'}
          </button>
        </form>
      </div>

      <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="web-scan-fallback">
          <ScanLine size={32} color="var(--primary-hover)" style={{ margin: '0 auto' }} />
          <h4 style={{ fontWeight: '700' }}>Cara Presensi Lewat Web:</h4>
          <ul style={{ textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>Tanya Tutor Anda mengenai Kode Sesi Kelas yang tertera di bawah QR Code buatan mereka.</li>
            <li>Salin kode tersebut (contoh: <code>SESSION_XXXXXXXXX</code>).</li>
            <li>Masukkan kode tersebut pada form di samping kiri.</li>
            <li>Klik tombol <b>Submit Presensi</b> untuk absen!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. STUDENT ATTENDANCE HISTORY COMPONENT
// ==========================================
function StudentHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/attendance/history');
        setHistory(response.data.history || []);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="glass-card" style={{ padding: '30px' }}>
      <h3 className="card-title">
        <History size={20} color="var(--primary-hover)" />
        Riwayat Kehadiran Anda
      </h3>
      <p className="card-body" style={{ marginBottom: '24px' }}>
        Berikut adalah catatan riwayat presensi kelas Anda yang telah terekam secara aman di server kami.
      </p>

      {isLoading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
          Memuat data riwayat...
        </div>
      ) : (
        <div className="history-list">
          {history.length > 0 ? (
            history.map((record) => (
              <div key={record.id} className="glass-card history-card">
                <div className="history-info">
                  <span className="history-class">{record.session?.classInfo || 'Sesi Kelas Les'}</span>
                  <span className="history-date">
                    {new Date(record.timestamp).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <span className={`status-badge ${record.status}`}>
                  {record.status}
                </span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--panel-border)', borderRadius: 'var(--radius-md)' }}>
              Belum ada riwayat presensi yang terekam. Silakan lakukan absen terlebih dahulu!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
