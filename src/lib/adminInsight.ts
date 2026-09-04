/**
 * Generates automated narrative insights for the Admin Excel Export.
 * Formats concrete numbers, department metrics, overdue rates,
 * and completion trends into readable paragraphs.
 */
export function generateAdminInsight(allProjects: any[]): string[] {
  const now = new Date();
  const total = allProjects.length;
  if (total === 0) return ["Belum ada data proyek untuk dianalisis."];

  // Departemen dengan proyek terbanyak
  const deptCounts: Record<string, number> = {};
  allProjects.forEach((p) => {
    if (p.department) {
      deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
    }
  });
  const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];

  // Completion rate
  const completed = allProjects.filter((p) => p.status === "Completed").length;
  const completionRate = Math.round((completed / total) * 100);

  // Overdue
  const overdue = allProjects.filter(
    (p) => p.dueDate && p.status !== "Completed" && new Date(p.dueDate) < now
  ).length;
  const overdueRate = Math.round((overdue / total) * 100);

  // Rata-rata waktu penyelesaian per dept (untuk temukan tercepat/terlambat)
  const deptDays: Record<string, number[]> = {};
  allProjects.forEach((p) => {
    if (p.status === "Completed" && p.startDate && p.updatedAt) {
      const days = Math.ceil(
        (new Date(p.updatedAt).getTime() - new Date(p.startDate).getTime()) /
          86400000
      );
      if (days > 0) {
        (deptDays[p.department] ??= []).push(days);
      }
    }
  });
  const deptAvg = Object.entries(deptDays).map(
    ([d, arr]) => [d, arr.reduce((a, b) => a + b, 0) / arr.length] as [string, number]
  );
  deptAvg.sort((a, b) => a[1] - b[1]);
  const fastest = deptAvg[0];
  const slowest = deptAvg[deptAvg.length - 1];

  // Follow-up decision paling umum
  const followUpCounts: Record<string, number> = {};
  allProjects.forEach((p) => {
    const fu = (p.content as any)?.step7?.followUpDecision;
    if (fu) followUpCounts[fu] = (followUpCounts[fu] || 0) + 1;
  });
  const topFollowUp = Object.entries(followUpCounts).sort((a, b) => b[1] - a[1])[0];

  const lines: string[] = [];
  lines.push(
    `Dari total ${total} proyek yang tercatat, ${completed} proyek (${completionRate}%) telah berstatus Completed, sementara ${overdue} proyek (${overdueRate}%) sudah melewati target penyelesaian namun belum selesai.`
  );
  if (topDept) {
    lines.push(
      `Departemen ${topDept[0]} merupakan kontributor proyek terbanyak dengan ${topDept[1]} proyek, menunjukkan aktivitas perbaikan paling intensif berada di area tersebut.`
    );
  }
  if (fastest && slowest && fastest[0] !== slowest[0]) {
    lines.push(
      `Departemen ${fastest[0]} menyelesaikan proyek rata-rata dalam ${Math.round(
        fastest[1]
      )} hari, tercepat dibanding departemen lain, sedangkan ${
        slowest[0]
      } rata-rata membutuhkan ${Math.round(
        slowest[1]
      )} hari — selisih ini bisa jadi acuan berbagi praktik terbaik antar departemen.`
    );
  }
  if (topFollowUp) {
    const labelMap: Record<string, string> = {
      proliferasi: "Proliferasi / Horizontal Deployment",
      monitoring: "Monitoring Berkelanjutan",
      pdca_ulang: "PDCA Ulang",
      eskalasi: "Eskalasi ke Manajemen",
    };
    lines.push(
      `Keputusan tindak lanjut yang paling sering diambil adalah "${
        labelMap[topFollowUp[0]] || topFollowUp[0]
      }" (${topFollowUp[1]} dari total proyek yang sudah sampai tahap evaluasi), mengindikasikan kecenderungan tim dalam menindaklanjuti hasil perbaikan.`
    );
  }
  if (overdueRate > 20) {
    lines.push(
      `Perlu perhatian: tingkat proyek overdue mencapai ${overdueRate}%, cukup tinggi — disarankan meninjau kembali alokasi target waktu (dueDate) atau kapasitas PIC pada proyek yang tertunda.`
    );
  }

  return lines;
}
