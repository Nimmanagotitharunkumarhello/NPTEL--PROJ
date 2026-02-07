export const getEnrollmentStatus = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0 = January, 1 = February, etc.
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
  
    // Define boundaries for specific enrollment periods
    const isBetweenJune6AndJuly6 = (currentMonth === 5 && currentDay >= 6) || (currentMonth === 6 && currentDay <= 6);
    const isBetweenDecember12AndJanuary1 = (currentMonth === 11 && currentDay >= 12) || (currentMonth === 0 && currentDay <= 1);
  
    let enrollmentMessage;
  
    if (isBetweenJune6AndJuly6) {
      enrollmentMessage = `ENROLLMENTS ARE OPEN FOR JULY ${currentYear}!`;
    } else if (isBetweenDecember12AndJanuary1) {
      enrollmentMessage = `ENROLLMENTS ARE OPEN FOR JANUARY ${currentYear + 1}!`;
    } else if (currentMonth >= 0 && currentMonth <= 5) { // January to June
      enrollmentMessage = `ENROLLMENTS ARE CLOSED FOR JANUARY ${currentYear}!`;
    } else if (currentMonth >= 6 && currentMonth <= 11) { // July to December
      enrollmentMessage = `ENROLLMENTS ARE CLOSED FOR JULY ${currentYear}!`;
    } else {
      enrollmentMessage = `Enrollment status could not be determined.`;
    }
  
    return enrollmentMessage;
  };
  
  