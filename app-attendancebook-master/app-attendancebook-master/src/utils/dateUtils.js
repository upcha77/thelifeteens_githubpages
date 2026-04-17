export function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getWeekNumber(d) {
  const date =
    typeof d === "string" ? parseLocalDate(d) : new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const diff = (date.getTime() - week1.getTime()) / 86400000;
  const adjustment = (week1.getDay() + 6) % 7;

  return 1 + Math.round((diff - 3 + adjustment) / 7);
}

export function getRecentSundays(count = 4) {
  const sundays = [];
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Calculate the most recent Sunday (today if today is Sunday)
  const mostRecentSunday = new Date(today);
  mostRecentSunday.setDate(today.getDate() - dayOfWeek);

  for (let i = 0; i < count; i++) {
    const d = new Date(mostRecentSunday);
    d.setDate(mostRecentSunday.getDate() - 7 * i);
    sundays.push(formatDateToYYYYMMDD(d));
  }

  return sundays;
}

export function generateTargetSundays() {
  const sundays = [];

  // 2025년 48주차 ~ 52주차
  const year2025 = 2025;
  let date = new Date(year2025, 0, 1);
  while (date.getFullYear() === year2025) {
    if (date.getDay() === 0) {
      const weekNum = getWeekNumber(date);
      if (weekNum >= 48) {
        const dateString = formatDateToYYYYMMDD(date);
        sundays.push({
          date: dateString,
          label: `${dateString} (${weekNum}주차)`,
        });
      }
    }
    date.setDate(date.getDate() + 1);
  }

  // 2026년 1주차 ~ 52주차 (전체)
  const year2026 = 2026;
  date = new Date(year2026, 0, 1);
  while (date.getFullYear() === year2026) {
    if (date.getDay() === 0) {
      const dateString = formatDateToYYYYMMDD(date);
      const weekNum = getWeekNumber(date);
      sundays.push({
        date: dateString,
        label: `${dateString} (${weekNum}주차)`,
      });
    }
    date.setDate(date.getDate() + 1);
  }

  return sundays;
}

// ★★★ 생일 파싱 및 D-Day 계산 로직 추가 ★★★

export function parseKoreanDate(dateString) {
  if (!dateString) return null;

  // 숫자만 추출 (예: "7월 24일" -> [7, 24], "12.25" -> [12, 25])
  const matches = dateString.match(/(\d+)/g);
  if (!matches || matches.length < 2) return null;

  return {
    month: parseInt(matches[0], 10),
    day: parseInt(matches[1], 10),
  };
}

export function getDaysUntilBirthday(month, day) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  // 올해 생일
  let birthday = new Date(currentYear, month - 1, day);

  // D-Day 계산 (밀리초 차이 -> 일수 변환)
  let diffTime = birthday.getTime() - today.getTime();
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 이미 지났다면(음수), 내년 생일과 비교할지, 아니면 '지난 생일'로 처리할지 결정
  // 여기서는 D+30 (지난 30일)까지 체크해야 하므로,
  // -30보다 작으면(더 과거면) 내년 생일로 간주하여 D-Day를 다시 계산할 수도 있지만,
  // 요구사항은 "지난 30일 ~ 다가올 15일"이므로 이 범위 내에 있는지만 중요함.

  // 만약 diffDays가 -30보다 작다면 (예: -100일), 내년 생일이 다가오는 것일 수 있음.
  // 하지만 "다가오는 생일" 관점에서는 내년 생일이 D-15 이내일 수 있으므로 체크 필요.

  if (diffDays < -30) {
    // 내년 생일로 다시 계산
    birthday.setFullYear(currentYear + 1);
    diffTime = birthday.getTime() - today.getTime();
    const nextYearDiffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 내년 생일이 D-15 이내라면 그것을 반환
    if (nextYearDiffDays <= 15) {
      return nextYearDiffDays;
    }
  }

  // 연말(12월)에 내년 1월 생일을 체크하는 경우 (예: 오늘 12/30, 생일 1/5)
  // 위 로직에서 이미 올해 1/5은 지났으므로 -300일 정도 나옴 -> 내년 1/5로 계산됨.

  return diffDays;
}
