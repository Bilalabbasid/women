/** Tracker honesty strip dismissal (see components/app/notice-dismiss.tsx). */
export const NOTICE_KEY = 'menoverdict_notice_dismissed';
export const NOTICE_CLASS = 'notice-closed';

/** Inline, right after the strip: hides it before paint on a full page load. */
export const NOTICE_PAINT_SCRIPT =
  "try{var k='" +
  NOTICE_KEY +
  "';if(localStorage.getItem(k)||sessionStorage.getItem(k))document.documentElement.classList.add('" +
  NOTICE_CLASS +
  "')}catch(e){}";
