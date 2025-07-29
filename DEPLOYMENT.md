# การ Deploy ไปยัง GitHub Pages

## ขั้นตอนการตั้งค่า GitHub Pages

1. ไปที่ GitHub repository: https://github.com/FAMAS73/G15
2. คลิกที่ **Settings** (ในแท็บด้านบน)
3. เลื่อนลงไปหาส่วน **Pages** ในเมนูด้านซ้าย
4. ในส่วน **Source** เลือก **Deploy from a branch**
5. ในส่วน **Branch** เลือก `nextjs-website` และโฟลเดอร์ `/ (root)`
6. คลิก **Save**

## การตั้งค่า GitHub Actions (แนะนำ)

สำหรับการ deploy อัตโนมัติ:

1. ไปที่ **Settings** > **Pages**
2. ในส่วน **Source** เลือก **GitHub Actions**
3. GitHub จะใช้ workflow ที่อยู่ในไฟล์ `.github/workflows/deploy.yml` อัตโนมัติ

## URL ของเว็บไซต์

หลังจากตั้งค่าเสร็จแล้ว เว็บไซต์จะสามารถเข้าถึงได้ที่:
```
https://famas73.github.io/G15/
```

## การอัปเดตเว็บไซต์

เมื่อต้องการอัปเดตเว็บไซต์:

1. แก้ไขไฟล์ในโฟลเดอร์ `laptop-contract`
2. Commit และ push ไปยัง branch `nextjs-website`
3. GitHub Actions จะ build และ deploy อัตโนมัติ

```bash
cd laptop-contract
# แก้ไขไฟล์ต่างๆ
git add .
git commit -m "Update website"
git push origin main:nextjs-website
```

## หมายเหตุ

- เว็บไซต์จะใช้เวลาประมาณ 5-10 นาทีในการ deploy ครั้งแรก
- หากมีปัญหา สามารถดูใน **Actions** tab เพื่อตรวจสอบ build log
