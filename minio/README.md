# MinIO Setup untuk Windows (Native)

## 📦 Instalasi

### 1. Download MinIO

Jalankan di PowerShell:

```powershell
cd E:\PKL\peminjaman-tempat\minio
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "minio.exe"
```

### 2. Jalankan MinIO Server

Double-click file: `start-minio.bat`

Atau via PowerShell:

```powershell
cd E:\PKL\peminjaman-tempat\minio
.\start-minio.bat
```

## 🌐 Akses MinIO

- **Console (Web UI)**: http://127.0.0.1:9001
- **API Endpoint**: http://127.0.0.1:9000
- **Username**: minioadmin
- **Password**: minioadmin

## 🪣 Setup Bucket (PENTING!)

1. Buka http://127.0.0.1:9001
2. Login dengan credentials di atas
3. Klik menu **"Buckets"** di sidebar kiri
4. Klik tombol **"Create Bucket"**
5. Masukkan nama bucket: `pkl`
6. Klik **"Create Bucket"**

## ✅ Test Koneksi dari Laravel

```bash
cd E:\PKL\peminjaman-tempat\booking-api
php artisan tinker

# Di tinker, jalankan:
Storage::disk('private')->put('test.txt', 'Hello MinIO');
Storage::disk('private')->exists('test.txt');  # harus return true
Storage::disk('private')->get('test.txt');      # harus return 'Hello MinIO'
Storage::disk('private')->delete('test.txt');
```

## 🔧 Troubleshooting

### Port Already in Use

Jika port 9000 atau 9001 sudah digunakan, edit `start-minio.bat` dan ganti port:

```batch
minio.exe server "%MINIO_DATA_DIR%" --address ":9010" --console-address ":9011"
```

Jangan lupa update `.env`:

```
AWS_ENDPOINT=http://127.0.0.1:9010
```

### MinIO Server Crash

- Pastikan folder `data` punya write permission
- Cek antivirus tidak block `minio.exe`
- Jalankan PowerShell as Administrator

## 🚀 Auto-start MinIO (Optional)

### Option 1: Task Scheduler

1. Buka Task Scheduler
2. Create Basic Task
3. Trigger: At log on
4. Action: Start a program → pilih `start-minio.bat`

### Option 2: Startup Folder

1. Tekan `Win+R`, ketik: `shell:startup`
2. Copy shortcut `start-minio.bat` ke folder tersebut

## 📝 File Structure

```
E:\PKL\peminjaman-tempat\minio\
├── minio.exe              # MinIO executable
├── start-minio.bat        # Startup script
├── README.md              # This file
└── data\                  # MinIO data directory
    └── pkl\               # Bucket 'pkl' files
```

## 🛑 Stop Server

Tekan `Ctrl+C` di window PowerShell yang menjalankan MinIO.
