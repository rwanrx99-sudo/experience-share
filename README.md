## แชร์ประสบการณ์ (Next.js + Supabase)

เว็บแนวมินิมอลสำหรับ “แชร์ประสบการณ์” ให้คนอื่นมาอ่าน แล้ว **คอมเมนต์ / ตอบกลับเป็นเธรด / รีวิวให้คะแนน** ได้  
ผู้ชมทั่วไป “ดูได้” โดยไม่ต้องล็อกอิน แต่การโพสต์/คอมเมนต์/รีวิวต้องล็อกอิน (GitHub/Google)

---

## 1) เตรียม Supabase (ทำครั้งเดียว)

1. สร้างโปรเจกต์ใหม่ใน Supabase
2. ไปที่ **SQL Editor** → วางไฟล์นี้แล้วกด Run:
   - `supabase/schema.sql`
3. ไปที่ **Authentication → Providers**
   - เปิดใช้งาน **GitHub** และ/หรือ **Google**
   - ใส่ Client ID / Secret ให้ครบ
4. ไปที่ **Project Settings → API**
   - คัดลอกค่า **Project URL** และ **anon public key**

> หมายเหตุ: หลัง deploy แล้ว ต้องตั้งค่า “Redirect URLs” ใน Supabase ให้ตรงกับโดเมนจริงด้วย (ดูหัวข้อ Deploy ด้านล่าง)

---

## 2) ตั้งค่า env และรันในเครื่อง

1. สร้างไฟล์ `.env.local` จากตัวอย่าง

```bash
cp .env.example .env.local
```

2. ใส่ค่าใน `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. ติดตั้งและรัน

```bash
npm install
npm run dev
```

เปิด `http://localhost:3000`

---

## 3) โครงสร้างฟีเจอร์หลัก

- หน้าแรก: ฟีดโพสต์ (`src/app/page.tsx`)
- เขียนโพสต์: (`src/app/new/page.tsx`) — ต้องล็อกอิน
- หน้าโพสต์: (`src/app/post/[id]/page.tsx`)
  - รีวิวให้คะแนน 1–5 (บันทึกซ้ำได้ 1 คนต่อ 1 โพสต์)
  - คอมเมนต์ + ตอบกลับเป็นเธรด
- Auth callback: `src/app/auth/callback/route.ts`
- Server Actions: `src/app/actions.ts`

---

## 4) วิธีลง GitHub (ทีละขั้นตอน)

1. สร้าง repo ใหม่บน GitHub (เช่น `experience-share`)
2. ในโฟลเดอร์โปรเจกต์นี้ รัน:

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<YOUR_NAME>/<YOUR_REPO>.git
git push -u origin main
```

---

## 5) Deploy ขึ้น Vercel (ทีละขั้นตอน)

1. เข้า Vercel → **Add New Project**
2. เลือก repo จาก GitHub ที่ push ไว้
3. ตั้งค่า **Environment Variables** (ใน Vercel)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. กด Deploy
5. หลัง deploy เสร็จ ให้เอาโดเมนที่ได้ (เช่น `https://xxx.vercel.app`) ไปเพิ่มใน Supabase:
   - Authentication → URL Configuration
   - ใส่ **Site URL** = `https://xxx.vercel.app`
   - ใส่ **Redirect URLs** เพิ่มเป็น:
     - `https://xxx.vercel.app/auth/callback`

เสร็จแล้วลอง:
- เปิดหน้าเว็บ → ลองล็อกอิน → เขียนโพสต์ → คอมเมนต์/ตอบกลับ/รีวิว
