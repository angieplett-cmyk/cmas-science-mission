// SETTINGS: Mrs. Plett edits this file (on GitHub: open the file, click the pencil, Commit).
window.SETTINGS = {
  // 1) Shared data: paste the Google Apps Script web app URL here (ends in /exec). Blank = this Chromebook only.
  SHEET_URL: "https://script.google.com/macros/s/AKfycbyzqlf18lAzGynqWnGt8hFjHHvpxN6JMfMTuLLJWB6MERcTUpbTB7fj8v2Hyj1SdAv-5Q/exec",
  // 2) Teacher PIN for this site's dashboard. PLACEHOLDER: change it before kids use the site.
  //    When SHEET_URL is set, the Google Sheet also checks its own TEACHER_PIN (a Script Property you set in Apps Script).
  TEACHER_PIN: "0000",
  // 3) Pre-assessment: one sitting, real-test rules (no hints, codes, doors, explanations, or 2nd tries).
  PRETEST_INCLUDE_MAP: true,          // true = 45 CMAS + 21 MAP items; false = 45 CMAS only
  // 4) Rushing detector
  RUSH: {
    WORDS_PER_SECOND: 4.5,  // minimum time = item words / this number (a careful 5th-grade pace is ~2-3 words/sec)
    MIN_SECONDS: 5,         // never less than this
    MAX_SECONDS: 25,        // cap for long items
    RAPID_CLICKS: 6,        // this many answer changes within RAPID_WINDOW_SEC = rapid-fire
    RAPID_WINDOW_SEC: 4,
    PAUSE_SECONDS: 5        // length of the "Slow down, Space Cadet" pause
  },
  // 5) Activity tracking (inside this page only; never records what keys are typed). Teacher-only flags.
  IDLE_SECONDS: 60,          // no mouse/keyboard/touch for this long = Idle
  LIVE_REFRESH_SECONDS: 15,  // Live View refresh + student status ping
  // 6) Pace flags for the TEACHER dashboard (data-based; kids never see these).
  PACE: {
    MIN_RESPONSES: 10,        // need this many answers on a question before using its class median
    FAST_RATIO: 0.25,         // "fast" = under 25% of that question's median time
    SLOW_RATIO: 3.0,          // "slow" = over 3x the median time
    FALLBACK_WORDS_PER_SEC: 6,// before enough data: conservative reading-length estimate (flags marked tentative)
    PATTERN_MIN_EVIDENCE: 3,  // a "Possible ..." pattern needs at least this many separate items
    PATTERN_MIN_SESSIONS: 2,  // ...spread over at least this many different days
    NO_PROGRESS_MINUTES: 4    // signed in this long with no answers = "Not working"
  },
  // 7) Checkpoints (same one-sitting test mode). The Fall Launch Check is the baseline.
  //    Dates are when each checkpoint opens for students (YYYY-MM-DD). You can also change them on the dashboard.
  CHECKPOINTS: [
    { id: "pre",    name: "Fall Launch Check (baseline)", opens: "2026-11-23" },
    { id: "winter", name: "Winter Checkpoint",            opens: "2027-01-19" },
    { id: "spring", name: "Spring Checkpoint",            opens: "2027-03-22" }
  ],
  // 8) CMAS ESTIMATE bands (percent correct on official CMAS items -> performance level).
  //    These are CLASSROOM ESTIMATE bands, NOT CDE cut scores. CDE sets levels from scale scores. Edit freely.
  CMAS_BANDS: [
    { min: 0,  label: "Did Not Yet Meet Expectations" },
    { min: 30, label: "Partially Met Expectations" },
    { min: 50, label: "Approached Expectations" },
    { min: 65, label: "Met Expectations" },
    { min: 85, label: "Exceeded Expectations" }
  ],
  // 9) NWEA MAP RIT scores are entered by the teacher. Goals are teacher-entered (no norms are built in).
  //    false = RIT scores show only on the teacher dashboard. true = a copy also shows on the student's My Data.
  //    (Student data is fetched by student id without a password, so keep false unless you accept that.)
  SHOW_RIT_TO_STUDENTS: false,
  GROUP_MAJORITY: 0.5,       // more than this share missed = "Whole-group lesson" instead of a small group
  DAILY_GOAL_MINUTES: 20,
  SEQUENTIAL_DAYS: true,     // practice Days unlock in order after the pre-assessment
  // Mastery points per answer (skill bar is 0-100)
  MASTERY: { FIRST_TRY: 25, WITH_HELP: 10, MISS: -15, PROFICIENT: 60, MASTERED: 90 },
  // My Standards groups: 'I've got it' = Proficient (MASTERY.PROFICIENT) or higher; 'Getting there' = practiced and at least this score; else 'Not yet'.
  STD_GETTING_THERE: 25
};
