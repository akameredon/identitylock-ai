(function(root){
  'use strict';
  function toggleSelection(currentIds, promptId, limit){
    const max = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const id = typeof promptId === 'string' ? promptId.trim() : '';
    const next = new Set(currentIds || []);
    if (!id) return next;
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < max) {
      next.add(id);
    }
    return next;
  }
  function isComplete(selectedIds, limit){
    const max = Number.isInteger(limit) && limit > 0 ? limit : 10;
    return new Set(selectedIds || []).size === max;
  }
  const api = Object.freeze({toggleSelection, isComplete});
  root.IdentityLockSelection = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);