export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold' }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>Halaman tidak ditemukan.</p>
      <a href="/" style={{ marginTop: '1rem', color: '#2563eb', textDecoration: 'underline' }}>Kembali ke Beranda</a>
    </div>
  );
}
