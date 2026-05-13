import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { Account } from './mockData';

export const exportToCSV = (account: Account) => {
  const data = account.transactions.map((tx) => ({
    Timestamp: `${tx.date} ${tx.time}`,
    Type: tx.type,
    Amount: tx.amount,
    Method: tx.method,
    Counterparty: tx.counterparty,
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${account.name.replace(/\s+/g, '_')}_transactions.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (account: Account, aiReport: string | null) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Suspicious Activity Report (SAR)', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toISOString()}`, 14, 30);
  
  // Account Information
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Entity Information', 14, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Name: ${account.name}`, 14, 53);
  doc.text(`Account ID: ${account.id}`, 14, 59);
  doc.text(`Risk Score: ${account.riskScore}/100`, 14, 65);
  doc.text(`KYC Status: ${account.kycStatus}`, 14, 71);
  
  // AI Insight (Strip markdown for simple PDF, or just include it raw)
  let nextY = 85;
  if (aiReport) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Chronicle AI Analysis', 14, nextY);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const cleanReport = aiReport.replace(/[*_#]/g, ''); // Basic markdown strip
    const splitReport = doc.splitTextToSize(cleanReport, 180);
    doc.text(splitReport, 14, nextY + 8);
    nextY += (splitReport.length * 5) + 15;
  }

  // Transactions Table
  if (nextY > 250) {
    doc.addPage();
    nextY = 20;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Transaction Ledger (Last 30 Days)', 14, nextY);

  const tableBody = account.transactions.map(tx => [
    `${tx.date} ${tx.time}`,
    tx.type,
    `$${tx.amount.toLocaleString()}`,
    tx.method,
    tx.counterparty
  ]);

  autoTable(doc, {
    startY: nextY + 5,
    head: [['Timestamp', 'Type', 'Amount', 'Method', 'Counterparty']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [40, 60, 80] },
    styles: { fontSize: 8 },
  });

  doc.save(`${account.id}_SAR_Report.pdf`);
};

export const exportGlobalPDF = (aiReport: string | null) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Global AML Topology Report', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toISOString()}`, 14, 30);
  
  if (aiReport) {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Chronicle AI Macro Analysis', 14, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const cleanReport = aiReport.replace(/[*_#>]/g, ''); // Basic markdown strip
    const splitReport = doc.splitTextToSize(cleanReport, 180);
    doc.text(splitReport, 14, 60);
  }

  doc.save(`Global_Topology_Report.pdf`);
};
