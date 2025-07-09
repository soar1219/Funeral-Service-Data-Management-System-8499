# 香典管理システム（Funeral Donation Management System）

## 概要
香典管理システムは、葬儀における香典（ご香料）の受付・管理・帳票出力を効率化するためのWebアプリケーションです。PC・スマートフォン両対応で、OCR（文字認識）による自動入力や、PDF/CSV出力、印刷などの機能を備えています。

---

## 主な機能
- **OCRによる自動入力**
  - 香典袋や中袋の写真をアップロードまたはカメラ撮影し、Google Cloud Vision APIで文字認識
  - 氏名・会社名・役職・金額・住所などを自動抽出
- **データ管理**
  - 香典データの一覧表示・編集・削除
  - 連名や備考の管理も可能
- **帳票出力・印刷**
  - PDF（詳細・サマリー）やCSVでのエクスポート
  - ブラウザ印刷プレビュー
- **レスポンシブUI**
  - PC・スマホ・タブレットで快適に利用可能
- **Webカメラ対応**
  - スマホはカメラ直接起動、PCはファイル選択のみ（カメラ選択UIも実装済み）

---

## 技術スタック
- **フロントエンド**: React (Vite, JSX, hooks)
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context API
- **OCR連携**: Google Cloud Vision API
- **PDF/CSV出力**: jsPDF, jsPDF-AutoTable
- **アイコン**: react-icons

---

## ディレクトリ構成（主要ファイル）
```
src/
  main.jsx                # エントリーポイント
  App.jsx                 # ルーティング・全体レイアウト
  index.css, App.css      # グローバルCSS
  common/
    SafeIcon.jsx          # アイコンラッパー
  components/
    GoogleVisionSetup.jsx # Google Vision API設定用モーダル
    Navigation.jsx        # ナビゲーション
    SyncManager.jsx       # データ同期管理
  context/
    DataContext.jsx       # グローバル状態管理
  pages/
    Dashboard.jsx         # ダッシュボード
    DataManagement.jsx    # データ管理
    OCRCapture.jsx        # OCR画像取り込み・登録
    PrintReports.jsx      # 帳票出力・印刷・エクスポート
    Settings.jsx          # 各種設定
  services/
    googleVisionService.js # OCR用APIサービス
```

---

## セットアップ・起動方法
1. 依存パッケージのインストール
   ```sh
   npm install
   ```
2. 開発サーバー起動
   ```sh
   npm run dev
   ```
   ブラウザで http://localhost:5173 などにアクセス
3. 本番ビルド
   ```sh
   npm run build
   ```

---

## Google Cloud Vision APIの設定
- Google Cloud ConsoleでAPIキーを取得し、アプリ内の「API設定」から登録してください。
- APIキーが未設定の場合、OCR機能は利用できません。

---

## 注意事項
- 本システムはローカルストレージを利用しており、データはブラウザごとに保存されます。
- PDF/CSV出力はローカルにダウンロードされます。
- スマートフォンでは「カメラで撮影」ボタンが表示され、PCではファイル選択のみとなります。

---

## ライセンス
本システムは社内利用・業務効率化を目的としたサンプルです。商用利用や再配布の際はご相談ください。

---

## 開発・カスタマイズ
ご要望やカスタマイズのご相談は開発者までご連絡ください。
