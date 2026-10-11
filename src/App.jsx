// ייבוא הוקים (Hooks) בסיסיים של React לניהול מצב (State) ואפקטים (Side Effects)
import { useEffect, useState } from 'react';
// ייבוא רכיב המקלדת הווירטואלית מתיקיית הרכיבים המקומית
import Keyboard from './components/Keyboard';
// ייבוא קובץ העיצוב (CSS) של האפליקציה לצורך הגדרות ויזואליות
import './App.css';

/**
 * פונקציית עזר ליצירת אובייקט של מסמך חדש עם ערכי ברירת מחדל
 * @param {string} name - שם המסמך
 * @param {Array} textItems - מערך התווים הראשוני
 */
function createDoc(name = '', textItems = []) {
  return {
    // יצירת מזהה ייחודי על ידי שילוב של זמן נוכחי (מילישניות) ומספר אקראי
    id: Date.now() + Math.random(),
    // שם המסמך כפי שיופיע במערכת
    name,
    // מערך של אובייקטים המייצגים תווים בודדים ועיצובם (צבע, פונט וכו')
    textItems,
    // מיקום הסמן במסמך - כברירת מחדל מוצב בסוף הטקסט
    cursorIndex: textItems.length,
    // מחסנית (Stack) לשמירת מצבי עבר של המסמך לצורך ביצוע פעולות "בטל" (Undo)
    history: []
  };
}

function App() {
  // --- ניהול מצבי האפליקציה (States) ---
  
  // מערך המכיל את כל אובייקטי המסמכים שפתוחים כרגע באפליקציה
  const [documents, setDocuments] = useState([createDoc()]);
  // המזהה הייחודי (ID) של המסמך שנמצא כרגע במוקד העריכה
  const [activeDocId, setActiveDocId] = useState(documents[0].id);

  // אובייקט המייצג את סגנון העיצוב הנוכחי שייבחר בפאנל ויוחל על התווים הבאים
  const [currentStyle, setCurrentStyle] = useState({
    color: '#000000', // צבע ברירת מחדל: שחור
    fontSize: '24px', // גודל גופן ברירת מחדל: בינוני
    fontFamily: 'Arial' // סוג גופן ברירת מחדל
  });

  // רשימת שמות הקבצים ששמורים בזיכרון המקומי (LocalStorage) עבור המשתמש הנוכחי
  const [savedFiles, setSavedFiles] = useState([]);
  // מגדיר לאן יוזרק התו מהמקלדת: למסמך הראשי ('main'), לחיפוש ('search') או להחלפה ('replace')
  const [focusField, setFocusField] = useState('main');
  // אחסון זמני של התו שנבחר לצורך פעולת חיפוש במסמך
  const [searchChar, setSearchChar] = useState('');
  // אחסון זמני של התו שנבחר לצורך פעולת החלפה
  const [replaceChar, setReplaceChar] = useState('');

  // שליפת מזהה המשתמש המחובר מהזיכרון המקומי של הדפדפן
  const [activeUser, setActiveUser] = useState(localStorage.getItem('activeUser') || '');
  // שם המשתמש כפי שיוצג בממשק המשתמש (נשלף מהזיכרון)
  const [username, setUsername] = useState(localStorage.getItem('displayUser') || '');
  // משתנה זמני לאחסון הסיסמה בזמן ניסיון ההתחברות (לא נשמרת קבוע ב-State)
  const [password, setPassword] = useState('');

  // משתנה עזר: מוצא את אובייקט המסמך המלא מתוך המערך לפי ה-ID הפעיל
  const activeDoc = documents.find(doc => doc.id === activeDocId);

  // פונקציית עזר ליצירת מפתח משתמש ייחודי (מבוסס שם וסיסמה)
  const getUserId = (name, pass) => `${name}_${pass}`;

  // פונקציית עזר ליצירת מפתח ייחודי לשמירת קובץ השייך למשתמש ספציפי
  const getFileKey = (name) => `file_${activeUser}_${name}`;

  // פונקציה הסורקת את ה-LocalStorage ומחזירה רק את שמות הקבצים השייכים למשתמש המחובר
  const getUserFiles = () => {
    // אם אין משתמש מחובר, אין טעם לחפש קבצים
    if (!activeUser) return [];
    return Object.keys(localStorage)
      // סינון המפתחות שמתחילים בתבנית של המשתמש הנוכחי
      .filter(key => key.startsWith(`file_${activeUser}_`))
      // ניקוי הקידומת כדי להשאיר רק את שם הקובץ המקורי
      .map(key => key.replace(`file_${activeUser}_`, ''));
  };

  // בכל פעם שזהות המשתמש משתנה (התחברות/התנתקות), נעדכן את רשימת הקבצים
  useEffect(() => {
    setSavedFiles(getUserFiles());
  }, [activeUser]);

  // פונקציה לעדכון מצב של המסמך הפעיל בלבד מבלי לפגוע במסמכים אחרים במערך
  const updateActiveDoc = (callback) => {
    setDocuments(prev =>
      // מעבר על כל המסמכים וביצוע הפעולה רק על המסמך שתואם ל-ID הפעיל
      prev.map(doc =>
        doc.id === activeDocId ? callback(doc) : doc
      )
    );
  };

  // יצירת אובייקט המכיל את תוכן הטקסט והסמן הנוכחיים לצורך שמירה בהיסטוריה (לפני שינוי)
  const saveHistory = (doc) => ({
    textItems: doc.textItems,
    cursorIndex: doc.cursorIndex
  });

  // טיפול באירוע לחיצה על מקש במקלדת הווירטואלית
  const handleKeyClick = (char) => {
    // אם המשתמש נמצא במצב הזנת תו לחיפוש
    if (focusField === 'search') {
      setSearchChar(char);
      return;
    }

    // אם המשתמש נמצא במצב הזנת תו להחלפה
    if (focusField === 'replace') {
      setReplaceChar(char);
      return;
    }

    // עדכון תוכן המסמך הראשי
    updateActiveDoc(doc => {
      // יצירת עותק חדש של מערך התווים כדי לשמור על אי-מוטביליות (Immutability)
      const updated = [...doc.textItems];
      // הזרקת התו החדש עם העיצוב הנוכחי לתוך המיקום המדויק שבו נמצא הסמן
      updated.splice(doc.cursorIndex, 0, { char, ...currentStyle });

      return {
        ...doc,
        textItems: updated,
        // קידום הסמן צעד אחד קדימה לאחר ההקלדה
        cursorIndex: doc.cursorIndex + 1,
        // הוספת המצב שהיה לפני רגע לתוך מערך ההיסטוריה
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  // הזזת הסמן שמאלה (מבטיח שהסמן לא ירד מתחת ל-0)
  const moveCursorLeft = () => {
    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: Math.max(0, doc.cursorIndex - 1)
    }));
  };

  // הזזת הסמן ימינה (מבטיח שהסמן לא יעבור את אורך הטקסט הקיים)
  const moveCursorRight = () => {
    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: Math.min(doc.textItems.length, doc.cursorIndex + 1)
    }));
  };

  // מחיקת תו בודד (פעולת Backspace)
  const deleteChar = () => {
    // אם אנחנו בשדות החיפוש/החלפה, ננקה את השדה עצמו
    if (focusField === 'search') { setSearchChar(''); return; }
    if (focusField === 'replace') { setReplaceChar(''); return; }

    updateActiveDoc(doc => {
      // אם הסמן בתחילת המסמך, אין מה למחוק
      if (doc.cursorIndex === 0) return doc;

      const updated = [...doc.textItems];
      // הסרת התו שנמצא בדיוק משמאל לסמן
      updated.splice(doc.cursorIndex - 1, 1);

      return {
        ...doc,
        textItems: updated,
        // הזזת הסמן צעד אחד אחורה בעקבות המחיקה
        cursorIndex: doc.cursorIndex - 1,
        // שמירת המצב הקודם להיסטוריה
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  // מחיקת מילה שלמה בבת אחת
  const deleteWord = () => {
    updateActiveDoc(doc => {
      // אם אין טקסט למחוק
      if (doc.cursorIndex === 0) return doc;

      const updated = [...doc.textItems];
      let end = doc.cursorIndex;

      // דילוג אחורה על רווחים אם קיימים בסוף המילה
      while (end > 0 && updated[end - 1]?.char === ' ') end--;

      // מציאת הנקודה שבה מתחילה המילה (עד הרווח הבא או תחילת השורה)
      let start = end;
      while (start > 0 && updated[start - 1]?.char !== ' ') start--;

      // מחיקת כל טווח התווים המזוהה כמילה
      updated.splice(start, doc.cursorIndex - start);

      return {
        ...doc,
        textItems: updated,
        // העברת הסמן לתחילת המקום שבו הייתה המילה
        cursorIndex: start,
        history: [...doc.history, saveHistory(doc)]
      };
    });
  };

  // איפוס מוחלט של כל תוכן המסמך הפעיל
  const clearAll = () => {
    updateActiveDoc(doc => ({
      ...doc,
      textItems: [], // מערך ריק
      cursorIndex: 0, // איפוס סמן להתחלה
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  // ביטול פעולה אחרונה (Undo)
  const undo = () => {
    updateActiveDoc(doc => {
      // אם אין היסטוריה שמורה, אין מה לבטל
      if (doc.history.length === 0) return doc;

      // שליפת המצב האחרון שנשמר במחסנית
      const last = doc.history[doc.history.length - 1];

      return {
        ...doc,
        textItems: last.textItems,
        cursorIndex: last.cursorIndex,
        // הסרת המצב ששוחזר ממערך ההיסטוריה
        history: doc.history.slice(0, -1)
      };
    });
  };

  // החלת סגנון העיצוב שנבחר (צבע/גודל/גופן) על כל המסמך הקיים
  const applyStyleToAll = () => {
    updateActiveDoc(doc => ({
      ...doc,
      // מעבר על כל תו ועדכון העיצוב שלו לערכים הנוכחיים
      textItems: doc.textItems.map(item => ({
        ...item,
        color: currentStyle.color,
        fontSize: currentStyle.fontSize,
        fontFamily: currentStyle.fontFamily
      })),
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  // החלת העיצוב הנוכחי מהמיקום של הסמן והלאה עד סוף המסמך
  const applyStyleFromCursor = () => {
    updateActiveDoc(doc => ({
      ...doc,
      textItems: doc.textItems.map((item, index) =>
        // החלה רק אם האינדקס של התו גדול או שווה למיקום הסמן
        index >= doc.cursorIndex
          ? { ...item, color: currentStyle.color, fontSize: currentStyle.fontSize, fontFamily: currentStyle.fontFamily }
          : item
      ),
      history: [...doc.history, saveHistory(doc)]
    }));
  };

  // פונקציית חיפוש תו בתוך המסמך
  const findChar = () => {
    // בדיקה שיש תו לחיפוש ומסמך פעיל
    if (!searchChar || !activeDoc) return;

    const chars = activeDoc.textItems.map(item => item.char);
    // חיפוש המופע הבא של התו החל מהמיקום שאחרי הסמן
    const index = chars.indexOf(searchChar, activeDoc.cursorIndex + 1);
    // אם לא נמצא בהמשך, נחפש שוב מתחילת המסמך
    const finalIndex = index !== -1 ? index : chars.indexOf(searchChar);

    if (finalIndex === -1) {
      alert('התו לא נמצא');
      return;
    }

    // העברת הסמן למיקום התו שנמצא
    updateActiveDoc(doc => ({
      ...doc,
      cursorIndex: finalIndex
    }));

    // החזרת הפוקוס לעריכה הראשית
    setFocusField('main');
  };

  // החלפת מופע אחד של תו בתו אחר (במיקום הסמן או אחריו)
  const replaceCharOnce = () => {
    if (!searchChar || !replaceChar || !activeDoc) return;

    const chars = activeDoc.textItems.map(item => item.char);
    const index = chars.indexOf(searchChar, activeDoc.cursorIndex);

    if (index === -1) {
      alert('התו לא נמצא');
      return;
    }

    updateActiveDoc(doc => {
      const updated = [...doc.textItems];
      // החלפת התו ושמירת הסגנון העיצובי שנבחר כרגע
      updated[index] = { char: replaceChar, ...currentStyle };

      return {
        ...doc,
        textItems: updated,
        cursorIndex: index + 1, // קידום הסמן אחרי התו שהוחלף
        history: [...doc.history, saveHistory(doc)]
      };
    });

    setFocusField('main');
  };

  // החלפת כל המופעים של תו מסוים בכל רחבי המסמך
  const replaceAllChars = () => {
    if (!searchChar || !replaceChar) return;

    updateActiveDoc(doc => ({
      ...doc,
      // מעבר על כל המערך והחלפה רק היכן שהתו תואם לחיפוש
      textItems: doc.textItems.map(item =>
        item.char === searchChar
          ? { char: replaceChar, ...currentStyle }
          : item
      ),
      history: [...doc.history, saveHistory(doc)]
    }));

    setFocusField('main');
  };

  // פתיחת מסמך חדש וריק בממשק
  const createNewDocument = () => {
    const newDoc = createDoc();
    // הוספת המסמך החדש למערך המסמכים הקיימים
    setDocuments(prev => [...prev, newDoc]);
    // הפיכת המסמך החדש למסמך הפעיל
    setActiveDocId(newDoc.id);
    setSearchChar('');
    setReplaceChar('');
    setFocusField('main');
  };

  // שמירת תוכן הקובץ לזיכרון המקומי של הדפדפן
  const saveFile = (saveAs = false) => {
    if (!activeDoc) return;

    let name = activeDoc.name;

    // אם אין שם לקובץ או שנבחר "שמור בשם", נבקש מהמשתמש שם
    if (!name || saveAs) {
      name = prompt('הכנס שם קובץ', activeDoc.name || 'מסמך חדש');
    }

    if (!name) return; // ביטול הפעולה אם לא הוזן שם

    // המרת אובייקט המסמך למחרוזת JSON ושמירה ב-LocalStorage
    localStorage.setItem(getFileKey(name), JSON.stringify(activeDoc.textItems))

    // עדכון שם המסמך בתוך ה-State של האפליקציה
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === activeDocId ? { ...doc, name } : doc
      )
    );

    // רענון רשימת הקבצים השמורים המוצגת
    setSavedFiles(getUserFiles());
    alert(`הקובץ "${name}" נשמר בהצלחה`);
  };

  // פתיחת קובץ קיים מתוך הזיכרון המקומי
  const openFile = (name) => {
    // בדוק אם הקובץ כבר פתוח באחד הטאבים כרגע
    const alreadyOpenDoc = documents.find(doc => doc.name === name);

    if (alreadyOpenDoc) {
      // פשוט נעבור אליו
      setActiveDocId(alreadyOpenDoc.id);
      setFocusField('main');
      return;
    }

    // שליפת הנתונים הגולמיים מהזיכרון
    const data = localStorage.getItem(getFileKey(name));
    if (!data) return;

    // המרת המחרוזת חזרה למערך אובייקטים
    const parsed = JSON.parse(data);
    const newDoc = createDoc(name, parsed);

    // הוספה לרשימת המסמכים הפתוחים והפיכה לפעיל
    setDocuments(prev => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    setFocusField('main');
  };

  // מחיקת קובץ מהזיכרון לצמיתות
  const deleteFile = () => {
    if (!activeDoc?.name) return;

    const confirmDelete = confirm(`האם את בטוחה שברצונך למחוק את הקובץ "${activeDoc.name}"?`);
    if (!confirmDelete) return;

    // הסרת המפתח מה-LocalStorage
    localStorage.removeItem(getFileKey(activeDoc.name));

    // עדכון רשימת המסמכים הפתוחים (הסרת המסמך שנמחק)
    const remainingDocs = documents.filter(doc => doc.id !== activeDocId);

    if (remainingDocs.length === 0) {
      // אם לא נשארו מסמכים, פתח אחד חדש ריק
      const newDoc = createDoc();
      setDocuments([newDoc]);
      setActiveDocId(newDoc.id);
    } else {
      setDocuments(remainingDocs);
      setActiveDocId(remainingDocs[0].id);
    }

    setSavedFiles(getUserFiles());
    setSearchChar('');
    setReplaceChar('');
    setFocusField('main');
  };

  // סגירת טאב (כרטיסיית מסמך) מבלי בהכרח למחוק אותו מהזיכרון
  const closeDocument = (docId) => {
    const docToClose = documents.find(doc => doc.id === docId);
    if (!docToClose) return;

    // הצגת אופציה לשמור לפני הסגירה
    const shouldSave = confirm('האם לשמור את הטקסט לפני סגירה?');

    if (shouldSave) {
      const name = docToClose.name || prompt('הכנס שם קובץ', 'מסמך חדש');
      if (name) {
        localStorage.setItem(getFileKey(name), JSON.stringify(docToClose.textItems));
        setSavedFiles(getUserFiles());
      }
    }

    // הסרה ממערך המסמכים הפתוחים
    const remainingDocs = documents.filter(doc => doc.id !== docId);

    if (remainingDocs.length === 0) {
      const newDoc = createDoc();
      setDocuments([newDoc]);
      setActiveDocId(newDoc.id);
      return;
    }

    setDocuments(remainingDocs);

    // אם סגרנו את המסמך שהיה פעיל כרגע, נעבור למסמך הראשון שנותר
    if (activeDocId === docId) {
      setActiveDocId(remainingDocs[0].id);
    }
  };

  // פונקציה שהופכת את אובייקט המסמך לאלמנטים ויזואליים (React Elements)
  const renderDocumentText = (doc) => {
    const output = [];

    // מעבר על כל התווים פלוס מיקום פוטנציאלי לסמן בסוף
    for (let i = 0; i <= doc.textItems.length; i++) {
      // אם זה המיקום של הסמן במסמך הפעיל, נזריק אלמנט "סמן"
      if (doc.id === activeDocId && i === doc.cursorIndex) {
        output.push(<span key={`cursor-${doc.id}-${i}`} className="cursor" />);
      }

      // הוספת התו עצמו עם הסגנון העיצובי ששמור לו
      if (i < doc.textItems.length) {
        const item = doc.textItems[i];
        output.push(
          <span
            key={`${doc.id}-${i}`}
            style={{color: item.color, fontSize: item.fontSize, fontFamily: item.fontFamily}}          >
            {item.char}
          </span>
        );
      }
    }

    return output;
  };
  
  // פונקציית התנתקות מהמערכת
  const logout = () => {
    const shouldSave = confirm('האם לשמור את כל השינויים לפני התנתקות?');

    if (shouldSave) {
      // שמירה אוטומטית של כל המסמכים הפתוחים כרגע
      documents.forEach((doc, index) => {
        if (doc.textItems.length === 0) return; // אין טעם לשמור מסמך ריק
        const name = doc.name || `מסמך_${index + 1}`;
        localStorage.setItem(
          getFileKey(name),
          JSON.stringify(doc.textItems)
        );
      });

      setSavedFiles(getUserFiles());
      alert('כל הקבצים הלא ריקים נשמרו בהצלחה');
    }

    const newDoc = createDoc();

    // ניקוי מזהי המשתמש מהזיכרון המקומי
    localStorage.removeItem('activeUser');
    localStorage.removeItem('displayUser');

    // איפוס כל ה-States של האפליקציה למצב התחלתי
    setActiveUser('');
    setUsername('');
    setPassword('');
    setDocuments([newDoc]);
    setActiveDocId(newDoc.id);
    setSavedFiles([]);
    setSearchChar('');
    setReplaceChar('');
    setFocusField('main');
  };

  // --- תנאי רינדור: מסך כניסה (אם אין משתמש מחובר) ---
  if (!activeUser) {
    return (
      <div className="app-container">
        <h1>Visual Text Editor</h1>

        <section className="login-box">
          <h2>כניסת משתמש</h2>

          <input
            type="text"
            placeholder="שם משתמש"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={() => {
              const name = username.trim();
              const pass = password.trim();

              if (!name || !pass) {
                alert('יש להזין שם משתמש וסיסמה');
                return;
              }

              const userId = getUserId(name, pass);

              // שמירת המשתמש בזיכרון המקומי לצורך כניסה אוטומטית בעתיד
              localStorage.setItem('activeUser', userId);
              localStorage.setItem('displayUser', name);
              setActiveUser(userId);
              setUsername(name);
              setPassword('');
            }}
          >
            כניסה / יצירת משתמש
          </button>
        </section>
      </div>
    );
  }

  // --- רינדור הממשק הראשי (עבור משתמש מחובר) ---
  return (
    <div className="app-container">
      <h1>Visual Text Editor</h1>
      {/* אזור פרטי משתמש והתנתקות */}
      <div className="user-info">
        משתמש פעיל: {username}
        <button onClick={logout}>התנתקות</button>
      </div>
      
      {/* מידע על הקובץ הפעיל כרגע */}
      <div className="file-info">
        {activeDoc?.name ? `קובץ פעיל: ${activeDoc.name}` : 'קובץ חדש'}
      </div>
 
      {/* סרגל ניהול קבצים (חדש, מחיקה, שמירה, פתיחה) */}
      <section className="files-bar">
        <button onClick={createNewDocument}>New</button>
        <button onClick={deleteFile}>Delete File</button>
        <button onClick={() => saveFile(true)}>Save As</button>
        <button onClick={() => saveFile(false)} className="active-btn">Save</button>

        <select value="" onChange={(e) => openFile(e.target.value)}>
          <option value="" disabled>פתח קובץ שמור...</option>
          {savedFiles.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </section>

      {/* אזור תצוגת המסמכים (מרובה מסמכים) */}
      <section className="multi-display-area">
        {documents.map(doc => (
          <div
            key={doc.id}
            className={`text-box ${doc.id === activeDocId ? 'active-text-box' : ''}`}
            onClick={() => {
              setActiveDocId(doc.id);
              setFocusField('main');
            }}
          >
            <div className="text-box-header">
              <span>{doc.name || 'קובץ חדש'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // מונע מהקליק לעבור לתיבה ולהפוך אותה לפעילה
                  closeDocument(doc.id);
                }}
              >
                ✕
              </button>
            </div>

            <div className="text-box-body">
              {/* קריאה לפונקציית הרינדור שהופכת תווים ל-HTML */}
              {renderDocumentText(doc)}
            </div>
          </div>
        ))}
      </section>

      {/* פאנל העורך התחתון (כלי עריכה, מקלדת ועיצוב) */}
      <section className="bottom-editor">
        {/* פאנל שמאלי: כלי ניהול תוכן וחיפוש */}
        <div className="side-panel left-panel">
          <div className="panel-grid">
            <button onClick={undo}>Undo</button>
            <button onClick={deleteChar}>מחק תו</button>
            <button onClick={deleteWord}>מחק מילה</button>
            <button onClick={clearAll}>נקה הכל</button>
          </div>

          <div className="panel-grid search-grid">
            {/* שדות קלט לקריאה בלבד (הזנה רק דרך המקלדת הווירטואלית) */}
            <input
              readOnly
              placeholder="חפש תו"
              value={searchChar}
              onClick={() => setFocusField('search')}
              className={focusField === 'search' ? 'active-input' : ''}
            />
            <input
              readOnly
              placeholder="החלף תו"
              value={replaceChar}
              onClick={() => setFocusField('replace')}
              className={focusField === 'replace' ? 'active-input' : ''}
            />
            <button onClick={findChar}>מצא</button>
            <button onClick={replaceCharOnce}>החלף</button>
            <button onClick={replaceAllChars} className="full-width-btn">החלף הכל</button>
          </div>
        </div>

        {/* מרכז: המקלדת הווירטואלית */}
        <div className="keyboard-center">
          <Keyboard onKeyClick={handleKeyClick} />
        </div>

        {/* פאנל ימני: שליטה בעיצוב וניווט סמן */}
        <div className="side-panel right-panel">
          <div className="panel-group diagonal-group">
            <label>צבע:</label>
            <input
              type="color"
              value={currentStyle.color}
              onChange={(e) =>
                setCurrentStyle({ ...currentStyle, color: e.target.value })
              }
            />
            <label>גופן:</label>
            <select
              value={currentStyle.fontFamily}
              onChange={(e) =>
                setCurrentStyle({ ...currentStyle, fontFamily: e.target.value })
              }
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
            </select>
            <label>גודל:</label>
            <select
              value={currentStyle.fontSize}
              onChange={(e) =>
                setCurrentStyle({ ...currentStyle, fontSize: e.target.value })
              }
            >
              <option value="16px">קטן</option>
              <option value="24px">בינוני</option>
              <option value="40px">גדול</option>
            </select>

            <button onClick={applyStyleFromCursor}>עצב מכאן</button>
            <button onClick={applyStyleToAll}>עצב הכל</button>
            <button onClick={moveCursorLeft}>→</button>
            <button onClick={moveCursorRight}>←</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ייצוא ברירת מחדל של הרכיב לשימוש בשאר חלקי הפרויקט
export default App;