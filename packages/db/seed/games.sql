-- 线上只需要这三行：guide.game_id 是外键，必须有对应的 game 行。
-- 实体与版本可以在写作台的「分类维护」里加；示例数据（seed/dev.sql）不要用于线上。
INSERT OR REPLACE INTO game (id, title_zh, title_en, sort) VALUES
  ('genshin', '原神', 'Genshin Impact', 1),
  ('honkaistarrail', '崩坏：星穹铁道', 'Honkai: Star Rail', 2),
  ('zenlesszonezero', '绝区零', 'Zenless Zone Zero', 3);
