// backend/models/studentModel.js
const pool = require("../config/database");

// Fetch a student by id (without password_hash)
async function findStudentById(id) {
  const query = `
    SELECT
      id,
      name,
      email,
      roll_number,
      year,
      department,
      phone,

      -- personal
      date_of_birth,
      gender,
      blood_group,
      community,
      re_caste,

      -- address
      address_line1,
      address_line2,
      city,
      state,
      pincode,

      -- parents
      father_name,
      father_phone,
      father_desi,
      mother_name,
      mother_phone,
      mother_desi,

      -- academic meta
      section,
      batch,
      family_income,

      -- SSLC
      sslc_school_name,
      sslc_school_address,
      sslc_marks,
      tot_sslc_marks,

      -- HSC
      hsc_school_name,
      hsc_school_address,
      hsc_marks,
      tot_hsc_marks,

      -- Diploma
      diploma_clg_name,
      diploma_clg_address,
      diploma_marks,
      tot_diploma_marks,

      -- misc
      profile_photo_url,

      created_at,
      updated_at
    FROM students
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

// Update allowed profile fields for a student
async function updateStudentProfile(id, data) {
  // All fields that a student is allowed to update
  const allowedFields = [
    "name",
    "phone",
    "year",
    "department",

    "date_of_birth",
    "gender",
    "blood_group",
    "community",
    "re_caste",

    "address_line1",
    "address_line2",
    "city",
    "state",
    "pincode",

    "father_name",
    "father_phone",
    "father_desi",
    "mother_name",
    "mother_phone",
    "mother_desi",

    "section",
    "batch",
    "family_income",

    "sslc_school_name",
    "sslc_school_address",
    "sslc_marks",
    "tot_sslc_marks",

    "hsc_school_name",
    "hsc_school_address",
    "hsc_marks",
    "tot_hsc_marks",

    "diploma_clg_name",
    "diploma_clg_address",
    "diploma_marks",
    "tot_diploma_marks",

    "profile_photo_url",
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

  // id as last param
  values.push(id);

  const query = `
    UPDATE students
    SET ${updates.join(", ")}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING
      id,
      name,
      email,
      roll_number,
      year,
      department,
      phone,

      date_of_birth,
      gender,
      blood_group,
      community,
      re_caste,

      address_line1,
      address_line2,
      city,
      state,
      pincode,

      father_name,
      father_phone,
      father_desi,
      mother_name,
      mother_phone,
      mother_desi,

      section,
      batch,
      family_income,

      sslc_school_name,
      sslc_school_address,
      sslc_marks,
      tot_sslc_marks,

      hsc_school_name,
      hsc_school_address,
      hsc_marks,
      tot_hsc_marks,

      diploma_clg_name,
      diploma_clg_address,
      diploma_marks,
      tot_diploma_marks,

      profile_photo_url,

      created_at,
      updated_at;
  `;

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

module.exports = {
  findStudentById,
  updateStudentProfile,
};
