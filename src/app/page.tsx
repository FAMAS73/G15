'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format, addMonths } from 'date-fns';
import { th } from 'date-fns/locale';
import jsPDF from 'jspdf';

interface InstallmentRow {
  period: string;
  dueMonth: string;
  amount: number;
  remaining: number;
}

export default function LaptopContract() {
  const [buyerName, setBuyerName] = useState('');
  const [downPayment, setDownPayment] = useState(1500);
  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [totalPrice, setTotalPrice] = useState(17500);
  const [flexPayments, setFlexPayments] = useState<number[]>([1500, 1500, 1500, 1500, 1500, 1500]);

  // Calculate total price based on down payment
  useEffect(() => {
    if (downPayment >= 4000) {
      setTotalPrice(16000);
    } else if (downPayment >= 3000) {
      setTotalPrice(16500);
    } else if (downPayment >= 2500) {
      setTotalPrice(17000);
    } else {
      setTotalPrice(17500);
    }
  }, [downPayment]);

  // Calculate installments
  useEffect(() => {
    const remaining = totalPrice - downPayment;
    const amounts: number[] = [];
    const remBalance: number[] = [];
    const dueDates: string[] = [];

    let paid = 0;
    let i = 0;
    
    while (paid < remaining) {
      i++;
      const thisMonth = (remaining - paid) > monthlyAmount ? monthlyAmount : remaining - paid;
      paid += thisMonth;
      amounts.push(thisMonth);
      remBalance.push(remaining - paid);

      const dueDate = addMonths(new Date(), i);
      dueDates.push(format(dueDate, 'MMMM yyyy', { locale: th }));
    }

    const newInstallments: InstallmentRow[] = amounts.map((amount, index) => ({
      period: `${index + 1}`,
      dueMonth: dueDates[index],
      amount: amount,
      remaining: remBalance[index]
    }));

    setInstallments(newInstallments);
  }, [totalPrice, downPayment, monthlyAmount]);

  // Calculate flexible installments
  const calculateFlexibleInstallments = () => {
    const remaining = totalPrice - downPayment;
    const totalPaid = flexPayments.reduce((sum, payment) => sum + payment, 0);
    
    // Auto-fill last payment if needed
    const adjustedPayments = [...flexPayments];
    if (totalPaid < remaining) {
      adjustedPayments[adjustedPayments.length - 1] += remaining - totalPaid;
    }

    return adjustedPayments.map((payment, index) => {
      const paid = adjustedPayments.slice(0, index + 1).reduce((sum, p) => sum + p, 0);
      const dueDate = addMonths(new Date(), index + 1);
      
      return {
        period: `${index + 1}`,
        dueMonth: format(dueDate, 'MMMM yyyy', { locale: th }),
        amount: payment,
        remaining: Math.max(0, remaining - paid)
      };
    });
  };

  const generatePDF = () => {
    if (!buyerName.trim()) {
      alert('กรุณากรอกชื่อผู้ซื้อ');
      return;
    }

    const pdf = new jsPDF();
    
    // Add Thai font support (simplified - in production you'd load the actual font)
    pdf.setFont('helvetica');
    pdf.setFontSize(16);
    
    // Title
    pdf.text('สัญญาผ่อนโน้ตบุ๊ค (ฉบับกันเอง)', 105, 20, { align: 'center' });
    
    // Contract details
    pdf.setFontSize(12);
    pdf.text(`ชื่อผู้ซื้อ: ${buyerName}`, 20, 40);
    pdf.text(`ราคาขายรวม: ${totalPrice.toLocaleString()} บาท`, 20, 50);
    pdf.text(`เงินดาวน์: ${downPayment.toLocaleString()} บาท`, 20, 60);
    pdf.text(`ยอดที่ต้องผ่อน: ${(totalPrice - downPayment).toLocaleString()} บาท`, 20, 70);
    
    // Terms and conditions
    const terms = [
      'เงื่อนไข:',
      '1. ผู้ซื้อสามารถผ่อนชำระยอดที่เหลือแบบไม่มีดอกเบี้ย',
      '2. งวดผ่อนจะเริ่มตั้งแต่เดือนถัดจากวันทำสัญญา',
      '3. หากผิดนัดเกิน 2 งวดโดยไม่แจ้ง จะถือว่าผิดเงื่อนไข',
      '4. ห้ามขาย/จำนำ/โอนเครื่องจนกว่าจะผ่อนครบ',
      '5. ถ้ามีปัญหาติดต่อพูดคุยกันได้',
      '',
      'ตารางการชำระ:'
    ];
    
    let yPos = 90;
    terms.forEach(term => {
      pdf.text(term, 20, yPos);
      yPos += 8;
    });
    
    // Payment schedule
    installments.forEach((row) => {
      pdf.text(`งวดที่ ${row.period}: ${row.dueMonth} - ${row.amount.toLocaleString()} บาท`, 20, yPos);
      yPos += 8;
    });
    
    // Signature lines
    yPos += 20;
    pdf.text('_____________________     _____________________', 20, yPos);
    pdf.text('      ผู้ขายเซ็นชื่อ                             ผู้ซื้อเซ็นชื่อ', 20, yPos + 10);
    
    pdf.save('contract_export.pdf');
  };

  const addFlexPayment = () => {
    setFlexPayments([...flexPayments, 1500]);
  };

  const removeFlexPayment = () => {
    if (flexPayments.length > 1) {
      setFlexPayments(flexPayments.slice(0, -1));
    }
  };

  const updateFlexPayment = (index: number, value: number) => {
    const newPayments = [...flexPayments];
    newPayments[index] = value;
    setFlexPayments(newPayments);
  };

  const flexInstallments = calculateFlexibleInstallments();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          📄 สัญญาผ่อน Asus ROG Zephyrus G15
        </h1>

        {/* Laptop Specifications */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">🔧 สเปกเครื่อง</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• CPU: Intel Core i7-9750H</li>
            <li>• GPU: NVIDIA RTX 2070 Max-Q</li>
            <li>• RAM: 16GB</li>
            <li>• SSD: 512GB NVMe</li>
            <li>• Display: 15.6&quot; IPS 240Hz</li>
            <li>• สภาพ: มีรอยบุบ ฝาปิดบานพับหาย RGB คีย์บอร์ดปรับไม่ได้</li>
            <li>• แบตเตอรี่: เปลี่ยนใหม่แล้ว</li>
          </ul>
        </div>

        {/* Image Gallery */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">📷 รูปภาพเครื่อง</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              '20250519_195825.jpg',
              '20250519_195832.jpg',
              '20250519_195839.jpg',
              '20250519_195845.jpg',
              '20250519_195856.jpg',
              '20250519_195904.jpg',
              '20250519_195919.jpg',
              '20250519_195931.jpg',
              '20250519_195948.jpg'
            ].map((filename, i) => (
              <div key={i} className="relative aspect-video">
                <Image
                  src={`/images/${filename}`}
                  alt={`Laptop image ${i + 1}`}
                  fill
                  className="object-cover rounded-lg"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contract Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">📝 ข้อมูลสัญญา</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 ชื่อผู้ซื้อ
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกชื่อผู้ซื้อ"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💵 เงินดาวน์ (บาท)
              </label>
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                min="0"
                max="17500"
                step="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💳 ยอดผ่อนต่อเดือน (บาท)
              </label>
              <input
                type="number"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                min="500"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-blue-800">
                ราคาขายรวม: {totalPrice.toLocaleString()} บาท
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-green-800">
                เงินดาวน์: {downPayment.toLocaleString()} บาท
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-purple-800">
                จำนวนงวด: {installments.length} งวด
              </div>
            </div>
          </div>

          {/* Payment Schedule Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">งวดที่</th>
                  <th className="border border-gray-300 px-4 py-2">ครบกำหนดเดือน</th>
                  <th className="border border-gray-300 px-4 py-2">ยอดชำระ (บาท)</th>
                  <th className="border border-gray-300 px-4 py-2">ยอดที่เหลือหลังชำระ</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.period}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.dueMonth}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{row.amount.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{row.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={generatePDF}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            📤 สร้างสัญญา PDF
          </button>
        </div>

        {/* Flexible Payment Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">🧮 ผ่อนแบบยืดหยุ่น (กรอกยอดเอง)</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={addFlexPayment}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              ➕ เพิ่มงวด
            </button>
            <button
              onClick={removeFlexPayment}
              disabled={flexPayments.length <= 1}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:bg-gray-400"
            >
              ➖ ลดงวด
            </button>
            <button
              onClick={() => setFlexPayments(Array(flexPayments.length).fill(1500))}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              🔁 ล้างยอด
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {flexPayments.map((payment, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยอดผ่อนงวดที่ {index + 1}
                </label>
                <input
                  type="number"
                  value={payment}
                  onChange={(e) => updateFlexPayment(index, Number(e.target.value))}
                  min="500"
                  step="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">งวดที่</th>
                  <th className="border border-gray-300 px-4 py-2">เดือน</th>
                  <th className="border border-gray-300 px-4 py-2">ชำระจริง (บาท)</th>
                  <th className="border border-gray-300 px-4 py-2">ยอดคงเหลือหลังงวด</th>
                </tr>
              </thead>
              <tbody>
                {flexInstallments.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-center">{row.period}</td>
                    <td className="border border-gray-300 px-4 py-2">{row.dueMonth}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{row.amount.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{row.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(() => {
            const totalPaid = flexPayments.reduce((sum, payment) => sum + payment, 0);
            const required = totalPrice - downPayment;
            
            if (totalPaid < required) {
              return (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    💡 ระบบเติมยอดในงวดสุดท้ายให้อัตโนมัติ รวมจ่าย: {totalPaid.toLocaleString()} บาท
                  </p>
                </div>
              );
            } else if (totalPaid === required) {
              return (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <p className="text-green-800">✅ ยอดรวมครบพอดีแล้ว</p>
                </div>
              );
            } else {
              return (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800">
                    ⚠️ จ่ายเกิน {(totalPaid - required).toLocaleString()} บาท
                  </p>
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
}
