-- FTS5 索引表：tokenize 用 unicode61（trigram 对 2 字中文查询无效）。
-- 中文由应用层切成 bigram 后写入 text 列，见 packages/db/src/search.ts。
CREATE VIRTUAL TABLE `guide_fts` USING fts5(guide_id UNINDEXED, text, tokenize='unicode61 remove_diacritics 2');
