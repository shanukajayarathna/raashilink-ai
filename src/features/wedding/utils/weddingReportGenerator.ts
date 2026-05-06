import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WeddingReportData {
  couple: {
    partner1: string;
    partner2: string;
    date: string;
  };
  stats: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    progress: number;
    daysLeft: number;
  };
  expenses: any[];
  checklist: any[];
}

export const generateWeddingReport = (data: WeddingReportData) => {
  const doc = new jsPDF();
  const { couple, stats, expenses, checklist } = data;

  // Colors
  const maroon = [139, 26, 46] as [number, number, number]; // #8B1A2E
  const gold = [201, 168, 76] as [number, number, number]; // #C9A84C
  const darkGray = [44, 62, 80] as [number, number, number];

  // --- HEADER ---
  doc.setFillColor(maroon[0], maroon[1], maroon[2]);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('RaashiLink.ai Wedding Plan', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`${couple.partner1 || 'Partner 1'} & ${couple.partner2 || 'Partner 2'}'s Big Day`, 105, 30, { align: 'center' });

  // --- OVERVIEW SECTION ---
  let y = 55;
  doc.setTextColor(maroon[0], maroon[1], maroon[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Wedding Overview', 20, y);
  
  y += 10;
  doc.setDrawColor(gold[0], gold[1], gold[2]);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);

  y += 15;
  doc.setFontSize(12);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Wedding Date:', 20, y);
  doc.setFont('helvetica', 'normal');
  const displayDate = couple.date ? new Date(couple.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Not set';
  doc.text(displayDate, 60, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Countdown:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${stats.daysLeft || 0} Days to go!`, 150, y);

  // --- BUDGET SUMMARY ---
  y += 25;
  doc.setTextColor(maroon[0], maroon[1], maroon[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Budget Summary', 20, y);
  
  y += 10;
  doc.line(20, y, 190, y);

  y += 15;
  // Draw simple stats boxes
  const drawStat = (label: string, value: string, x: number, currY: number) => {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(label, x, currY);
    doc.setFontSize(14);
    doc.setTextColor(maroon[0], maroon[1], maroon[2]);
    doc.text(value, x, currY + 7);
  };

  const formatLKR = (val: number) => `LKR ${(val || 0).toLocaleString()}`;
  
  drawStat('Total Budget', formatLKR(stats.totalBudget), 20, y);
  drawStat('Total Spent', formatLKR(stats.totalSpent), 80, y);
  drawStat('Remaining', formatLKR(stats.remaining), 140, y);

  // --- EXPENSES TABLE ---
  y += 30;
  doc.setTextColor(maroon[0], maroon[1], maroon[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense Details', 20, y);
  
  const expenseRows = (expenses || []).map(e => [
    e.title || 'Untitled',
    e.category || 'General',
    formatLKR(e.amount),
    e.paid ? 'Paid' : 'Pending'
  ]);

  if (expenseRows.length === 0) {
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('No expenses added yet.', 20, y);
  } else {
    autoTable(doc, {
      startY: y + 5,
      head: [['Title', 'Category', 'Amount', 'Status']],
      body: expenseRows,
      headStyles: { fillColor: maroon, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 247, 242] },
      margin: { left: 20, right: 20 }
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  // --- CHECKLIST SECTION ---
  // Add new page if space is tight
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(maroon[0], maroon[1], maroon[2]);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Checklist Progress', 20, y);
  
  const checklistRows = (checklist || []).map(t => [
    t.title || 'Untitled Task',
    t.category || 'Logistics',
    t.assignedTo || 'Both',
    t.completed ? 'Completed' : 'Pending'
  ]);

  if (checklistRows.length === 0) {
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('No checklist tasks added yet.', 20, y);
  } else {
    autoTable(doc, {
      startY: y + 5,
      head: [['Task', 'Category', 'Assigned To', 'Status']],
      body: checklistRows,
      headStyles: { fillColor: gold, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 247, 242] },
      margin: { left: 20, right: 20 }
    });
  }

  // --- FOOTER ---
  const pageCount = (doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by RaashiLink.ai — Your AI Wedding Partner`, 105, 285, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
  }

  // Save the PDF
  doc.save(`Wedding_Plan_${couple.partner1}_${couple.partner2}.pdf`);
};
