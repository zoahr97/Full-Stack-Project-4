// ייבוא הוק ה-useState מתוך ספריית React לניהול מצב השפה במקלדת
import { useState } from 'react';

// אובייקט המכיל את פריסות המקשים עבור השפות השונות (עברית, אנגלית ואימוג'י)
const languageLayouts = {
  // פירוק מחרוזת האותיות בעברית למערך של תווים בודדים
  Hebrew: 'קראטוןםפשדגכעיחלךףזסבהנמצתץ'.split(''),
  // פירוק מחרוזת האותיות באנגלית למערך של תווים בודדים
  English: 'qwertyuiopasdfghjklzxcvbnm'.split(''),
  // מערך מוכן של תווי אימוג'י נבחרים
  Emoji: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉','🙂', '😍']
};

// יצירת מערך של ספרות מ-1 עד 0 לצורך הצגת מקשי המספרים
const numbersLayout = '1234567890'.split('');

// מערך של תווים מיוחדים וסימני פיסוק שיופיעו תמיד במקלדת
const symbolsLayout = ['.', ',', '?', '!', ':', '-', '/','_', '(', ')', '[', ']', '{', '}', '@', '#', '%', '*', '+', '='];

/**
 * רכיב המקלדת הווירטואלית
 * @param {Function} onKeyClick - פונקציה המופעלת בעת לחיצה על מקש ומעבירה את התו שנבחר
 */
function Keyboard({ onKeyClick }) {
  // הגדרת מצב (State) לשפה הנוכחית שמוצגת במקלדת (ברירת מחדל: עברית)
  const [language, setLanguage] = useState('Hebrew');

  return (
    // המעטפת הראשית של רכיב המקלדת
    <div className="keyboard-container">
      
      {/* אזור כפתורי החלפת השפה */}
      <div className="lang-switcher">
        {/* מעבר על המפתחות של אובייקט השפות ויצירת כפתור עבור כל שפה */}
        {Object.keys(languageLayouts).map(lang => (
          <button
            key={lang} // מפתח ייחודי עבור React
            onClick={() => setLanguage(lang)} // בעת לחיצה, עדכן את השפה בסטייט
            // החלת מחלקה עיצובית 'active-btn' אם זו השפה שנבחרה כרגע
            className={language === lang ? 'active-btn' : ''}
          >
            {lang}
          </button>
        ))}
      </div>

      {/* האזור שמכיל את כל מקשי ההקלדה */}
      <div className="keyboard language-keyboard">
        
        {/* רינדור מקשי המספרים מתוך המערך שהוגדר מראש */}
        {numbersLayout.map((char, index) => (
          <button key={`num-${index}`} onClick={() => onKeyClick(char)}>
            {char}
          </button>
        ))}

        {/* רינדור מקשי סימני הפיסוק והסמלים */}
        {symbolsLayout.map((char, index) => (
          <button key={`sym-${index}`} onClick={() => onKeyClick(char)}>
            {char}
          </button>
        ))}

        {/* רינדור אותיות השפה שנבחרה כרגע מתוך אובייקט הפריסות */}
        {languageLayouts[language].map((char, index) => (
          <button key={`${language}-${index}`} onClick={() => onKeyClick(char)}>
            {char}
          </button>
        ))}

        {/* כפתור מיוחד עבור מקש הרווח (Space) */}
        <button className="space-bar" onClick={() => onKeyClick(' ')}>
          Space
        </button>
      </div>
    </div>
  );
}

// ייצוא הרכיב כדי שניתן יהיה להשתמש בו בתוך App.js או רכיבים אחרים
export default Keyboard;