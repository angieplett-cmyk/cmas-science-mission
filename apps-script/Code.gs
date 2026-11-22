/**
 * Mission: CMAS Science — shared data store (Google Apps Script web app).
 * Paste this whole file into Extensions > Apps Script of a Google Sheet in YOUR Drive (keep the Sheet unshared).
 * Then: Project Settings > Script Properties > add TEACHER_PIN = (your PIN).  Deploy > New deployment > Web app:
 *   Execute as: Me    Who has access: Anyone    -> copy the /exec URL into config/settings.js (SHEET_URL).
 * Students only ever ADD rows. Nothing here edits or deletes old rows, so first attempts can't be overwritten.
 */
var RCOLS = ['id','name','block','archived','added','updated','pretestFirst'];
var COLS = ['received','eventId','ts','sid','name','block','type','mode','ctx','item','n','correct','tries','hint','ms','rush','idleMs','offTab','lang','detail'];

function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); if (header) sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function pinOk_(pin) {
  var real = PropertiesService.getScriptProperties().getProperty('TEACHER_PIN');
  return real && String(pin) === String(real);
}
function clean_(v, max) { v = (v === undefined || v === null) ? '' : String(v); return v.slice(0, max || 200); }

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ok:false, error:'bad json'}); }
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (body.action === 'live' && body.status) {
      var cache = CacheService.getScriptCache();
      var s = body.status; s.seen = new Date().toISOString();
      var all = JSON.parse(cache.get('live') || '{}');
      all[clean_(s.sid, 60)] = s;
      cache.put('live', JSON.stringify(all), 21600);
      return json_({ok:true});
    }
    if (body.action === 'config') {
      if (!pinOk_(body.pin)) return json_({ok:false, error:'pin'});
      PropertiesService.getScriptProperties().setProperty('CONFIG', JSON.stringify(body.config || {}).slice(0, 9000));
      return json_({ok:true});
    }
    if (body.action === 'roster') {
      // Teacher saves the whole roster (add / edit / move / archive). Archived students keep all their data.
      if (!pinOk_(body.pin)) return json_({ok:false, error:'pin'});
      var rs = sheet_('Roster', RCOLS), list = body.students || [], now2 = new Date().toISOString();
      if (rs.getLastRow() > 1) rs.getRange(2, 1, rs.getLastRow() - 1, RCOLS.length).clearContent();
      var rrows = list.slice(0, 600).map(function (st) { return [clean_(st.id,60), clean_(st.name,60), clean_(st.block,3), st.archived ? 1 : 0, clean_(st.added,30), now2, st.pretestFirst === false ? 0 : 1]; });
      if (rrows.length) rs.getRange(2, 1, rrows.length, RCOLS.length).setValues(rrows);
      return json_({ok:true, saved: rrows.length});
    }
    if (body.action === 'log' && body.events && body.events.length) {
      var sh = sheet_('Events', COLS);
      var cache2 = CacheService.getScriptCache();
      var seen = JSON.parse(cache2.get('seenIds') || '[]');
      var seenSet = {}; seen.forEach(function (x) { seenSet[x] = 1; });
      var rows = [], now = new Date();
      body.events.slice(0, 500).forEach(function (ev) {
        if (!ev || !ev.eventId || seenSet[ev.eventId]) return;
        seenSet[ev.eventId] = 1; seen.push(ev.eventId);
        rows.push([now, clean_(ev.eventId,60), clean_(ev.ts,40), clean_(ev.sid,60), clean_(ev.name,60), clean_(ev.block,5), clean_(ev.type,20),
          clean_(ev.mode,20), clean_(ev.ctx,40), clean_(ev.item,20), clean_(ev.n,10), ev.correct === undefined ? '' : (ev.correct ? 1 : 0),
          clean_(ev.tries,3), ev.hint ? 1 : 0, clean_(ev.ms,10), ev.rush ? 1 : 0, clean_(ev.idleMs,10), clean_(ev.offTab,5), clean_(ev.lang,3), clean_(JSON.stringify(ev.detail || {}),2000)]);
      });
      if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, COLS.length).setValues(rows);
      cache2.put('seenIds', JSON.stringify(seen.slice(-4000)), 21600);
      return json_({ok:true, added: rows.length});
    }
    return json_({ok:false, error:'unknown action'});
  } finally { lock.releaseLock(); }
}

function rowsToEvents_(values) {
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i], ev = {};
    for (var c = 1; c < COLS.length; c++) ev[COLS[c]] = r[c];
    ev.correct = r[11] === '' ? undefined : r[11] == 1; ev.hint = r[13] == 1; ev.rush = r[15] == 1;
    try { ev.detail = JSON.parse(r[19] || '{}'); } catch (e) { ev.detail = {}; }
    out.push(ev);
  }
  return out;
}

function doGet(e) {
  var p = e.parameter || {};
  if (p.action === 'ping') return json_({ok:true});
  if (p.action === 'config') return json_({ok:true, config: JSON.parse(PropertiesService.getScriptProperties().getProperty('CONFIG') || 'null')});
  if (p.action === 'roster') {
    // Public: only active students' id, name, block (what the sign-in screen shows). Teacher (PIN): everyone.
    var rv = sheet_('Roster', RCOLS).getDataRange().getValues(), outR = [], full = pinOk_(p.pin);
    for (var i = 1; i < rv.length; i++) { var r = rv[i]; if (!r[0]) continue;
      var st = {id:String(r[0]), name:String(r[1]), block:Number(r[2]), archived:r[3] == 1};
      if (full) { st.added = String(r[4] || ''); st.pretestFirst = r[6] != 0; outR.push(st); } else if (!st.archived) outR.push(st); }
    return json_({ok:true, students: outR, empty: rv.length <= 1});
  }
  // NOTE: "sid" is a reserved URL parameter in Apps Script web apps, so the student id is sent as "stu".
  var stu = p.stu || p.sid;
  if (p.action === 'student' && stu) {
    var sh = sheet_('Events', COLS);
    // Teacher-only rows (sid TEACHER: RIT scores, goals, notes) are never returned here.
    var evs = rowsToEvents_(sh.getDataRange().getValues()).filter(function (x) { return x.sid === stu && x.sid !== 'TEACHER'; });
    return json_({ok:true, events: evs});
  }
  if (!pinOk_(p.pin)) return json_({ok:false, error:'pin'});
  if (p.action === 'all') {
    var sh2 = sheet_('Events', COLS);
    return json_({ok:true, events: rowsToEvents_(sh2.getDataRange().getValues())});
  }
  if (p.action === 'live') {
    return json_({ok:true, live: JSON.parse(CacheService.getScriptCache().get('live') || '{}')});
  }
  return json_({ok:false, error:'unknown action'});
}
