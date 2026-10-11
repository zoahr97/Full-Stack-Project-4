// ייבוא רכיב ה-StrictMode מתוך ספריית React לצורך בדיקות והתרעות בזמן פיתוח
import { StrictMode } from 'react'
// ייבוא הפונקציה createRoot מתוך ספריית ה-DOM של React לרינדור האפליקציה בדפדפן
import { createRoot } from 'react-dom/client'
// ייבוא קובץ העיצוב הגלובלי (CSS) שמשפיע על כל האפליקציה
import './index.css'
// ייבוא רכיב האפליקציה הראשי (App) שיצרת בקובץ App.jsx
import App from './App.jsx'

/** * מציאת אלמנט ה-HTML עם ה-ID בשם 'root' (נמצא בתוך index.html) 
 * ויצירת "שורש" (Root) עבור האפליקציה של React בתוך האלמנט הזה
 */
createRoot(document.getElementById('root')).render(
  /** * עטיפת האפליקציה ב-StrictMode: 
   * כלי פיתוח שעוזר לזהות בעיות פוטנציאליות בקוד (כמו שימוש בפונקציות מיושנות) 
   */
  <StrictMode>
    {/* רינדור רכיב האפליקציה הראשי שבו נמצאת כל הלוגיקה והממשק */}
    <App />
  </StrictMode>,
)