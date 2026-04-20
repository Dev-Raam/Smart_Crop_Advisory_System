export const formatConfidence = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'N/A';
  }

  return `${Number(value).toFixed(2)}%`;
};

export const formatHistoryType = (value) => value.replaceAll('_', ' ');
