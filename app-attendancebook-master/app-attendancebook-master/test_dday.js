function getDaysUntilBirthday(month, day) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  let birthday = new Date(currentYear, month - 1, day);
  let diffTime = birthday.getTime() - today.getTime();
  let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < -30) {
    birthday.setFullYear(currentYear + 1);
    diffTime = birthday.getTime() - today.getTime();
    const nextYearDiffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (nextYearDiffDays <= 15) {
      return nextYearDiffDays;
    }
  }
  return diffDays;
}

const today = new Date();
console.log("Today:", today.toISOString());

// Test Future (Tomorrow)
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
console.log(
  `Tomorrow (${tomorrow.getMonth() + 1}/${tomorrow.getDate()}):`,
  getDaysUntilBirthday(tomorrow.getMonth() + 1, tomorrow.getDate())
);

// Test Past (Yesterday)
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
console.log(
  `Yesterday (${yesterday.getMonth() + 1}/${yesterday.getDate()}):`,
  getDaysUntilBirthday(yesterday.getMonth() + 1, yesterday.getDate())
);

// Test Future 10 days
const future10 = new Date(today);
future10.setDate(today.getDate() + 10);
console.log(
  `Future 10 (${future10.getMonth() + 1}/${future10.getDate()}):`,
  getDaysUntilBirthday(future10.getMonth() + 1, future10.getDate())
);

// Test Past 5 days
const past5 = new Date(today);
past5.setDate(today.getDate() - 5);
console.log(
  `Past 5 (${past5.getMonth() + 1}/${past5.getDate()}):`,
  getDaysUntilBirthday(past5.getMonth() + 1, past5.getDate())
);
