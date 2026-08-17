import { auth } from './firebase';

export interface StudySessionReportData {
  id: string;
  topic: string;
  subject?: string;
  timestamp?: any;
  quizScore: number;
  totalQuestions: number;
  durationMinutes?: number;
  masteryScore?: number;
}

export async function generateStudyProgressPDF(
  sessions: StudySessionReportData[]
) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const user = auth.currentUser;
  const userEmail = user?.email || 'ayaicrypcoin@gmail.com';
  const userName = user?.displayName || 'Student';

  // Calculations
  const totalSessions = sessions.length;
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((acc, s) => acc + ((s.quizScore / (s.totalQuestions || 1)) * 100), 0) / sessions.length)
    : 0;

  // Topic mastery map
  const topicStats: Record<string, { totalPct: number; count: number; best: number }> = {};
  sessions.forEach(s => {
    const pct = Math.round((s.quizScore / (s.totalQuestions || 1)) * 100);
    if (!topicStats[s.topic]) {
      topicStats[s.topic] = { totalPct: pct, count: 1, best: pct };
    } else {
      topicStats[s.topic].totalPct += pct;
      topicStats[s.topic].count += 1;
      topicStats[s.topic].best = Math.max(topicStats[s.topic].best, pct);
    }
  });

  const topicList = Object.entries(topicStats).map(([topic, stat]) => ({
    topic,
    avg: Math.round(stat.totalPct / stat.count),
    count: stat.count,
    best: stat.best
  })).sort((a, b) => b.avg - a.avg);

  const strengths = topicList.filter(t => t.avg >= 75);
  const focusAreas = topicList.filter(t => t.avg < 75);

  let currentY = 15;

  // Helper for adding footer to all pages
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 140);
    doc.text(
      `AI Study BUDDY Progress Report • Page ${pageNum} of ${totalPages}`,
      14,
      pageHeight - 10
    );
    doc.text(
      `Created by Ayan Ahmed • Contact: ayaicrypcoin@gmail.com`,
      pageWidth - 14,
      pageHeight - 10,
      { align: 'right' }
    );
  };

  // 1. Header Banner Box
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(14, currentY, pageWidth - 28, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('AI STUDY BUDDY — MASTERY & PROGRESS REPORT', 20, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Student: ${userName} (${userEmail}) | Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, 20, currentY + 20);

  currentY += 36;

  // 2. Executive Metrics Summary Grid (4 Cards)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE PERFORMANCE SUMMARY', 14, currentY);
  currentY += 6;

  const cardWidth = (pageWidth - 28 - 9) / 4; // 4 cards with 3mm gap
  const cardHeight = 22;

  const metrics = [
    { label: 'Total Sessions', val: `${totalSessions}`, color: [37, 99, 235] },
    { label: 'Avg Mastery Score', val: `${avgScore}%`, color: [16, 185, 129] },
    { label: 'Topics Covered', val: `${topicList.length}`, color: [245, 158, 11] },
    { label: 'Mastery Rank', val: avgScore >= 80 ? 'Grandmaster' : avgScore >= 60 ? 'Pro Scholar' : 'Developing', color: [147, 51, 234] }
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, x + cardWidth / 2, currentY + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + cardWidth / 2, currentY + 17, { align: 'center' });
  });

  currentY += cardHeight + 10;

  // 3. Subject Mastery Insights Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('SUBJECT & TOPIC MASTERY INSIGHTS', 14, currentY);
  currentY += 6;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 42, 3, 3, 'FD');

  let insightY = currentY + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // green
  doc.text('Proven Core Strengths (>=75% Mastery):', 18, insightY);
  insightY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const strengthStr = strengths.length > 0
    ? strengths.slice(0, 5).map(s => `${s.topic} (${s.avg}%)`).join('  •  ')
    : 'No topics over 75% yet. Complete more quizzes to unlock strengths!';
  doc.text(doc.splitTextToSize(strengthStr, pageWidth - 40), 18, insightY);

  insightY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(225, 29, 72); // rose
  doc.text('Target Focus Areas (<75% Mastery):', 18, insightY);
  insightY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const focusStr = focusAreas.length > 0
    ? focusAreas.slice(0, 5).map(f => `${f.topic} (${f.avg}%)`).join('  •  ')
    : 'All active topics are mastered above 75%! Outstanding performance.';
  doc.text(doc.splitTextToSize(focusStr, pageWidth - 40), 18, insightY);

  currentY += 48;

  // 4. Session History Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('DETAILED SESSION LOG & QUIZ HISTORY', 14, currentY);
  currentY += 6;

  // Table header background
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(14, currentY, pageWidth - 28, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Topic / Subject', 18, currentY + 5.5);
  doc.text('Date', 110, currentY + 5.5);
  doc.text('Questions', 145, currentY + 5.5);
  doc.text('Score', 175, currentY + 5.5);

  currentY += 8;

  const reversedSessions = [...sessions].reverse();

  if (reversedSessions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No study sessions recorded yet.', 18, currentY + 6);
  } else {
    reversedSessions.forEach((s, idx) => {
      // Check if bottom reached, add new page
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = 15;

        // Repeat table header on new page
        doc.setFillColor(37, 99, 235);
        doc.rect(14, currentY, pageWidth - 28, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text('Topic / Subject', 18, currentY + 5.5);
        doc.text('Date', 110, currentY + 5.5);
        doc.text('Questions', 145, currentY + 5.5);
        doc.text('Score', 175, currentY + 5.5);
        currentY += 8;
      }

      const pct = Math.round((s.quizScore / (s.totalQuestions || 1)) * 100);
      const dateStr = s.timestamp?.toDate 
        ? s.timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString();

      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, currentY, pageWidth - 28, 7, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      const topicShort = s.topic.length > 42 ? s.topic.substring(0, 39) + '...' : s.topic;
      doc.text(topicShort, 18, currentY + 5);
      doc.text(dateStr, 110, currentY + 5);
      doc.text(`${s.quizScore}/${s.totalQuestions || 1}`, 145, currentY + 5);

      doc.setFont('helvetica', 'bold');
      if (pct >= 80) doc.setTextColor(16, 185, 129); // green
      else if (pct >= 60) doc.setTextColor(245, 158, 11); // amber
      else doc.setTextColor(225, 29, 72); // rose

      doc.text(`${pct}%`, 175, currentY + 5);

      currentY += 7;
    });
  }

  // Apply footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  doc.save(`AI_StudyBuddy_Progress_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
