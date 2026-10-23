// ToDo・持ち物 の保存用プログラム（Google Apps Script）
// スプレッドシートの「拡張機能 > Apps Script」に貼り付けて使います。手順は SETUP.md を見てください。

const SECRET = 'ここに自分だけの合言葉を書く';   // アプリの「合言葉」と同じものにする
const SHEET = 'data';                              // データを入れるシート名（自動で作られます）

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(['path', 'json', 'updatedAt']); }
  return s;
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// 読み込み: 全データを返す
function doGet(e) {
  if (((e && e.parameter && e.parameter.key) || '') !== SECRET) return out_({ ok: false, error: 'bad_key' });
  const v = sheet_().getDataRange().getValues();
  const docs = {};
  for (let i = 1; i < v.length; i++) {
    if (!v[i][0]) continue;
    try { docs[v[i][0]] = { data: JSON.parse(v[i][1]) }; } catch (err) {}
  }
  return out_({ ok: true, docs: docs });
}

// 書き込み: {op:'set'|'delete', path:'items/xxxx', data:{...}, key:'合言葉'}
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.key !== SECRET) return out_({ ok: false, error: 'bad_key' });
    const s = sheet_();
    const last = s.getLastRow();
    const paths = last > 0 ? s.getRange(1, 1, last, 1).getValues() : [];
    let row = -1;
    for (let i = 1; i < paths.length; i++) { if (paths[i][0] === b.path) { row = i + 1; break; } }
    const now = new Date().toISOString();
    if (b.op === 'set') {
      const json = JSON.stringify(b.data);
      if (row > 0) s.getRange(row, 2, 1, 2).setValues([[json, now]]);
      else s.appendRow([b.path, json, now]);
    } else if (b.op === 'delete') {
      if (row > 0) s.deleteRow(row);
    }
    return out_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
