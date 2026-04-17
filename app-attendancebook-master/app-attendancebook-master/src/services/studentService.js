import { db, FieldPath, FieldValue } from "@/firebase";
import { parseKoreanDate, getDaysUntilBirthday } from "@/utils/dateUtils";

export const studentService = {
  // Simple in-memory cache
  _cache: {
    groups: null,
    allStudents: null,
    settings: null,
    timestamp: 0,
  },
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  _isCacheValid() {
    return Date.now() - this._cache.timestamp < this.CACHE_DURATION;
  },

  async fetchGroups() {
    if (this._cache.groups && this._isCacheValid()) {
      return this._cache.groups;
    }

    const snapshot = await db
      .collection("groups")
      .orderBy("groupName", "asc")
      .get();
    const groups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side sort for custom order
    groups.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 9999;
      const orderB = b.order !== undefined ? b.order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.groupName.localeCompare(b.groupName);
    });

    this._cache.groups = groups;
    this._cache.timestamp = Date.now();
    return groups;
  },

  async fetchGroupById(groupId) {
    // Try to find in cache first
    if (this._cache.groups && this._isCacheValid()) {
      const group = this._cache.groups.find((g) => g.id === groupId);
      if (group) return group;
    }

    const doc = await db.collection("groups").doc(groupId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async fetchStudentsByIds(studentIds) {
    if (!studentIds || studentIds.length === 0) return [];

    // If we have all students cached, filter from there
    if (this._cache.allStudents && this._isCacheValid()) {
      return this._cache.allStudents.filter((s) => studentIds.includes(s.id));
    }

    // Otherwise fetch from DB (chunked)
    const chunks = [];
    for (let i = 0; i < studentIds.length; i += 10) {
      chunks.push(studentIds.slice(i, i + 10));
    }

    let allStudents = [];
    for (const chunk of chunks) {
      const snapshot = await db
        .collection("students")
        .where(FieldPath.documentId(), "in", chunk)
        .get();
      const chunkStudents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      allStudents = [...allStudents, ...chunkStudents];
    }

    return allStudents;
  },

  async fetchAllStudents() {
    if (this._cache.allStudents && this._isCacheValid()) {
      return this._cache.allStudents;
    }

    const snapshot = await db.collection("students").get();
    const students = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    this._cache.allStudents = students;
    this._cache.timestamp = Date.now();
    return students;
  },

  async fetchActiveStudents() {
    // Use fetchAllStudents and filter if cached, otherwise fetch query
    if (this._cache.allStudents && this._isCacheValid()) {
      return this._cache.allStudents.filter((s) => s.status === "active");
    }

    const snapshot = await db
      .collection("students")
      .where("status", "==", "active")
      .get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  // Logic to filter students who were active at a specific date
  filterActiveStudentsAtDate(students, date) {
    const activeStudentIds = new Set();
    students.forEach((student) => {
      if (student.status === "active") {
        activeStudentIds.add(student.id);
      } else if (student.status === "inactive" && student.deactivatedAt) {
        if (student.deactivatedAt > date) {
          activeStudentIds.add(student.id);
        }
      }
    });
    return activeStudentIds;
  },

  async fetchBirthdays(pastDays = 30, futureDays = 15) {
    // Let's fetch all active students first.
    const students = await this.fetchActiveStudents();

    const upcomingBirthdays = [];

    students.forEach((student) => {
      if (!student.birthDate) return;

      const parsed = parseKoreanDate(student.birthDate);
      if (parsed) {
        const dDay = getDaysUntilBirthday(parsed.month, parsed.day);
        if (dDay >= -pastDays && dDay <= futureDays) {
          upcomingBirthdays.push({
            ...student,
            dDay,
          });
        }
      }
    });

    // Sort
    return upcomingBirthdays.sort((a, b) => {
      if (a.dDay >= 0 && b.dDay < 0) return -1;
      if (a.dDay < 0 && b.dDay >= 0) return 1;
      if (a.dDay >= 0 && b.dDay >= 0) return a.dDay - b.dDay;
      if (a.dDay < 0 && b.dDay < 0) return b.dDay - a.dDay;
      return 0;
    });
  },

  async fetchLongTermAbsentees(recentSundays, attendanceRecords) {
    const students = await this.fetchActiveStudents();
    if (students.length === 0) return [];

    const absentees = students.filter((student) => {
      const hasAttendance = attendanceRecords.some(
        (record) =>
          record.studentId === student.id && record.status === "present"
      );
      return !hasAttendance;
    });

    return absentees;
  },

  async fetchSettings() {
    if (this._cache.settings && this._isCacheValid()) {
      return this._cache.settings;
    }

    try {
      const doc = await db.collection("settings").doc("global").get();
      if (doc.exists) {
        const settings = doc.data();
        this._cache.settings = settings;
        return settings;
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
    return null;
  },

  async saveSettings(settings) {
    try {
      await db
        .collection("settings")
        .doc("global")
        .set(settings, { merge: true });
      // Update cache
      this._cache.settings = { ...this._cache.settings, ...settings };
      this._cache.timestamp = Date.now(); // Optional: refresh timestamp or keep existing
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      return false;
    }
  },

  async fetchPasswords() {
    const settings = await this.fetchSettings();
    const passwords = {
      appPassword: settings?.appPassword || "12345",
      adminPassword: settings?.adminPassword || "12345",
    };

    // If passwords missing in DB, initialize them silently
    if (!settings?.appPassword || !settings?.adminPassword) {
      await this.saveSettings(passwords);
    }

    return passwords;
  },

  async updatePasswords(passwords) {
    return await this.saveSettings(passwords);
  },

  clearCache() {
    this._cache = {
      groups: null,
      allStudents: null,
      settings: null,
      timestamp: 0,
    };
  },

  async reactivateStudent(studentId) {
    try {
      await db.collection("students").doc(studentId).update({
        status: "active",
        deactivatedAt: FieldValue.delete(),
      });
      this.clearCache();
      return true;
    } catch (error) {
      console.error("Error reactivating student:", error);
      return false;
    }
  },
};
