import { db, FieldValue } from "@/firebase";
import { getWeekNumber, parseLocalDate } from "@/utils/dateUtils";

export const attendanceService = {
  async fetchAttendanceByDate(date) {
    const snapshot = await db
      .collection("attendance")
      .where("date", "==", date)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  },

  async fetchAttendanceByDates(dates) {
    // Firestore 'in' query limit 10
    if (dates.length === 0) return [];
    if (dates.length > 10) {
      // Fallback or error, but for this app (4 weeks) it's fine.
      console.warn(
        "fetchAttendanceByDates: requesting more than 10 dates, might fail."
      );
    }

    const snapshot = await db
      .collection("attendance")
      .where("date", "in", dates)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  },

  async fetchAttendanceForGroup(date, studentIds) {
    if (!studentIds || studentIds.length === 0) return [];

    // Chunking for 'in' query
    const chunks = [];
    for (let i = 0; i < studentIds.length; i += 10) {
      chunks.push(studentIds.slice(i, i + 10));
    }

    let allRecords = [];
    for (const chunk of chunks) {
      const snapshot = await db
        .collection("attendance")
        .where("date", "==", date)
        .where("studentId", "in", chunk)
        .get();
      const chunkRecords = snapshot.docs.map((doc) => doc.data());
      allRecords = [...allRecords, ...chunkRecords];
    }

    return allRecords;
  },

  async fetchStudentAttendance(studentId) {
    try {
      const snapshot = await db
        .collection("attendance")
        .where("studentId", "==", studentId)
        .get();

      const records = snapshot.docs.map((doc) => doc.data());
      // Client-side sorting (Newest first)
      return records.sort((a, b) => (a.date < b.date ? 1 : -1));
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      return [];
    }
  },

  async saveAttendance(date, groupId, attendanceMap, students) {
    const batch = db.batch();
    const dateObj = parseLocalDate(date);
    const week = getWeekNumber(dateObj);
    const year = dateObj.getFullYear();

    students.forEach((student) => {
      const studentId = student.id;
      const status = attendanceMap[studentId];
      const docId = `${date}_${studentId}`;
      const attendanceRef = db.collection("attendance").doc(docId);

      if (status === "present") {
        batch.set(attendanceRef, {
          studentId,
          groupId,
          status: "present",
          date,
          week,
          year,
        });

        // Auto-activate inactive students
        if (student.status === "inactive") {
          const studentRef = db.collection("students").doc(studentId);
          batch.update(studentRef, {
            status: "active",
            deactivatedAt: FieldValue.delete(),
          });
        }
      } else {
        batch.delete(attendanceRef);
      }
    });

    await batch.commit();
  },
};
