import streamlit as st
import pandas as pd
from fpdf import FPDF
from datetime import datetime
import calendar
import os

# ---------- ฟังก์ชันคำนวณผ่อน ----------


def get_installments_with_remaining(total_price, down_payment, monthly_amount):
    remaining = total_price - down_payment
    amounts = []
    rem_balance = []
    due_dates = []

    paid = 0
    i = 0
    while paid < remaining:
        i += 1
        this_month = monthly_amount if (
            remaining - paid) > monthly_amount else remaining - paid
        paid += this_month
        amounts.append(this_month)
        rem_balance.append(remaining - paid)

        month = (datetime.today().month + i - 1) % 12 or 12
        year = datetime.today().year + ((datetime.today().month + i - 1) // 12)
        month_name = calendar.month_name[month]
        due_dates.append(f"{month_name} {year}")

    df = pd.DataFrame({
        "งวดที่": [f"{i+1}" for i in range(len(amounts))],
        "ครบกำหนดเดือน": due_dates,
        "ยอดชำระ (บาท)": amounts,
        "ยอดที่เหลือหลังชำระ": rem_balance
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

# ---------- แสดงสเปกเครื่อง ----------
st.subheader("🔧 สเปกเครื่อง")
st.markdown("""
- CPU: Intel Core i7-9750H  
- GPU: NVIDIA RTX 2070 Max-Q  
- RAM: 16GB  
- SSD: 512GB NVMe  
- Display: 15.6” IPS 240Hz  
- สภาพ: มีรอยบุบ ฝาปิดบานพับหาย RGB คีย์บอร์ดปรับไม่ได้  
- แบตเตอรี่: เปลี่ยนใหม่แล้ว
""")
# --- แสดงภาพทั้งหมดจากโฟลเดอร์ images ---
image_dir = "images"

if not os.path.exists(image_dir):
    st.warning("❗ ไม่พบโฟลเดอร์ 'images' กรุณาสร้างไว้ในโปรเจกต์เดียวกับ app.py")
else:
    image_files = [f for f in os.listdir(
        image_dir) if f.lower().endswith((".jpg", ".jpeg", ".png"))]

    st.header("📷 รูปภาพเครื่อง (จากโฟลเดอร์ images/)")

    for img_file in image_files:
        img_path = os.path.join(image_dir, img_file)
        st.image(img_path, caption=img_file, use_container_width=True)


# UI inputs
buyer_name = st.text_input("👤 ชื่อผู้ซื้อ")
down_payment = st.number_input(
    "💵 เงินดาวน์ (บาท)", min_value=0, max_value=17500, step=500, value=1500)
monthly_amount = st.number_input(
    "💳 ยอดผ่อนต่อเดือน (บาท)", min_value=500, step=100, value=1000)


# image_path = st.file_uploader(
#     "🖼️ รูปภาพโน้ตบุ๊ค (JPG/PNG)", type=["jpg", "png"])

# ราคาขายตามระดับดาวน์
if down_payment >= 4000:
    total_price = 16000
elif down_payment >= 3000:
    total_price = 16500
elif down_payment >= 2500:
    total_price = 17000
else:
    total_price = 17500

# ตารางผ่อน
df, amounts, months = get_installments_with_remaining(
    total_price, down_payment, monthly_amount)

st.markdown(f"✅ ราคาขายรวม: **{total_price:,} บาท**")
st.markdown(f"💸 เงินดาวน์: **{down_payment:,} บาท**")
st.markdown(f"📆 จำนวนงวด: **{len(amounts)} งวด**")

st.dataframe(df, use_container_width=True)

# ปุ่ม export PDF
if st.button("📤 สร้างสัญญา PDF"):
    if buyer_name.strip() == "":
        st.warning("⚠️ กรุณากรอกชื่อผู้ซื้อ")
    elif image_files is None:
        st.warning("⚠️ กรุณาอัปโหลดรูปภาพเครื่อง")
    else:
        # Save uploaded image temporarily
        temp_image_path = "uploaded_image.jpg"
        with open(temp_image_path, "wb") as f:
            f.write(image_files.getbuffer())

        file_path = export_to_pdf(
            total_price, down_payment, df, buyer_name, temp_image_path)
        with open(file_path, "rb") as f:
            st.download_button("📥 ดาวน์โหลดสัญญา PDF", f, file_name=file_path)

# -------- ฟังก์ชันเสริม: ผ่อนยืดหยุ่น เติมงวดสุดท้าย --------


def get_flexible_installments_auto_fill(total_price, down_payment, payments):
    remaining = total_price - down_payment
    total_paid = sum(payments)
    if total_paid < remaining:
        payments[-1] += remaining - total_paid  # เติมยอดสุดท้าย
        total_paid = sum(payments)
    rem_balance = []
    due_dates = []
    paid = 0
    today = datetime.today()
    for i, pay in enumerate(payments):
        paid += pay
        rem = max(0, remaining - paid)
        rem_balance.append(rem)
        month = (today.month + i) % 12 or 12
        year = today.year + ((today.month + i - 1) // 12)
        month_name = calendar.month_name[month]
        due_dates.append(f"{month_name} {year}")
    df = pd.DataFrame({
        "งวดที่": [f"{i+1}" for i in range(len(payments))],
        "เดือน": due_dates,
        "ชำระจริง (บาท)": payments,
        "ยอดคงเหลือหลังงวด": rem_balance
    })
    return df, payments, total_paid

# -------- Section: ผ่อนแบบยืดหยุ่น --------
st.markdown("## 🧮 ผ่อนแบบยืดหยุ่น (กรอกยอดเอง)")

# สร้าง/อัปเดต session state
if "num_months_flex" not in st.session_state:
    st.session_state.num_months_flex = 6
if "flex_payments" not in st.session_state:
    st.session_state.flex_payments = [1500] * st.session_state.num_months_flex

# ปุ่มควบคุมงวด
col1, col2, col3 = st.columns(3)
with col1:
    if st.button("➕ เพิ่มงวด"):
        st.session_state.num_months_flex += 1
        st.session_state.flex_payments.append(1500)
with col2:
    if st.button("➖ ลดงวด", disabled=st.session_state.num_months_flex <= 1):
        st.session_state.num_months_flex -= 1
        st.session_state.flex_payments = st.session_state.flex_payments[
            :st.session_state.num_months_flex]
with col3:
    if st.button("🔁 ล้างยอด"):
        st.session_state.flex_payments = [
            1500] * st.session_state.num_months_flex

# ช่องกรอกยอดรายเดือน
flex_inputs = []
for i in range(st.session_state.num_months_flex):
    val = st.number_input(
        f"ยอดผ่อนงวดที่ {i+1}", min_value=1500, value=st.session_state.flex_payments[i],
        step=100, key=f"flex_input_{i}"
    )
    flex_inputs.append(val)
st.session_state.flex_payments = flex_inputs

# คำนวณและแสดงตาราง
df_flex, updated_payments, total_paid = get_flexible_installments_auto_fill(
    total_price, down_payment, st.session_state.flex_payments
)

st.markdown("### 📊 ตารางผ่อนแบบยืดหยุ่น")
st.dataframe(df_flex, use_container_width=True)

required = total_price - down_payment
if total_paid < required:
    st.info(
        f"💡 ระบบเติมยอดในงวดสุดท้ายให้อัตโนมัติ รวมจ่าย: {total_paid:,} บาท")
elif total_paid == required:
    st.success("✅ ยอดรวมครบพอดีแล้ว")
else:
    st.warning(f"⚠️ จ่ายเกิน {total_paid - required:,} บาท")