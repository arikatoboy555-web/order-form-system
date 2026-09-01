# ชุดทดลองระบบรับออเดอร์

ชุดนี้แยกจากระบบเดิมโดยตั้งใจ:

- เว็บทดลองเป็น Sites project คนละตัว
- มีหน้าแก้ไขออเดอร์ที่ edit.html
- หากยังไม่ตั้งค่า API ข้อมูลจะเก็บใน Local Storage ของเบราว์เซอร์นี้เท่านั้น
- โค้ด Google Apps Script ใช้เฉพาะชีตชื่อ ทดลอง_ออเดอร์, ทดลอง_รายการสินค้า และ ทดลอง_ประวัติแก้ไข
- ไม่ใช้ LINE token, API URL หรือ webhook ของระบบเดิม

## เชื่อม Google Sheet ทดลอง

1. สร้าง Apps Script project แยก แล้ววาง apps-script/Code.gs
2. รัน setupExperiment() ครั้งแรกและอนุญาตสิทธิ์
3. Deploy เป็น Web app แยก
4. นำ URL Web app ใหม่ไปใส่ใน experiment-config.js ช่อง apiUrl
5. สร้างเวอร์ชันเว็บทดลองใหม่

## เชื่อม LINE Bot ทดลอง

สร้าง LINE Official Account/Channel แยกจากบอทจริง แล้วตั้งค่าใน Script Properties ผ่าน setTestLineConfig() เท่านั้น จากนั้นใช้ Web app URL ของ Apps Script ชุดทดลองเป็น webhook URL ของบอททดลอง เมื่อเพิ่มบอทเข้ากลุ่มทดลองและส่งคำว่า เมนู ระบบจะจำกลุ่มนั้นเป็นปลายทางทดลองให้อัตโนมัติ
