// backend/models/facultyModel.js
const pool = require("../config/database");

async function findFacultyById(id) {
  const query = `
    SELECT
      id,
      name,
      email,
      employee_id,
      department,
      designation,
      phone,
      years_of_experience,
      degree,
      works,
      educational_qualifications,
      awards_honours,
      other_achievements, 
      created_at,
      updated_at
    FROM faculty
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

async function updateFacultyProfile(id, data) {
  const allowedFields = [
    "name",
    "email",
    "employee_id",
    "department",
    "designation",
    "phone",
    "years_of_experience",
    "degree",
    "works",
    "educational_qualifications",
    "awards_honours",
    "other_achievements", 
  ];

  const updates = [];
  const values = [];
  let idx = 1;

  for (let i = 0; i < allowedFields.length; i++) {
    const field = allowedFields[i];
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      updates.push(`${field} = $${idx}`);
      values.push(data[field]);
      idx++;
    }
  }

  if (updates.length === 0) {
    return null; // nothing to update
  }

  values.push(id);

  const query = `
    UPDATE faculty
    SET ${updates.join(", ")}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING
      id,
      name,
      email,
      employee_id,
      department,
      designation,
      phone,
      years_of_experience,
      degree,
      works,
      educational_qualifications,
      awards_honours,
      other_achievements, 
      created_at,
      updated_at;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

module.exports = {
  findFacultyById,
  updateFacultyProfile,
};