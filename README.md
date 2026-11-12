# なぞりあそび

幼児が指やApple Pencilで、ひらがなを楽しくなぞるためのWebサイトです。

## ローカル起動

```bash
npm install
npm run dev -- --host 0.0.0.0
```

PCでは表示されたURLを開きます。iPad Safariでは、MacとiPadを同じWi-Fiに接続し、MacのIPアドレスを使って`http://<MacのIP>:5173`を開きます。

## ビルド確認

```bash
npm run build
```

TODOごとの確認項目は[LOCAL_VERIFICATION.md](LOCAL_VERIFICATION.md)を参照してください。

プライバシー方針は[PRIVACY.md](PRIVACY.md)を参照してください。現在のMVPでは、広告・アクセス解析・ユーザー登録・外部データ送信を行いません。

## GitHub Pages への公開

developブランチへのpushで、GitHub Actionsが自動的にビルド・公開します。

- URL: https://hosoden.github.io/Nazori/
- ワークフロー: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- Viteの`base`は`/Nazori/`に設定済み（[vite.config.ts](vite.config.ts)）

初回のみ、GitHubリポジトリの **Settings > Pages > Build and deployment > Source** を **GitHub Actions** に変更してください。手動で再実行する場合は、Actionsページの「Deploy to GitHub Pages」から「Run workflow」を実行します。
