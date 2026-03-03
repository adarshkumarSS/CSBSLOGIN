
/**
 * Calculates the current semester and academic year based on the batch (starting year).
 * @param {number} batch - The starting year of the student (e.g., 2023).
 * @returns {object} { semester: number, year: string }
 */
const calculateSemesterAndYear = (batch) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

    // Academic year usually starts in June/July. Let's assume July (Index 6) for safety.
    // If we are in or after July, we are in the 'Odd' semester of the new academic year.
    // E.g., June 2025: End of previous year. July 2025: Start of new year.

    let diff = currentYear - batch;

    let semester;
    let year;

    if (currentMonth >= 6) { 
        // July - Dec: Odd Semester (1, 3, 5, 7)
        // Academic Year is diff + 1 (e.g., 2025 - 2023 = 2. We are in 3rd year start)
        semester = (diff * 2) + 1;
        
        const yearNum = diff + 1;
        year = getRomanYear(yearNum);

    } else {
        // Jan - June: Even Semester (2, 4, 6, 8)
        // Academic Year is diff (e.g., 2025 - 2023 = 2. We are in 2nd year end)
        semester = diff * 2;
        
        const yearNum = diff;
        year = getRomanYear(yearNum);
    }
    
    // Ensure semester is at least 1 (e.g. if newly joined in June before start)
    if (semester < 1) semester = 1;

    // Cap at 8 sem / 4th year for B.Tech usually, but function should just calculate.
    
    return { semester, year };
};

const getRomanYear = (num) => {
    switch (num) {
        case 1: return 'I';
        case 2: return 'II';
        case 3: return 'III';
        case 4: return 'IV';
        default: return num > 4 ? 'IV+' : 'I'; // Fallback
    }
}

module.exports = { calculateSemesterAndYear };
