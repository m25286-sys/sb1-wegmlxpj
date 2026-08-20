# Food Ingredient Analysis App

Boltから書き出したExpo / React Nativeアプリです。GitHubにそのままアップできる構成です。

## ローカル起動

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` に以下を設定してください。

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Supabase

このリポジトリには以下が含まれています。

- `supabase/migrations/` : DB・RLS・Storage設定
- `supabase/functions/ocr-label/` : 食品ラベルOCR用Edge Function

Supabase CLIを使う場合:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_ID
npx supabase db push
npx supabase functions deploy ocr-label
npx supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

`OPENAI_API_KEY` はGitHubや `.env` に直接保存しないでください。

## Webビルド

```bash
npm run build:web
```

出力先は `dist/` です。

## GitHubへアップ

GitHubで空のリポジトリを作成し、このフォルダ内のファイル一式をアップロードしてください。

Gitを使う場合:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## 注意

- `.env` は `.gitignore` に含まれているためGitHubにはアップロードされません。
- SupabaseのService Role Keyはフロントエンドへ入れないでください。
- `OPENAI_API_KEY` はSupabase Edge Function Secretとして設定してください。
