// NUMBERING CONFIG: the ONE place that sets Day and question numbers.
// Days 1-11 and #1-25 match the paper Student Workbook / Teacher Edition in
// /workspace/cmas_science_g5/build/days.py (snapshot Nov 22, 2026 ~12:45 PM MT; that build was still in progress,
// so re-run build/gen_config.py or edit here if the paper numbering changes).
// "page" = Student Workbook page (same page number in the Teacher Edition and teaching slides).
// Days 12-16 (#26-45) are official CMAS items NOT in the paper workbook yet (page: null).
// Strategy Missions (T1-T20) and MAP Practice (M1-M21) are numbered separately so #1-45 never shift.
window.NUMBERING = {
 "status": "Paper numbering snapshot 2026-11-22 (days.py: 11 days, pages 1-64, #1-25).",
 "days": [
  {
   "day": 1,
   "title": {
    "en": "Total Solar Eclipse: brightness and shadows",
    "es": "Eclipse solar total: brillo y sombras"
   },
   "cat": "ESS",
   "pages": "4–10",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T1"
    },
    {
     "type": "read",
     "stim": "eclipse",
     "pages": "5–7"
    },
    {
     "type": "q",
     "n": 1,
     "id": "S3Q6",
     "page": 8
    },
    {
     "type": "q",
     "n": 2,
     "id": "S3Q7",
     "page": 9
    },
    {
     "type": "strategy",
     "id": "T2"
    }
   ]
  },
  {
   "day": 2,
   "title": {
    "en": "Why M45 hides, and why the Sun is the closest star",
    "es": "Por qué M45 se esconde y por qué el Sol es la estrella más cercana"
   },
   "cat": "ESS",
   "pages": "11–14",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T3"
    },
    {
     "type": "q",
     "n": 3,
     "id": "S3Q8",
     "page": 12
    },
    {
     "type": "q",
     "n": 4,
     "id": "S3Q9",
     "page": 13
    }
   ]
  },
  {
   "day": 3,
   "title": {
    "en": "Star models, twelve hours later, and the atmosphere",
    "es": "Modelos de estrellas, doce horas después y la atmósfera"
   },
   "cat": "ESS",
   "pages": "15–19",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T4"
    },
    {
     "type": "q",
     "n": 5,
     "id": "S3Q10",
     "page": 16
    },
    {
     "type": "q",
     "n": 6,
     "id": "S3Q11",
     "page": 17
    },
    {
     "type": "q",
     "n": 7,
     "id": "S1Q14",
     "page": 18
    }
   ]
  },
  {
   "day": 4,
   "title": {
    "en": "Why is ocean water salty?",
    "es": "¿Por qué es salada el agua del océano?"
   },
   "cat": "ESS",
   "pages": "20–25",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T5"
    },
    {
     "type": "read",
     "stim": "rivers",
     "pages": "21–22"
    },
    {
     "type": "q",
     "n": 8,
     "id": "S2Q3",
     "page": 23
    },
    {
     "type": "q",
     "n": 9,
     "id": "S2Q4",
     "page": 24
    },
    {
     "type": "strategy",
     "id": "T6"
    }
   ]
  },
  {
   "day": 5,
   "title": {
    "en": "Salt, trash, and gravity in the rivers",
    "es": "Sal, basura y gravedad en los ríos"
   },
   "cat": "ESS",
   "pages": "26–30",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T7"
    },
    {
     "type": "q",
     "n": 10,
     "id": "S2Q5",
     "page": 27
    },
    {
     "type": "q",
     "n": 11,
     "id": "S2Q6",
     "page": 28
    },
    {
     "type": "q",
     "n": 12,
     "id": "S2Q7",
     "page": 29
    }
   ]
  },
  {
   "day": 6,
   "title": {
    "en": "Air is matter, and a recycling investigation",
    "es": "El aire es materia y una investigación de reciclaje"
   },
   "cat": "PS",
   "pages": "31–37",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T8"
    },
    {
     "type": "q",
     "n": 13,
     "id": "S1Q1",
     "page": 32
    },
    {
     "type": "read",
     "stim": "recycling",
     "pages": "33–36"
    },
    {
     "type": "strategy",
     "id": "T9"
    }
   ]
  },
  {
   "day": 7,
   "title": {
    "en": "Recycling: mass, new substances, and magnets",
    "es": "Reciclaje: masa, sustancias nuevas e imanes"
   },
   "cat": "PS",
   "pages": "38–42",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T10"
    },
    {
     "type": "q",
     "n": 14,
     "id": "S1Q3",
     "page": 39
    },
    {
     "type": "q",
     "n": 15,
     "id": "S1Q4",
     "page": 40
    },
    {
     "type": "q",
     "n": 16,
     "id": "S1Q5",
     "page": 41
    }
   ]
  },
  {
   "day": 8,
   "title": {
    "en": "Flakes, fabric, and a falling belt",
    "es": "Hojuelas, tela y una banda que cae"
   },
   "cat": "PS",
   "pages": "43–46",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T11"
    },
    {
     "type": "q",
     "n": 17,
     "id": "S1Q6",
     "page": 44
    },
    {
     "type": "q",
     "n": 18,
     "id": "S1Q7",
     "page": 45
    }
   ]
  },
  {
   "day": 9,
   "title": {
    "en": "Zebra energy and plants that grow without soil",
    "es": "La energía de la cebra y plantas que crecen sin suelo"
   },
   "cat": "LS",
   "pages": "47–54",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T12"
    },
    {
     "type": "q",
     "n": 19,
     "id": "S1Q2",
     "page": 48
    },
    {
     "type": "read",
     "stim": "epiphytes",
     "pages": "49–53"
    },
    {
     "type": "strategy",
     "id": "T13"
    }
   ]
  },
  {
   "day": 10,
   "title": {
    "en": "What the epiphyte model does — and does not — show",
    "es": "Lo que el modelo de epífitas muestra y lo que no"
   },
   "cat": "LS",
   "pages": "55–59",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T14"
    },
    {
     "type": "q",
     "n": 20,
     "id": "S1Q8",
     "page": 56
    },
    {
     "type": "q",
     "n": 21,
     "id": "S1Q9",
     "page": 57
    },
    {
     "type": "q",
     "n": 22,
     "id": "S1Q10",
     "page": 58
    }
   ]
  },
  {
   "day": 11,
   "title": {
    "en": "Why epiphytes live as they do",
    "es": "Por qué las epífitas viven como viven"
   },
   "cat": "LS",
   "pages": "60–64",
   "inWorkbook": true,
   "steps": [
    {
     "type": "strategy",
     "id": "T15"
    },
    {
     "type": "q",
     "n": 23,
     "id": "S1Q11",
     "page": 61
    },
    {
     "type": "q",
     "n": 24,
     "id": "S1Q12",
     "page": 62
    },
    {
     "type": "q",
     "n": 25,
     "id": "S1Q13",
     "page": 63
    }
   ]
  },
  {
   "day": 12,
   "title": {
    "en": "Plants, seeds, and energy",
    "es": "Plantas, semillas y energía"
   },
   "cat": "LS",
   "pages": null,
   "inWorkbook": false,
   "steps": [
    {
     "type": "strategy",
     "id": "T16"
    },
    {
     "type": "q",
     "n": 26,
     "id": "S2Q1",
     "page": null
    },
    {
     "type": "q",
     "n": 27,
     "id": "S2Q2",
     "page": null
    },
    {
     "type": "q",
     "n": 28,
     "id": "S2Q14",
     "page": null
    },
    {
     "type": "q",
     "n": 29,
     "id": "S3Q17",
     "page": null
    }
   ]
  },
  {
   "day": 13,
   "title": {
    "en": "Cleaning pennies: gravity, gas, and mass",
    "es": "Limpiar pennies: gravedad, gas y masa"
   },
   "cat": "PS",
   "pages": null,
   "inWorkbook": false,
   "steps": [
    {
     "type": "strategy",
     "id": "T17"
    },
    {
     "type": "read",
     "stim": "pennies",
     "pages": null
    },
    {
     "type": "q",
     "n": 30,
     "id": "S2Q8",
     "page": null
    },
    {
     "type": "q",
     "n": 31,
     "id": "S2Q9",
     "page": null
    },
    {
     "type": "q",
     "n": 32,
     "id": "S2Q10",
     "page": null
    },
    {
     "type": "q",
     "n": 33,
     "id": "S2Q11",
     "page": null
    }
   ]
  },
  {
   "day": 14,
   "title": {
    "en": "New substances, oil, and circuits",
    "es": "Sustancias nuevas, aceite y circuitos"
   },
   "cat": "PS",
   "pages": null,
   "inWorkbook": false,
   "steps": [
    {
     "type": "strategy",
     "id": "T18"
    },
    {
     "type": "q",
     "n": 34,
     "id": "S2Q12",
     "page": null
    },
    {
     "type": "q",
     "n": 35,
     "id": "S2Q13",
     "page": null
    },
    {
     "type": "q",
     "n": 36,
     "id": "S3Q1",
     "page": null
    }
   ]
  },
  {
   "day": 15,
   "title": {
    "en": "Science in a bottle",
    "es": "Ciencias en una botella"
   },
   "cat": "PS",
   "pages": null,
   "inWorkbook": false,
   "steps": [
    {
     "type": "strategy",
     "id": "T19"
    },
    {
     "type": "read",
     "stim": "bottle",
     "pages": null
    },
    {
     "type": "q",
     "n": 37,
     "id": "S3Q2",
     "page": null
    },
    {
     "type": "q",
     "n": 38,
     "id": "S3Q3",
     "page": null
    },
    {
     "type": "q",
     "n": 39,
     "id": "S3Q4",
     "page": null
    },
    {
     "type": "q",
     "n": 40,
     "id": "S3Q5",
     "page": null
    }
   ]
  },
  {
   "day": 16,
   "title": {
    "en": "Dog food: energy and matter",
    "es": "Alimento para perros: energía y materia"
   },
   "cat": "LS",
   "pages": null,
   "inWorkbook": false,
   "steps": [
    {
     "type": "strategy",
     "id": "T20"
    },
    {
     "type": "read",
     "stim": "dogfood",
     "pages": null
    },
    {
     "type": "q",
     "n": 41,
     "id": "S3Q12",
     "page": null
    },
    {
     "type": "q",
     "n": 42,
     "id": "S3Q13",
     "page": null
    },
    {
     "type": "q",
     "n": 43,
     "id": "S3Q14",
     "page": null
    },
    {
     "type": "q",
     "n": 44,
     "id": "S3Q15",
     "page": null
    },
    {
     "type": "q",
     "n": 45,
     "id": "S3Q16",
     "page": null
    }
   ]
  }
 ],
 "map": [
  {
   "set": 1,
   "title": {
    "en": "MAP Practice 1: Life Sciences",
    "es": "Práctica MAP 1: Ciencias de la vida"
   },
   "cat": "MAP-LS",
   "steps": [
    {
     "type": "q",
     "n": "M1",
     "id": "N1",
     "page": null
    },
    {
     "type": "q",
     "n": "M2",
     "id": "N2",
     "page": null
    },
    {
     "type": "q",
     "n": "M3",
     "id": "N3",
     "page": null
    },
    {
     "type": "q",
     "n": "M4",
     "id": "M1",
     "page": null
    },
    {
     "type": "q",
     "n": "M5",
     "id": "M2",
     "page": null
    },
    {
     "type": "q",
     "n": "M6",
     "id": "M3",
     "page": null
    },
    {
     "type": "q",
     "n": "M7",
     "id": "M4",
     "page": null
    }
   ]
  },
  {
   "set": 2,
   "title": {
    "en": "MAP Practice 2: Physical Sciences",
    "es": "Práctica MAP 2: Ciencias físicas"
   },
   "cat": "MAP-PS",
   "steps": [
    {
     "type": "q",
     "n": "M8",
     "id": "N4",
     "page": null
    },
    {
     "type": "q",
     "n": "M9",
     "id": "N5",
     "page": null
    },
    {
     "type": "q",
     "n": "M10",
     "id": "N6",
     "page": null
    },
    {
     "type": "q",
     "n": "M11",
     "id": "M5",
     "page": null
    },
    {
     "type": "q",
     "n": "M12",
     "id": "M6",
     "page": null
    },
    {
     "type": "q",
     "n": "M13",
     "id": "M7",
     "page": null
    },
    {
     "type": "q",
     "n": "M14",
     "id": "M8",
     "page": null
    }
   ]
  },
  {
   "set": 3,
   "title": {
    "en": "MAP Practice 3: Earth & Space Sciences",
    "es": "Práctica MAP 3: Ciencias de la Tierra y el espacio"
   },
   "cat": "MAP-ESS",
   "steps": [
    {
     "type": "q",
     "n": "M15",
     "id": "N7",
     "page": null
    },
    {
     "type": "q",
     "n": "M16",
     "id": "N8",
     "page": null
    },
    {
     "type": "q",
     "n": "M17",
     "id": "N9",
     "page": null
    },
    {
     "type": "q",
     "n": "M18",
     "id": "M9",
     "page": null
    },
    {
     "type": "q",
     "n": "M19",
     "id": "M10",
     "page": null
    },
    {
     "type": "q",
     "n": "M20",
     "id": "M11",
     "page": null
    },
    {
     "type": "q",
     "n": "M21",
     "id": "M12",
     "page": null
    }
   ]
  }
 ]
};
