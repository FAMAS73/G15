import streamlit as st
import pandas as pd
from fpdf import FPDF
from datetime import datetime
import calendar
import os

# ---------- ฟังก์ชันคำนวณผ่อน ----------


def get_installment_schedule(total_price, down_payment):
    remaining = total_price - down_payment
    full_installments = remaining // 1000
    last_payment = remaining % 1000

    amounts = [1000] * full_installments
    if last_payment > 0:
        amounts.append(last_payment)

    today = datetime.today()
    due_dates = []
    for i in range(len(amounts)):
        month = (today.month + i) % 12 or 12
        year = today.year + ((today.month + i - 1) // 12)
        month_name = calendar.month_name[month]
        due_dates.append(f"{month_name} {year}")

    df = pd.DataFrame({
        "งวดที่": [f"{i+1}" for i in range(len(amounts))],
        "ครบกำหนดเดือน": due_dates,
        "ยอดชำระ (บาท)": amounts
    })
    return df, amounts, due_dates

# ---------- ฟังก์ชันสร้าง PDF ----------


def export_to_pdf(total_price, down_payment, table_df, buyer_name, image_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.add_font("THSarabun", "", "THSarabunNew.ttf", uni=True)
    pdf.set_font("THSarabun", size=16)

    pdf.cell(200, 10, txt="สัญญาผ่อนโน้ตบุ๊ค (ฉบับกันเอง)", ln=True, align="C")
    pdf.ln(5)
    pdf.cell(200, 10, txt=f"ชื่อผู้ซื้อ: {buyer_name}", ln=True)
    pdf.cell(200, 10, txt=f"ราคาขายรวม: {total_price:,} บาท", ln=True)
    pdf.cell(200, 10, txt=f"เงินดาวน์: {down_payment:,} บาท", ln=True)
    pdf.cell(
        200, 10, txt=f"ยอดที่ต้องผ่อน: {total_price - down_payment:,} บาท", ln=True)
    pdf.ln(5)

    if os.path.exists(image_path):
        pdf.image(image_path, w=100)
        pdf.ln(5)

    pdf.set_font("THSarabun", size=14)
    pdf.multi_cell(0, 8, txt="""
เงื่อนไข:
1. ผู้ซื้อสามารถผ่อนชำระยอดที่เหลือแบบไม่มีดอกเบี้ย
2. งวดผ่อนจะเริ่มตั้งแต่เดือนถัดจากวันทำสัญญา
3. หากผิดนัดเกิน 2 งวดโดยไม่แจ้ง จะถือว่าผิดเงื่อนไข
4. ห้ามขาย/จำนำ/โอนเครื่องจนกว่าจะผ่อนครบ
5. ถ้ามีปัญหาติดต่อพูดคุยกันได้

ตารางการชำระ:
""")

    pdf.set_font("THSarabun", size=12)
    for i, row in table_df.iterrows():
        pdf.cell(
            0, 8, f"งวดที่ {row['งวดที่']}: {row['ครบกำหนดเดือน']} - {row['ยอดชำระ (บาท)']:,} บาท", ln=True)

    pdf.ln(10)
    pdf.cell(0, 10, txt="_____________________     _____________________", ln=True)
    pdf.cell(
        0, 10, txt="      ผู้ขายเซ็นชื่อ                             ผู้ซื้อเซ็นชื่อ", ln=True)

    file_name = "contract_export.pdf"
    pdf.output(file_name)
    return file_name


# ---------- Streamlit UI ----------
st.set_page_config(page_title="สัญญาผ่อน", page_icon="💻")
st.title("📄 สัญญาผ่อน Asus ROG Zephyrus G15")

# UI inputs
buyer_name = st.text_input("👤 ชื่อผู้ซื้อ")
down_payment = st.number_input(
    "💵 เงินดาวน์ (บาท)", min_value=0, max_value=16000, step=500, value=1500)
image_path = st.file_uploader(
    "🖼️ รูปภาพโน้ตบุ๊ค (JPG/PNG)", type=["jpg", "png"])

# ราคาขายตามระดับดาวน์
if down_payment >= 5000:
    total_price = 16000
elif down_payment >= 4500:
    total_price = 16500
elif down_payment >= 3000:
    total_price = 17000
else:
    total_price = 17500

# ตารางผ่อน
df, amounts, months = get_installment_schedule(total_price, down_payment)

st.markdown(f"✅ ราคาขายรวม: **{total_price:,} บาท**")
st.markdown(f"💸 เงินดาวน์: **{down_payment:,} บาท**")
st.markdown(f"📆 จำนวนงวด: **{len(amounts)} งวด**")

st.dataframe(df, use_container_width=True)

# ปุ่ม export PDF
if st.button("📤 สร้างสัญญา PDF"):
    if buyer_name.strip() == "":
        st.warning("⚠️ กรุณากรอกชื่อผู้ซื้อ")
    elif image_path is None:
        st.warning("⚠️ กรุณาอัปโหลดรูปภาพเครื่อง")
    else:
        # Save uploaded image temporarily
        temp_image_path = "uploaded_image.jpg"
        with open(temp_image_path, "wb") as f:
            f.write(image_path.getbuffer())

        file_path = export_to_pdf(
            total_price, down_payment, df, buyer_name, temp_image_path)
        with open(file_path, "rb") as f:
            st.download_button("📥 ดาวน์โหลดสัญญา PDF", f, file_name=file_path)
