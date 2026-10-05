-- 同一游戏内、同类型的实体名不允许重复（否则过滤与搜索会出现"两个示例角色甲"）。
CREATE UNIQUE INDEX IF NOT EXISTS `entity_game_kind_name_idx` ON `entity` (`game_id`, `kind`, `name_zh`);
