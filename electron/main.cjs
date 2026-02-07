const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

// Storage directories
let storageBasePath;
let attachmentsPath;
let imagesPath;

let mainWindow;
let db;

// Database initialization
function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'htapp.db');
  
  // Initialize storage directories
  storageBasePath = path.join(userDataPath, 'storage');
  attachmentsPath = path.join(storageBasePath, 'attachments');
  imagesPath = path.join(storageBasePath, 'images');
  
  // Create storage directories if they don't exist
  [storageBasePath, attachmentsPath, imagesPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  console.log('Storage directories initialized:', { attachmentsPath, imagesPath });
  
  db = new Database(dbPath);
  
  // Create tables
  db.exec(`
    -- Admin settings
    CREATE TABLE IF NOT EXISTS admin_settings (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      pin_hash TEXT NOT NULL DEFAULT '1234',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- App settings
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      app_name TEXT NOT NULL DEFAULT 'HTApp',
      app_description TEXT DEFAULT 'O''quv platformasi',
      app_mission TEXT DEFAULT 'Zamonaviy ta''lim tizimi',
      app_logo_url TEXT,
      login_bg_image_url TEXT,
      login_bg_overlay_opacity REAL DEFAULT 0.7,
      available_classes TEXT DEFAULT '[]',
      available_grades TEXT DEFAULT '[1,2,3,4,5,6,7,8,9,10,11]',
      sidebar_font_size INTEGER DEFAULT 14,
      body_font_size INTEGER DEFAULT 16,
      heading_font_size INTEGER DEFAULT 32,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Grade classes
    CREATE TABLE IF NOT EXISTS grade_classes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Students
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      full_name TEXT NOT NULL,
      class_name TEXT,
      grade INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_active_at TEXT DEFAULT (datetime('now'))
    );

    -- Instructors
    CREATE TABLE IF NOT EXISTS instructors (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      full_name TEXT NOT NULL,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      subject TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      assigned_classes TEXT DEFAULT '[]',
      assigned_grades TEXT DEFAULT '[]',
      can_view_statistics INTEGER DEFAULT 1,
      can_add_lessons INTEGER DEFAULT 1,
      can_add_tests INTEGER DEFAULT 1,
      can_edit_grades INTEGER DEFAULT 0,
      can_view_all_students INTEGER DEFAULT 1,
      can_export_reports INTEGER DEFAULT 0,
      can_manage_own_students INTEGER DEFAULT 1,
      can_compare_with_others INTEGER DEFAULT 0,
      can_send_notifications INTEGER DEFAULT 0,
      can_create_homework INTEGER DEFAULT 1,
      can_grade_homework INTEGER DEFAULT 1,
      can_view_attendance INTEGER DEFAULT 1,
      can_manage_attendance INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Lessons
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      class_name TEXT,
      grade INTEGER,
      order_index INTEGER DEFAULT 0,
      attachments TEXT DEFAULT '[]',
      instructor_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (instructor_id) REFERENCES instructors(id)
    );

    -- Lesson progress
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      student_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      UNIQUE(student_id, lesson_id)
    );

    -- Tests
    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title TEXT NOT NULL,
      description TEXT,
      class_name TEXT,
      grade INTEGER,
      time_limit_minutes INTEGER,
      is_active INTEGER DEFAULT 1,
      question_count INTEGER DEFAULT 0,
      lesson_id TEXT,
      instructor_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      FOREIGN KEY (instructor_id) REFERENCES instructors(id)
    );

    -- Questions
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      test_id TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      points INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
    );

    -- Test results
    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      test_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT,
      student_class TEXT,
      student_grade INTEGER,
      score INTEGER DEFAULT 0,
      max_score INTEGER DEFAULT 0,
      percentage REAL DEFAULT 0,
      answers TEXT DEFAULT '{}',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (test_id) REFERENCES tests(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- Attendance
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      student_id TEXT NOT NULL,
      instructor_id TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT (date('now')),
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (instructor_id) REFERENCES instructors(id)
    );

    -- Homework
    CREATE TABLE IF NOT EXISTS homework (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title TEXT NOT NULL,
      description TEXT,
      class_name TEXT,
      grade INTEGER NOT NULL,
      due_date TEXT,
      is_active INTEGER DEFAULT 1,
      instructor_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (instructor_id) REFERENCES instructors(id)
    );

    -- Homework submissions
    CREATE TABLE IF NOT EXISTS homework_submissions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      homework_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      submission_text TEXT,
      grade INTEGER,
      feedback TEXT,
      graded_by TEXT,
      graded_at TEXT,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (homework_id) REFERENCES homework(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (graded_by) REFERENCES instructors(id)
    );

    -- Insert default app settings if not exists
    INSERT OR IGNORE INTO app_settings (id) VALUES ('default');
    
    -- Insert default admin settings if not exists
    INSERT OR IGNORE INTO admin_settings (id) VALUES ('default');
  `);

  // Insert default grade classes if empty
  const count = db.prepare('SELECT COUNT(*) as cnt FROM grade_classes').get();
  if (count.cnt === 0) {
    const insertClass = db.prepare('INSERT INTO grade_classes (id, name, display_order, is_active) VALUES (?, ?, ?, 1)');
    for (let i = 1; i <= 11; i++) {
      insertClass.run(`g${i}`, `${i}-sinf`, i);
    }
  }

  console.log('Database initialized at:', dbPath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    title: 'HTApp - O\'quv Platformasi',
    autoHideMenuBar: true
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    // Production - load from dist folder with file:// protocol
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for database operations
function setupIpcHandlers() {
  // Generic query handler
  ipcMain.handle('db:query', (event, { sql, params = [] }) => {
    try {
      const stmt = db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return { data: stmt.all(...params), error: null };
      } else {
        const result = stmt.run(...params);
        return { data: result, error: null };
      }
    } catch (error) {
      console.error('Database error:', error);
      return { data: null, error: error.message };
    }
  });

  // Get single record
  ipcMain.handle('db:get', (event, { sql, params = [] }) => {
    try {
      const stmt = db.prepare(sql);
      return { data: stmt.get(...params), error: null };
    } catch (error) {
      console.error('Database error:', error);
      return { data: null, error: error.message };
    }
  });

  // Insert and return the inserted row
  ipcMain.handle('db:insert', (event, { table, data }) => {
    try {
      const id = data.id || generateUUID();
      const dataWithId = { ...data };
      if (!data.id) {
        dataWithId.id = id;
      }
      
      const columns = Object.keys(dataWithId);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => dataWithId[col]);
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      db.prepare(sql).run(...values);
      
      // Return the inserted row
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      return { data: row, error: null };
    } catch (error) {
      console.error('Insert error:', error);
      return { data: null, error: error.message };
    }
  });

  // Update record
  ipcMain.handle('db:update', (event, { table, data, where }) => {
    try {
      const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
      const whereClause = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      const params = [...Object.values(data), ...Object.values(where)];
      
      db.prepare(sql).run(...params);
      
      // Return updated row
      const row = db.prepare(`SELECT * FROM ${table} WHERE ${whereClause}`).get(...Object.values(where));
      return { data: row, error: null };
    } catch (error) {
      console.error('Update error:', error);
      return { data: null, error: error.message };
    }
  });

  // Delete record
  ipcMain.handle('db:delete', (event, { table, where }) => {
    try {
      const whereClause = Object.keys(where).map(k => `${k} = ?`).join(' AND ');
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
      db.prepare(sql).run(...Object.values(where));
      return { data: true, error: null };
    } catch (error) {
      console.error('Delete error:', error);
      return { data: null, error: error.message };
    }
  });

  // ============ FILE STORAGE HANDLERS ============
  
  // Save file to local storage
  ipcMain.handle('storage:saveFile', async (event, { bucket, fileName, base64Data, contentType }) => {
    try {
      // Determine target directory based on bucket
      let targetDir;
      if (bucket === 'lesson-attachments' || bucket === 'attachments') {
        targetDir = attachmentsPath;
      } else if (bucket === 'app-assets' || bucket === 'images') {
        targetDir = imagesPath;
      } else {
        targetDir = path.join(storageBasePath, bucket);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }
      
      // Generate unique filename with hash to avoid collisions
      const ext = path.extname(fileName) || '';
      const baseName = path.basename(fileName, ext);
      const hash = crypto.createHash('md5').update(Date.now().toString() + fileName).digest('hex').substring(0, 8);
      const uniqueFileName = `${baseName}_${hash}${ext}`;
      const filePath = path.join(targetDir, uniqueFileName);
      
      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      // Return local file URL
      const localUrl = `local-file://${bucket}/${uniqueFileName}`;
      
      console.log('File saved:', { bucket, fileName: uniqueFileName, path: filePath });
      
      return { 
        data: { 
          path: localUrl,
          fullPath: filePath,
          fileName: uniqueFileName
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Storage save error:', error);
      return { data: null, error: error.message };
    }
  });

  // Read file from local storage
  ipcMain.handle('storage:readFile', async (event, { bucket, fileName }) => {
    try {
      let targetDir;
      if (bucket === 'lesson-attachments' || bucket === 'attachments') {
        targetDir = attachmentsPath;
      } else if (bucket === 'app-assets' || bucket === 'images') {
        targetDir = imagesPath;
      } else {
        targetDir = path.join(storageBasePath, bucket);
      }
      
      const filePath = path.join(targetDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        return { data: null, error: 'File not found' };
      }
      
      const buffer = fs.readFileSync(filePath);
      const base64Data = buffer.toString('base64');
      
      // Determine content type from extension
      const ext = path.extname(fileName).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json'
      };
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      return { 
        data: { 
          base64Data, 
          contentType,
          fileName,
          size: buffer.length
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Storage read error:', error);
      return { data: null, error: error.message };
    }
  });

  // Get file URL for displaying
  ipcMain.handle('storage:getFileUrl', async (event, { bucket, fileName }) => {
    try {
      let targetDir;
      if (bucket === 'lesson-attachments' || bucket === 'attachments') {
        targetDir = attachmentsPath;
      } else if (bucket === 'app-assets' || bucket === 'images') {
        targetDir = imagesPath;
      } else {
        targetDir = path.join(storageBasePath, bucket);
      }
      
      const filePath = path.join(targetDir, fileName);
      
      if (!fs.existsSync(filePath)) {
        return { data: null, error: 'File not found' };
      }
      
      // Return file:// URL for electron
      return { 
        data: { 
          url: `file://${filePath}`,
          exists: true
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Storage URL error:', error);
      return { data: null, error: error.message };
    }
  });

  // Delete file from local storage
  ipcMain.handle('storage:deleteFile', async (event, { bucket, fileName }) => {
    try {
      let targetDir;
      if (bucket === 'lesson-attachments' || bucket === 'attachments') {
        targetDir = attachmentsPath;
      } else if (bucket === 'app-assets' || bucket === 'images') {
        targetDir = imagesPath;
      } else {
        targetDir = path.join(storageBasePath, bucket);
      }
      
      const filePath = path.join(targetDir, fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('File deleted:', filePath);
      }
      
      return { data: true, error: null };
    } catch (error) {
      console.error('Storage delete error:', error);
      return { data: null, error: error.message };
    }
  });

  // List files in bucket
  ipcMain.handle('storage:listFiles', async (event, { bucket }) => {
    try {
      let targetDir;
      if (bucket === 'lesson-attachments' || bucket === 'attachments') {
        targetDir = attachmentsPath;
      } else if (bucket === 'app-assets' || bucket === 'images') {
        targetDir = imagesPath;
      } else {
        targetDir = path.join(storageBasePath, bucket);
      }
      
      if (!fs.existsSync(targetDir)) {
        return { data: [], error: null };
      }
      
      const files = fs.readdirSync(targetDir).map(fileName => {
        const filePath = path.join(targetDir, fileName);
        const stats = fs.statSync(filePath);
        return {
          name: fileName,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      });
      
      return { data: files, error: null };
    } catch (error) {
      console.error('Storage list error:', error);
      return { data: null, error: error.message };
    }
  });

  // Get storage path info
  ipcMain.handle('storage:getInfo', async () => {
    return {
      data: {
        basePath: storageBasePath,
        attachmentsPath,
        imagesPath
      },
      error: null
    };
  });
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

app.whenReady().then(() => {
  initDatabase();
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (db) {
    db.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
