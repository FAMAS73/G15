'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format, addMonths } from 'date-fns';
import { th } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { loadThaiFont } from '../utils/fontUtils';

interface InstallmentRow {
  period: string;
  dueMonth: string;
  amount: number;
  remaining: number;
  isPaid?: boolean;
}

interface FlexibleInstallmentRow extends InstallmentRow {
  dueDate: string; // วันที่ครบกำหนดแบบละเอียด
  isFirstHalf: boolean; // true = ต้นเดือน, false = กลางเดือน
}

export default function LaptopContract() {
  const [buyerName, setBuyerName] = useState('');
  const [downPayment, setDownPayment] = useState(1500);
  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [totalPrice, setTotalPrice] = useState(17500);
  const [flexPayments, setFlexPayments] = useState<number[]>([1500, 1500, 1500, 1500, 1500, 1500]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // New states for enhanced flexible payment
  const [flexTotalPrice, setFlexTotalPrice] = useState(17500);
  const [flexDownPayment, setFlexDownPayment] = useState(1500);
  const [regularPaymentStatus, setRegularPaymentStatus] = useState<boolean[]>([]);
  const [flexPaymentStatus, setFlexPaymentStatus] = useState<boolean[]>([]);

  // Safe number input handler
  const handleSafeNumberInput = (
    value: string, 
    min: number, 
    max: number, 
    step: number, 
    setter: (value: number) => void,
    fieldName: string
  ) => {
    try {
      // Allow empty string for user typing
      if (value === '') {
        setter(min);
        setErrors(prev => ({...prev, [fieldName]: ''}));
        return;
      }

      const num = parseFloat(value);
      
      if (isNaN(num)) {
        setErrors(prev => ({...prev, [fieldName]: 'กรุณากรอกตัวเลขเท่านั้น'}));
        return;
      }

      if (num < min) {
        setErrors(prev => ({...prev, [fieldName]: `ค่าต่ำสุด ${min.toLocaleString()} บาท`}));
        setter(min);
        return;
      }

      if (num > max) {
        setErrors(prev => ({...prev, [fieldName]: `ค่าสูงสุด ${max.toLocaleString()} บาท`}));
        setter(max);
        return;
      }

      // Round to nearest step
      const roundedValue = Math.round(num / step) * step;
      setter(roundedValue);
      setErrors(prev => ({...prev, [fieldName]: ''}));
    } catch (error) {
      console.error('Error in handleSafeNumberInput:', error);
      setter(min);
      setErrors(prev => ({...prev, [fieldName]: 'เกิดข้อผิดพลาด กรุณาลองใหม่'}));
    }
  };

  // Safe buyer name handler
  const handleBuyerNameChange = (value: string) => {
    try {
      if (value.length > 100) {
        setErrors(prev => ({...prev, buyerName: 'ชื่อยาวเกินไป (สูงสุด 100 ตัวอักษร)'}));
        return;
      }
      setBuyerName(value);
      setErrors(prev => ({...prev, buyerName: ''}));
    } catch (error) {
      console.error('Error in handleBuyerNameChange:', error);
    }
  };

  // Calculate total price based on down payment (with safety checks)
  useEffect(() => {
    try {
      if (!downPayment || downPayment < 0) {
        setTotalPrice(17500);
        return;
      }

      if (downPayment >= 4000) {
        setTotalPrice(16000);
      } else if (downPayment >= 3000) {
        setTotalPrice(16500);
      } else if (downPayment >= 2500) {
        setTotalPrice(17000);
      } else {
        setTotalPrice(17500);
      }
    } catch (error) {
      console.error('Error calculating total price:', error);
      setTotalPrice(17500);
    }
  }, [downPayment]);

  // Calculate installments (with comprehensive safety checks)
  useEffect(() => {
    try {
      // Safety checks to prevent errors - allow downPayment to be 0
      if (!totalPrice || downPayment < 0 || !monthlyAmount || 
          totalPrice <= 0 || monthlyAmount <= 0 ||
          downPayment > totalPrice) {
        setInstallments([]);
        return;
      }

      const remaining = totalPrice - downPayment;
      if (remaining <= 0) {
        setInstallments([]);
        return;
      }

      const amounts: number[] = [];
      const remBalance: number[] = [];
      const dueDates: string[] = [];

      let paid = 0;
      let i = 0;
      const maxIterations = 100; // Prevent infinite loops
      
      while (paid < remaining && i < maxIterations) {
        i++;
        const thisMonth = (remaining - paid) > monthlyAmount ? monthlyAmount : remaining - paid;
        
        if (thisMonth <= 0) break; // Safety check
        
        paid += thisMonth;
        amounts.push(thisMonth);
        remBalance.push(Math.max(0, remaining - paid));

        try {
          const dueDate = addMonths(new Date(), i);
          dueDates.push(format(dueDate, 'MMMM yyyy', { locale: th }));
        } catch (dateError) {
          console.error('Date formatting error:', dateError);
          dueDates.push(`เดือนที่ ${i}`);
        }
      }

      const newInstallments: InstallmentRow[] = amounts.map((amount, index) => ({
        period: `${index + 1}`,
        dueMonth: dueDates[index] || `เดือนที่ ${index + 1}`,
        amount: amount,
        remaining: remBalance[index] || 0
      }));

      setInstallments(newInstallments);
    } catch (error) {
      console.error('Error calculating installments:', error);
      setInstallments([]);
    }
  }, [totalPrice, downPayment, monthlyAmount]);


  const generatePDF = async () => {
    if (!buyerName.trim()) {
      alert('กรุณากรอกชื่อผู้ซื้อ');
      return;
    }

    try {
      const pdf = new jsPDF();
      
      // Load Thai Sarabun font
      const fontData = await loadThaiFont();
      if (fontData) {
        pdf.addFileToVFS('THSarabunNew.ttf', fontData);
        pdf.addFont('THSarabunNew.ttf', 'THSarabunNew', 'normal');
        pdf.setFont('THSarabunNew');
      } else {
        // Fallback to helvetica if font loading fails
        pdf.setFont('helvetica');
      }
      
      pdf.setFontSize(18);
      
      // Title in Thai
      pdf.text('สัญญาผ่อนโน้ตบุ๊ค (ฉบับกันเอง)', 105, 20, { align: 'center' });
      pdf.text('Asus ROG Zephyrus G15', 105, 30, { align: 'center' });
      
      // Contract details in Thai
      pdf.setFontSize(14);
      pdf.text(`ชื่อผู้ซื้อ: ${buyerName}`, 20, 50);
      pdf.text(`ราคาขายรวม: ${totalPrice.toLocaleString()} บาท`, 20, 60);
      pdf.text(`เงินดาวน์: ${downPayment.toLocaleString()} บาท`, 20, 70);
      pdf.text(`ยอดที่ต้องผ่อน: ${(totalPrice - downPayment).toLocaleString()} บาท`, 20, 80);
      
      // Terms and conditions in Thai
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
      
      let yPos = 100;
      terms.forEach(term => {
        pdf.text(term, 20, yPos);
        yPos += 10;
      });
      
      // Payment schedule in Thai
      installments.forEach((row) => {
        pdf.text(`งวดที่ ${row.period}: ${row.dueMonth} - ${row.amount.toLocaleString()} บาท`, 20, yPos);
        yPos += 10;
      });
      
      // Signature lines in Thai
      yPos += 20;
      pdf.text('_____________________     _____________________', 20, yPos);
      pdf.text('      ผู้ขายเซ็นชื่อ                             ผู้ซื้อเซ็นชื่อ', 20, yPos + 15);
      
      // Add date in Thai
      const today = new Date();
      const thaiDate = format(today, 'dd MMMM yyyy', { locale: th });
      pdf.text(`วันที่: ${thaiDate}`, 20, yPos + 35);
      
      pdf.save('สัญญาผ่อนโน้ตบุ๊ค.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง PDF');
    }
  };

  const addFlexPayment = () => {
    setFlexPayments([...flexPayments, 1500]);
  };

  const removeFlexPayment = () => {
    if (flexPayments.length > 1) {
      setFlexPayments(flexPayments.slice(0, -1));
    }
  };

  // Safe flexible payment update handler
  const updateFlexPayment = (index: number, value: string) => {
    try {
      const newPayments = [...flexPayments];
      
      if (value === '') {
        newPayments[index] = 500; // Minimum value
        setFlexPayments(newPayments);
        return;
      }

      const num = parseFloat(value);
      
      if (isNaN(num)) {
        return; // Don't update if invalid
      }

      if (num < 500) {
        newPayments[index] = 500;
      } else if (num > 50000) {
        newPayments[index] = 50000;
      } else {
        // Round to nearest 100
        newPayments[index] = Math.round(num / 100) * 100;
      }
      
      setFlexPayments(newPayments);
    } catch (error) {
      console.error('Error updating flex payment:', error);
    }
  };

  // Safe flexible installments calculation using flexible price settings
  const calculateFlexibleInstallments = () => {
    try {
      if (!flexTotalPrice || flexDownPayment < 0 || flexTotalPrice <= 0) {
        return [];
      }

      const remaining = flexTotalPrice - flexDownPayment;
      if (remaining <= 0) {
        return [];
      }

      const totalPaid = flexPayments.reduce((sum, payment) => {
        return sum + (isNaN(payment) ? 0 : payment);
      }, 0);
      
      // Auto-fill last payment if needed - ensure total matches remaining amount
      const adjustedPayments = [...flexPayments];
      if (totalPaid < remaining && adjustedPayments.length > 0) {
        adjustedPayments[adjustedPayments.length - 1] += remaining - totalPaid;
      }

      let paid = 0;

      return adjustedPayments.map((payment, index) => {
        const safePayment = isNaN(payment) ? 0 : payment;
        paid += safePayment;
        const rem = Math.max(0, remaining - paid);
        
        try {
          // Use same logic as regular installments - start from next month
          const dueDate = addMonths(new Date(), index + 1);
          
          return {
            period: `${index + 1}`,
            dueMonth: format(dueDate, 'MMMM yyyy', { locale: th }),
            amount: safePayment,
            remaining: rem
          };
        } catch (dateError) {
          console.error('Date error in flexible installments:', dateError);
          return {
            period: `${index + 1}`,
            dueMonth: `เดือนที่ ${index + 1}`,
            amount: safePayment,
            remaining: rem
          };
        }
      });
    } catch (error) {
      console.error('Error calculating flexible installments:', error);
      return [];
    }
  };

  const flexInstallments = calculateFlexibleInstallments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 text-indigo-900 drop-shadow-sm">
            🎮 Asus ROG Zephyrus G15
          </h1>
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full inline-block font-bold text-xl shadow-lg">
            🔥 Gaming Laptop สุดคุ้ม ผ่อน 0% ดอกเบี้ย!
          </div>
          <p className="text-lg text-gray-700 mt-4 font-medium">
            💻 เครื่องเกมมิ่งระดับโปร RTX 2070 Max-Q | 240Hz Display | แบตใหม่
          </p>
        </div>

        {/* Laptop Specifications */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-800 border-b border-indigo-200 pb-2">🔧 สเปกเครื่อง</h2>
          <ul className="space-y-3 text-gray-700">
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-800 border-b border-indigo-200 pb-2">📷 รูปภาพเครื่อง</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-800 border-b border-indigo-200 pb-2">📝 ข้อมูลสัญญา</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👤 ชื่อผู้ซื้อ
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => handleBuyerNameChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 bg-white ${
                  errors.buyerName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="กรอกชื่อผู้ซื้อ"
                maxLength={100}
              />
              {errors.buyerName && (
                <p className="text-red-500 text-xs mt-1">{errors.buyerName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💵 เงินดาวน์ (บาท)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDownPayment(Math.max(0, downPayment - 100))}
                  className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 active:bg-red-700 font-bold text-lg shadow-md touch-manipulation"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  ➖
                </button>
                <input
                  type="text"
                  value={downPayment.toLocaleString()}
                  readOnly
                  className={`flex-1 px-3 py-3 border rounded-md text-center text-gray-900 bg-gray-50 font-semibold text-lg ${
                    errors.downPayment ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  onClick={() => setDownPayment(Math.min(20000, downPayment + 100))}
                  className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 active:bg-green-700 font-bold text-lg shadow-md touch-manipulation"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  ➕
                </button>
              </div>
              {errors.downPayment && (
                <p className="text-red-500 text-xs mt-1">{errors.downPayment}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💳 ยอดผ่อนต่อเดือน (บาท)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMonthlyAmount(Math.max(500, monthlyAmount - 100))}
                  className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 active:bg-red-700 font-bold text-lg shadow-md touch-manipulation"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  ➖
                </button>
                <input
                  type="text"
                  value={monthlyAmount.toLocaleString()}
                  readOnly
                  className={`flex-1 px-3 py-3 border rounded-md text-center text-gray-900 bg-gray-50 font-semibold text-lg ${
                    errors.monthlyAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  onClick={() => setMonthlyAmount(Math.min(17500, monthlyAmount + 100))}
                  className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 active:bg-green-700 font-bold text-lg shadow-md touch-manipulation"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  ➕
                </button>
              </div>
              {errors.monthlyAmount && (
                <p className="text-red-500 text-xs mt-1">{errors.monthlyAmount}</p>
              )}
            </div>
          </div>

          {/* Special Pricing Alert - Show all discount tiers */}
          {downPayment >= 4000 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg mb-6 text-center">
              <div className="text-xl font-bold">🎉 ส่วนลดพิเศษ! ดาวน์ 4,000+ ลดเหลือ 16,000 บาท</div>
              <div className="text-sm mt-1">ประหยัดไป 1,500 บาท!</div>
            </div>
          )}
          {downPayment >= 3000 && downPayment < 4000 && (
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg mb-6 text-center">
              <div className="text-xl font-bold">💎 ส่วนลด! ดาวน์ 3,000+ ลดเหลือ 16,500 บาท</div>
              <div className="text-sm mt-1">ประหยัดไป 1,000 บาท!</div>
            </div>
          )}
          {downPayment >= 2500 && downPayment < 3000 && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-6 text-center">
              <div className="text-xl font-bold">⭐ ส่วนลด! ดาวน์ 2,500+ ลดเหลือ 17,000 บาท</div>
              <div className="text-sm mt-1">ประหยัดไป 500 บาท!</div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
              <div className="text-sm text-blue-600 font-medium mb-1">💰 ราคาขายรวม</div>
              <div className="text-2xl font-bold text-blue-800">
                {totalPrice.toLocaleString()} บาท
              </div>
              {downPayment >= 4000 && (
                <div className="text-xs text-green-600 font-medium">ราคาพิเศษ!</div>
              )}
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
              <div className="text-sm text-green-600 font-medium mb-1">💵 เงินดาวน์</div>
              <div className="text-2xl font-bold text-green-800">
                {downPayment.toLocaleString()} บาท
              </div>
              <div className="text-xs text-gray-600">เริ่มต้นเพียง 1,500</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-200">
              <div className="text-sm text-purple-600 font-medium mb-1">📅 จำนวนงวด</div>
              <div className="text-2xl font-bold text-purple-800">
                {installments.length} งวด
              </div>
              <div className="text-xs text-gray-600">ผ่อน 0% ดอกเบี้ย</div>
            </div>
          </div>

          {/* Payment Schedule Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-indigo-100">
                  <th className="border border-gray-300 px-4 py-3 text-indigo-800 font-semibold">งวดที่</th>
                  <th className="border border-gray-300 px-4 py-3 text-indigo-800 font-semibold">ครบกำหนดเดือน</th>
                  <th className="border border-gray-300 px-4 py-3 text-indigo-800 font-semibold">ยอดชำระ (บาท)</th>
                  <th className="border border-gray-300 px-4 py-3 text-indigo-800 font-semibold">ยอดที่เหลือหลังชำระ</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((row, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-800 font-medium">{row.period}</td>
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">{row.dueMonth}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-800 font-medium">{row.amount.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-700">{row.remaining.toLocaleString()}</td>
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
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-800 border-b border-indigo-200 pb-2">🧮 ผ่อนแบบยืดหยุ่น (กำหนดราคาและงวดเอง)</h2>
          
          {/* Flexible Price Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-2">
                💰 ราคาขายรวม (Flexible)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFlexTotalPrice(Math.max(10000, flexTotalPrice - 100))}
                  className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 active:bg-red-700 font-bold text-lg shadow-md touch-manipulation"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  ➖
                </button>
                <input
                  type="text"
                  value={flexTotalPrice.toLocaleString()}
                  readOnly
                  className="flex-1 px-3 py-3 border rounded-md text-center text-gray-900 bg-gray-50 font-semibold text-lg border-orange-300"
                />
                <button
                  onClick={() => setFlexTotalPrice(Math.min(30000, flexTotalPrice + 100))}
                  className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 active:bg-green-700 font-bold text-lg shadow-md touch-manipulation"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  ➕
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-orange-800 mb-2">
                💵 เงินดาวน์ (Flexible)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFlexDownPayment(Math.max(0, flexDownPayment - 100))}
                  className="bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 active:bg-red-700 font-bold text-lg shadow-md touch-manipulation"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  ➖
                </button>
                <input
                  type="text"
                  value={flexDownPayment.toLocaleString()}
                  readOnly
                  className="flex-1 px-3 py-3 border rounded-md text-center text-gray-900 bg-gray-50 font-semibold text-lg border-orange-300"
                />
                <button
                  onClick={() => setFlexDownPayment(Math.min(flexTotalPrice, flexDownPayment + 100))}
                  className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 active:bg-green-700 font-bold text-lg shadow-md touch-manipulation"
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  ➕
                </button>
              </div>
            </div>
          </div>

          {/* Flexible Discount Alert */}
          {(() => {
            const discount = 17500 - flexTotalPrice;
            if (discount > 0) {
              return (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg mb-6 text-center">
                  <div className="text-xl font-bold">🎉 ส่วนลดพิเศษ! ลดราคา {discount.toLocaleString()} บาท</div>
                  <div className="text-sm mt-1">จากราคาเต็ม 17,500 บาท เหลือ {flexTotalPrice.toLocaleString()} บาท</div>
                </div>
              );
            } else if (discount < 0) {
              return (
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-lg mb-6 text-center">
                  <div className="text-xl font-bold">💎 ราคาพิเศษ! เพิ่มขึ้น {Math.abs(discount).toLocaleString()} บาท</div>
                  <div className="text-sm mt-1">จากราคาเต็ม 17,500 บาท เป็น {flexTotalPrice.toLocaleString()} บาท</div>
                </div>
              );
            }
            return null;
          })()}

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={addFlexPayment}
              className="flex-1 bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-semibold text-lg shadow-md touch-manipulation"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              ➕ เพิ่มงวด
            </button>
            <button
              onClick={removeFlexPayment}
              disabled={flexPayments.length <= 1}
              className="flex-1 bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg shadow-md touch-manipulation"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              ➖ ลดงวด
            </button>
            <button
              onClick={() => setFlexPayments(Array(flexPayments.length).fill(1500))}
              className="flex-1 bg-gray-600 text-white px-6 py-4 rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors font-semibold text-lg shadow-md touch-manipulation"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              🔁 ล้างยอด
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {flexPayments.map((payment, index) => (
              <div key={index} className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                <label className="block text-sm font-semibold text-indigo-800 mb-2">
                  💰 ยอดผ่อนงวดที่ {index + 1}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newPayments = [...flexPayments];
                      newPayments[index] = Math.max(500, payment - 100);
                      setFlexPayments(newPayments);
                    }}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 active:bg-red-700 font-bold shadow-md touch-manipulation"
                    style={{ minHeight: '40px', minWidth: '40px' }}
                  >
                    ➖
                  </button>
                  <input
                    type="text"
                    value={payment.toLocaleString()}
                    readOnly
                    className="flex-1 px-3 py-2 border-2 border-indigo-300 rounded-lg text-center text-gray-800 bg-gray-50 font-semibold"
                  />
                  <button
                    onClick={() => {
                      const newPayments = [...flexPayments];
                      newPayments[index] = Math.min(50000, payment + 100);
                      setFlexPayments(newPayments);
                    }}
                    className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 active:bg-green-700 font-bold shadow-md touch-manipulation"
                    style={{ minHeight: '40px', minWidth: '40px' }}
                  >
                    ➕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-indigo-100">
                  <th className="border border-gray-300 px-4 py-3 text-indigo-800 font-semibold">งวดที่</th>
                  <th className="border border-gray-300 px-4 py-3 text-indigo-800 font-semibold">เดือน</th>
                  <th className="border border-gray-300 px-4 py-3 text-indigo-800 font-semibold">ชำระจริง (บาท)</th>
                  <th className="border border-gray-300 px-4 py-3 text-indigo-800 font-semibold">ยอดคงเหลือหลังงวด</th>
                </tr>
              </thead>
              <tbody>
                {flexInstallments.map((row, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition-colors">
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-800 font-medium">{row.period}</td>
                    <td className="border border-gray-300 px-4 py-3 text-gray-700">{row.dueMonth}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-800 font-medium">{row.amount.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right text-gray-700">{row.remaining.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(() => {
            const totalPaid = flexPayments.reduce((sum, payment) => sum + payment, 0);
            const required = flexTotalPrice - flexDownPayment;
            
            if (totalPaid < required) {
              return (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    💡 ระบบเติมยอดในงวดสุดท้ายให้อัตโนมัติ รวมจ่าย: {totalPaid.toLocaleString()} บาท ต้องการ: {required.toLocaleString()} บาท
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
