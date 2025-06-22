const price = 2_894_190;
const initialPercent = 70;
const months = 36; // 3 года
const annualRate = 0.01; // % годовая

const casco = 70_000;
const financial = 60_000;

const downPayment = price * initialPercent / 100;
const totalLoan = (price * (1 - initialPercent / 100)) + casco + financial;

// 👉 Правильная месячная ставка
const r = (annualRate / 100) / 12;

// 👉 Аннуитетный коэффициент
const k = r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);

// 👉 Платёж в месяц
const monthly = totalLoan * k;

// 👉 Переплата за весь срок
const totalPayment = monthly * months;
const overpayment = totalPayment - totalLoan;

const format = n => n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';

console.log("\n--- ДАНО ---");
console.log("💰 Стоимость авто:", format(price));
console.log("💵 Первоначальный взнос:", initialPercent + " %");
console.log("📆 Срок кредита:", months + " мес.");
console.log("📈 Ставка (годовая):", annualRate + " %");
console.log("🛡️ КАСКО:", format(casco));
console.log("📄 Финпродукты:", format(financial));

console.log("\n--- РАСЧЁТ ---");
console.log("💵 Взнос (₽):", format(downPayment));
console.log("💳 Сумма кредита:", format(totalLoan));
console.log("📅 Платёж в мес. (аннуитет):", format(monthly));
console.log("📅 Платёж в мес. (без %):", format(totalLoan / months));
console.log("📄 Переплата за всё время:", format(overpayment));
