import { db } from "@/firebase";
import { getRecentSundays } from "@/utils/dateUtils";

export async function fetchLongTermAbsentees() {
  try {
    // 1. 최근 10주 주일 날짜 가져오기 (10개는 Firestore 'in' 쿼리 제한)
    const recentSundays = getRecentSundays(10);

    // 2. 전체 활성 학생 가져오기
    const studentSnapshot = await db
      .collection("students")
      .where("status", "==", "active")
      .get();

    const allStudents = studentSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (allStudents.length === 0) {
      return [];
    }

    // 3. 해당 기간의 실제 출석 데이터 확인
    const attendanceSnapshot = await db
      .collection("attendance")
      .where("date", "in", recentSundays)
      .get();

    const records = attendanceSnapshot.docs.map((doc) => doc.data());

    // 4. 데이터가 존재하는 날짜(유효한 서비스 날짜)만 추출
    const validDatesSet = new Set(records.map((r) => r.date));
    const validDates = Array.from(validDatesSet).sort().reverse(); // 최신순

    // 5. 4주 이상 데이터가 없으면 판단 불가 (또는 4주치가 아직 안됨)
    if (validDates.length < 4) {
      console.warn("최근 4주의 출석 데이터가 확보되지 않았습니다.");
      return [];
    }

    // 최근 4개의 유효한 서비스 날짜만 타겟팅
    const targetDates = validDates.slice(0, 4);

    // 6. 타겟 날짜들에 출석 기록이 하나도 없는 학생 필터링
    const absentees = allStudents.filter((student) => {
      // 신규 등록한지 4주가 안 된 학생은 제외해야 함 (가입일 체크 필요)
      // 하지만 가입일 필드가 없으므로, 일단 보수적으로 처리하지 않음.
      // (만약 필요하다면 createdAt 필드를 확인해야 함)

      const hasAttendance = records.some(
        (record) =>
          targetDates.includes(record.date) &&
          record.studentId === student.id &&
          record.status === "present"
      );
      return !hasAttendance;
    });

    return absentees;
  } catch (error) {
    console.error("장기 미출석자 조회 실패:", error);
    return [];
  }
}

export function advanceGrade(currentGrade) {
  if (!currentGrade) return "";

  // 초등
  const elementary = /초(\d+)/;
  let match = currentGrade.match(elementary);
  if (match) {
    const year = parseInt(match[1]);
    if (year < 6) return `초${year + 1}`;
    return "중1";
  }

  // 중등
  const middle = /중(\d+)/;
  match = currentGrade.match(middle);
  if (match) {
    const year = parseInt(match[1]);
    if (year < 3) return `중${year + 1}`;
    return "고1";
  }

  // 고등
  const high = /고(\d+)/;
  match = currentGrade.match(high);
  if (match) {
    const year = parseInt(match[1]);
    if (year < 3) return `고${year + 1}`;
    return "대1";
  }

  return currentGrade;
}
