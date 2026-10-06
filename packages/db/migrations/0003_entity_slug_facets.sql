-- 图鉴需要两样实体现在没有的东西：
--   slug   —— 实体要有个人可读、可收藏的地址（/codex/qiqi），不能把 `genshin:character:qiqi` 塞进 URL。
--   facets —— 分类元数据（元素 / 职业 / 稀有度 / 阵营）。三款游戏的分类词表不一样，所以存成 JSON，
--             而不是给每个游戏加一组列。**只存分类，不存数值**——ADR-0009 要求数值追到游戏内文本，
--             社区数据集达不到那条线。
ALTER TABLE `entity` ADD COLUMN `slug` text;
ALTER TABLE `entity` ADD COLUMN `facets` text;

-- 已有行补 slug：导入时 id 就是 `<game>:<kind>:<slug>`，取第二段冒号之后的部分；
-- 没有第二段的（早期手工行）取第一段之后的部分。
UPDATE `entity`
SET `slug` = CASE
  WHEN instr(substr(`id`, instr(`id`, ':') + 1), ':') > 0
    THEN substr(substr(`id`, instr(`id`, ':') + 1), instr(substr(`id`, instr(`id`, ':') + 1), ':') + 1)
  ELSE substr(`id`, instr(`id`, ':') + 1)
END
WHERE `slug` IS NULL;

-- slug 在游戏内唯一：它是 URL 的键。手工新建的实体在补上 slug 之前允许为空。
CREATE UNIQUE INDEX IF NOT EXISTS `entity_game_slug_idx` ON `entity` (`game_id`, `slug`);
