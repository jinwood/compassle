-- One row per idea per finished game. `play` groups the five rows of one game; it is random and not tied to a person.
CREATE TABLE IF NOT EXISTS scores (
  play  TEXT    NOT NULL,
  ts    INTEGER NOT NULL,  -- unix seconds
  day   INTEGER NOT NULL,  -- puzzle number
  total INTEGER NOT NULL,  -- game total out of 500
  idx   INTEGER NOT NULL,  -- 0-4, position in the day's set
  title TEXT    NOT NULL,
  pts   INTEGER NOT NULL   -- 0-100
);
CREATE INDEX IF NOT EXISTS scores_day ON scores (day);
CREATE INDEX IF NOT EXISTS scores_title ON scores (title);
