/**
 * Pagination helper for list APIs
 */

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Build WHERE clause and params from filter object
 */
const buildWhereClause = (filters, startIndex = 1) => {
  const conditions = [];
  const values = [];
  let idx = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, values, nextIndex: idx };
};

/**
 * Build search condition for text search
 */
const buildSearchCondition = (searchTerm, columns, startIndex) => {
  if (!searchTerm) return { condition: '', values: [], nextIndex: startIndex };

  const conditions = columns.map((col, i) => `${col} ILIKE $${startIndex + i}`);
  const values = columns.map(() => `%${searchTerm}%`);

  return {
    condition: `(${conditions.join(' OR ')})`,
    values,
    nextIndex: startIndex + columns.length,
  };
};

module.exports = { getPaginationParams, buildPaginationMeta, buildWhereClause, buildSearchCondition };
