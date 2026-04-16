/**
 * utils/validate.js — Input validation helpers
 * بدون مكتبات خارجية — خفيف وسريع
 */

/**
 * Validates a set of fields against rules.
 * @param {Object} data   - req.body or any object
 * @param {Object} rules  - { fieldName: 'required|email|min:6|max:100' }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(data, rules) {
  const errors = [];

  for (const [field, ruleStr] of Object.entries(rules)) {
    const val   = data[field];
    const rList = ruleStr.split('|');

    for (const rule of rList) {
      if (rule === 'required') {
        if (val === undefined || val === null || String(val).trim() === '') {
          errors.push(`الحقل "${field}" مطلوب`);
        }
      } else if (rule === 'email') {
        if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          errors.push(`"${field}" يجب أن يكون بريداً إلكترونياً صحيحاً`);
        }
      } else if (rule.startsWith('min:')) {
        const min = parseInt(rule.split(':')[1]);
        if (val && String(val).trim().length < min) {
          errors.push(`"${field}" يجب أن يكون على الأقل ${min} أحرف`);
        }
      } else if (rule.startsWith('max:')) {
        const max = parseInt(rule.split(':')[1]);
        if (val && String(val).trim().length > max) {
          errors.push(`"${field}" يجب ألا يتجاوز ${max} حرفاً`);
        }
      } else if (rule === 'numeric') {
        if (val !== undefined && val !== null && isNaN(Number(val))) {
          errors.push(`"${field}" يجب أن يكون رقماً`);
        }
      } else if (rule.startsWith('in:')) {
        const allowed = rule.split(':')[1].split(',');
        if (val && !allowed.includes(String(val))) {
          errors.push(`"${field}" يجب أن يكون أحد: ${allowed.join(', ')}`);
        }
      } else if (rule === 'boolean') {
        if (val !== undefined && typeof val !== 'boolean') {
          errors.push(`"${field}" يجب أن يكون true أو false`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Express middleware factory — validates req.body and returns 400 on failure
 * Usage: router.post('/', validateBody({ name:'required|max:100', email:'required|email' }), handler)
 */
function validateBody(rules) {
  return (req, res, next) => {
    const { valid, errors } = validate(req.body || {}, rules);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: errors[0],     // أول خطأ للعرض
        errors                   // قائمة كل الأخطاء
      });
    }
    next();
  };
}

module.exports = { validate, validateBody };
