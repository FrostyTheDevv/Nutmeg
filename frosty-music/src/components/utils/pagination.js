const getPaginationData = (items, page, itemsPerPage = 5) => {
  if (!items || items.length === 0) {
    return {
      items: [],
      page: 1,
      totalPages: 0,
      start: 0,
      end: 0,
      hasNext: false,
      hasPrev: false,
    };
  }

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const validPage = Math.max(1, Math.min(page, totalPages));
  const start = (validPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  return {
    items: items.slice(start, end),
    page: validPage,
    totalPages,
    start,
    end,
    hasNext: validPage < totalPages,
    hasPrev: validPage > 1,
  };
};

const createPaginationButtons = (page, totalPages, previousId, nextId) => {
  return {
    previous: {
      customId: `${previousId}_${page}`,
      disabled: page === 1,
    },
    next: {
      customId: `${nextId}_${page}`,
      disabled: page === totalPages,
    },
    info: `${page}/${totalPages}`,
  };
};

module.exports = {
  getPaginationData,
  createPaginationButtons,
};