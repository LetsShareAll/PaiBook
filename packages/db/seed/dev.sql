-- 开发用示例数据：用来验证"读取 → 渲染"这条链路，不是真实攻略内容。
-- 上线前用真实内容替换（或直接清空重建）。
-- 用法：./scripts/local-db.sh genshin honkaistarrail zenlesszonezero portal
INSERT OR REPLACE INTO game (id, title_zh, title_en, sort) VALUES
  ('genshin', '原神', 'Genshin Impact', 1),
  ('honkaistarrail', '崩坏：星穹铁道', 'Honkai: Star Rail', 2),
  ('zenlesszonezero', '绝区零', 'Zenless Zone Zero', 3);

INSERT OR REPLACE INTO version (id, game_id, label, sort_key) VALUES
  ('genshin:demo', 'genshin', '示例 1.0', 1),
  ('honkaistarrail:demo', 'honkaistarrail', '示例 1.0', 1),
  ('zenlesszonezero:demo', 'zenlesszonezero', '示例 1.0', 1);

INSERT OR REPLACE INTO entity (id, game_id, kind, name_zh, name_en) VALUES
  ('genshin:demo-char-a', 'genshin', 'character', '示例角色甲', 'Demo Character A'),
  ('genshin:demo-char-b', 'genshin', 'character', '示例角色乙', 'Demo Character B'),
  ('genshin:demo-enemy-a', 'genshin', 'enemy', '示例敌人', 'Demo Enemy'),
  ('honkaistarrail:demo-char-a', 'honkaistarrail', 'character', '示例角色·巡猎', 'Demo Character'),
  ('honkaistarrail:demo-enemy-a', 'honkaistarrail', 'enemy', '示例敌人·虚卒', 'Demo Enemy'),
  ('zenlesszonezero:demo-agent-a', 'zenlesszonezero', 'agent', '示例代理人·强攻', 'Demo Agent'),
  ('zenlesszonezero:demo-bangboo-a', 'zenlesszonezero', 'bangboo', '示例邦布', 'Demo Bangboo');

INSERT OR REPLACE INTO guide (id, game_id, slug, title, summary, body, status, version_id, published_at) VALUES
  (
    'genshin:demo-1',
    'genshin',
    'demo-team-building',
    '示例攻略：配队思路',
    '一条用于验证竖切的示例条目，说明摘要与实体标签如何展示。',
    '## 思路

先确定主输出，再补足生存与充能。

- 第一步：定主 C
- 第二步：配辅助',
    'published',
    'genshin:demo',
    '2026-10-01T00:00:00Z'
  ),
  (
    'genshin:demo-2',
    'genshin',
    'demo-material-route',
    '示例攻略：材料路线',
    '第二条示例条目，用来验证列表排序与版本标注。',
    '## 路线

按区域跑一圈即可。',
    'published',
    'genshin:demo',
    '2026-09-20T00:00:00Z'
  ),
  (
    'genshin:demo-draft',
    'genshin',
    'demo-draft',
    '示例草稿：不应出现在前台',
    '草稿只对作者可见。',
    '草稿正文。',
    'draft',
    'genshin:demo',
    NULL
  ),
  (
    'honkaistarrail:demo-1',
    'honkaistarrail',
    'demo-hsr-team',
    '示例攻略：星穹配队',
    '用来验证星铁站的深色主题与列表渲染。',
    '## 思路

先看命途，再补生存与增益。

- 第一步：定主 C 的命途
- 第二步：配同谐与存护',
    'published',
    'honkaistarrail:demo',
    '2026-10-02T00:00:00Z'
  ),
  (
    'zenlesszonezero:demo-1',
    'zenlesszonezero',
    'demo-zzz-team',
    '示例攻略：代理人搭配',
    '用来验证绝区零站的高对比主题与列表渲染。',
    '## 思路

强攻 + 击破 + 支援，注意连携技的触发顺序。',
    'published',
    'zenlesszonezero:demo',
    '2026-10-03T00:00:00Z'
  );

INSERT OR REPLACE INTO guide_entity (guide_id, entity_id) VALUES
  ('genshin:demo-1', 'genshin:demo-char-a'),
  ('genshin:demo-1', 'genshin:demo-char-b'),
  ('genshin:demo-2', 'genshin:demo-enemy-a'),
  ('honkaistarrail:demo-1', 'honkaistarrail:demo-char-a'),
  ('honkaistarrail:demo-1', 'honkaistarrail:demo-enemy-a'),
  ('zenlesszonezero:demo-1', 'zenlesszonezero:demo-agent-a'),
  ('zenlesszonezero:demo-1', 'zenlesszonezero:demo-bangboo-a');
