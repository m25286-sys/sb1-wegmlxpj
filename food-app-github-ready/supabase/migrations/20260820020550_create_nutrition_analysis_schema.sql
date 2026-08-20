/*
# 食品成分分析アプリ 初期スキーマ

## 概要
食品パッケージの原材料・栄養成分を記録し、「摂りすぎに注意したい成分」を
公的機関等を参考にした基準に基づいて判定するためのテーブルを作成します。
ログイン機能は無いため、全データはアプリ利用者全体で共有される単一テナント
モデルとして扱います（他のToDoアプリの「ログイン無し」パターンと同様）。

## 新規テーブル

### `nutrient_info`（成分リファレンス・信頼できる情報源データベース）
AIが健康影響を自由に生成するのではなく、このテーブルに登録された説明文を
根拠として表示するための、アプリが管理する参照データです。
- `id` (uuid, PK)
- `key` (text, unique) — 内部識別キー（例: 'salt', 'sugars'）
- `category` (text) — 'judged'（量で注意度を判定する栄養成分）/ 'info'（参考表示のみ）/ 'additive'（原材料表示に出てくる添加物等）
- `display_name` (text) — 表示名（例: '食塩相当量'）
- `aliases` (text[]) — 原材料表示中の表記ゆれを検出するための別名リスト
- `unit` (text, nullable) — 単位（g, mg など）
- `low_max` (numeric, nullable) — この値以下なら🟢
- `medium_max` (numeric, nullable) — この値以下なら🟠、超えると🔴
- `default_level` (text, nullable) — 添加物など数値判定できない項目の既定レベル
- `why_text` (text) — なぜ注意するのかの説明
- `effect_text` (text) — 摂りすぎた場合に知られている影響の説明
- `source_text` (text) — 参考にした情報源の説明
- `sort_order` (integer) — 表示順

### `analyses`（分析履歴・お気に入り）
- `id` (uuid, PK)
- `product_name` (text)
- `photo_url` (text, nullable) — 撮影した商品パッケージ画像のURL
- `overall_level` (text) — 総合注意度 red/orange/green/gray
- `top_summary` (text) — 「結局、この商品は何に気をつければいいの？」の一言まとめ
- `key_points` (text) — 商品を選ぶときのポイント
- `ingredients_text` (text) — ユーザーが確認・入力した原材料表示
- `nutrition` (jsonb) — 入力された栄養成分値と各項目の判定結果
- `matched_additives` (jsonb) — 原材料表示から検出された注意成分の一覧
- `is_favorite` (boolean) — お気に入り登録
- `created_at` (timestamptz)

## セキュリティ
- 両テーブルでRLSを有効化。
- `nutrient_info` はアプリが管理する参照データのため、閲覧のみ許可（anon, authenticated）。
- `analyses` はログイン機能がない単一テナントアプリのため、閲覧・追加・更新・削除を
  anon, authenticated ロールに許可（USING (true) は意図的に公開データである場合のみ使用）。

## ストレージ
- `product-photos` バケットを新規作成し、公開読み取り・匿名アップロードを許可。
*/

CREATE TABLE IF NOT EXISTS nutrient_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('judged', 'info', 'additive')),
  display_name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  unit text,
  low_max numeric,
  medium_max numeric,
  default_level text CHECK (default_level IN ('red', 'orange', 'green', 'gray')),
  why_text text NOT NULL DEFAULT '',
  effect_text text NOT NULL DEFAULT '',
  source_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE nutrient_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_read_nutrient_info" ON nutrient_info;
CREATE POLICY "anyone_can_read_nutrient_info" ON nutrient_info FOR SELECT
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL DEFAULT '名称未設定の商品',
  photo_url text,
  overall_level text NOT NULL DEFAULT 'gray' CHECK (overall_level IN ('red', 'orange', 'green', 'gray')),
  top_summary text NOT NULL DEFAULT '',
  key_points text NOT NULL DEFAULT '',
  ingredients_text text NOT NULL DEFAULT '',
  nutrition jsonb NOT NULL DEFAULT '{}',
  matched_additives jsonb NOT NULL DEFAULT '[]',
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_analyses" ON analyses;
CREATE POLICY "anon_select_analyses" ON analyses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_analyses" ON analyses;
CREATE POLICY "anon_insert_analyses" ON analyses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_analyses" ON analyses;
CREATE POLICY "anon_update_analyses" ON analyses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_analyses" ON analyses;
CREATE POLICY "anon_delete_analyses" ON analyses FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON analyses (created_at DESC);
CREATE INDEX IF NOT EXISTS analyses_is_favorite_idx ON analyses (is_favorite);

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anyone_can_read_product_photos" ON storage.objects;
CREATE POLICY "anyone_can_read_product_photos" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'product-photos');

DROP POLICY IF EXISTS "anyone_can_upload_product_photos" ON storage.objects;
CREATE POLICY "anyone_can_upload_product_photos" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'product-photos');
