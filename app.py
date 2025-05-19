import streamlit as st
import pandas as pd
import math

st.set_page_config(page_title="ผ่อนโน้ตบุ๊คเพื่อน", page_icon="💻")

st.title("💻 แผนผ่อน Asus ROG Zephyrus G15 สำหรับเพื่อน")
st.markdown("ใส่เงินดาวน์ที่ต้องการ แล้วดูแผนผ่อนอัตโนมัติด้านล่าง")

# ช่องกรอกเงินดาวน์
down_payment = st.number_input(
    "💵 เงินดาวน์ (บาท)", min_value=0, max_value=16000, step=500, value=1500)

# กำหนดราคาขายรวมตามระดับดาวน์ (ไม่มีดอกเบี้ย)
if down_payment >= 5000:
    total_price = 16000
elif down_payment >= 4500:
    total_price = 16500
elif down_payment >= 3000:
    total_price = 17000
else:
    total_price = 17500

# คำนวณยอดที่เหลือ
remaining = total_price - down_payment

# คำนวณจำนวนงวด (ปัดลงเพื่อให้จ่ายเป็นงวด 1,000 ได้)
full_installments = remaining // 1000
last_payment = remaining % 1000

# สร้างตารางแสดงแผนผ่อน
installments = [1000] * full_installments
if last_payment > 0:
    installments.append(last_payment)

# สร้าง DataFrame
table = pd.DataFrame({
    "งวดที่": [f"งวดที่ {i+1}" for i in range(len(installments))],
    "ยอดชำระ (บาท)": installments
})

# แสดงผลลัพธ์
st.markdown(f"### ✅ ราคาขายรวม: **{total_price:,} บาท**")
st.markdown(f"💸 เงินดาวน์: **{down_payment:,} บาท**")
st.markdown(f"📆 จำนวนงวดผ่อน: **{len(installments)} งวด**")

st.dataframe(table, use_container_width=True)

# ปุ่มจำลองการยืนยัน
if st.button("✅ ยืนยันแผนผ่อนนี้"):
    st.success("ระบบบันทึกแผนผ่อนเรียบร้อยแล้ว! (จำลอง)")
