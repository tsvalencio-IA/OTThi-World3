(() => {
  'use strict';
  const capture = (element, pointerId) => {
    try {
      if (!element || !Number.isInteger(pointerId) || !element.setPointerCapture) return false;
      element.setPointerCapture(pointerId);
      return true;
    } catch { return false; }
  };
  const release = (element, pointerId) => {
    try {
      if (!element || !Number.isInteger(pointerId) || !element.releasePointerCapture) return false;
      if (element.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId);
      return true;
    } catch { return false; }
  };
  window.OTTHI_POINTER = Object.freeze({ capture, release });
})();
