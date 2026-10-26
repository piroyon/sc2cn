# Chrome ウェブストア 掲載情報（文案）

デベロッパーダッシュボードの各欄にそのまま貼り付けられる形にしてあります。
`【要確認】` の箇所は公開前に埋める・確認してください。

---

## ストアの掲載情報タブ

### 名前と概要（_locales から自動）
v1.5 から日英対応。ストアでは閲覧者の言語に合わせて自動で切り替わります。

| | 日本語（_locales/ja） | 英語（_locales/en、既定） |
|---|---|---|
| 名前 | 学名 → 一般名 (Scientific Name to Common Name) | Scientific Name to Common Name |
| 概要 | 学名から和名・英名・分類を調べます（GBIF / Wikidata） | Look up English and Japanese common names and classification for scientific names (GBIF / Wikidata) |

### カテゴリ
教育（Education）

### 言語
拡張機能が日英に対応したので、ダッシュボードで「日本語」と「英語」それぞれの掲載情報を入力できます。
既定の言語（default_locale）は英語です。日本語・英語以外の閲覧者には英語の掲載情報が表示されます。

### 説明（日本語）

```
論文やウェブページに出てくる学名（Danio rerio、Arabidopsis thaliana など）から、和名・英名・分類・写真をその場で調べられる拡張機能です。

■ 使い方
1. 右クリックで調べる
   学名を選択して右クリック →「学名から一般名を調べる」。和名・英名・分類・写真が表示されます。
   ブラウザが英語のときは、英名を大きく、分類をラテン語で表示します。

2. ページ内の学名をまとめてハイライト
   ツールバーのアイコンをクリック →「このページの学名をハイライト」。ページ内の斜体の学名に点線の下線が引かれ、マウスを乗せると和名などがポップアップで表示されます。
   ・「D. rerio」のような省略形も、ページ内の属名から補って調べます
   ・ボタンを押したときだけ動くので、普段のブラウジングの邪魔をしません

■ 表示される情報
・和名・英名（Wikidata、GBIF）
・界・門・綱・目・科の分類（和名つき）
・写真（Wikimedia Commons、作者とライセンスを表示）
・Wikipedia（日本語・英語）、GBIF、Wikidata へのリンク
・旧学名（シノニム）の場合は現在の学名を、つづりの間違いは候補を表示します

■ こんな方に
・英語の論文を読む生物系の学生・研究者
・海外の図鑑やデータベースを見るバードウォッチャー、釣り人、園芸・昆虫愛好家
・科学系の翻訳者・ライター

■ データについて
学名の検索には GBIF（地球規模生物多様性情報機構）と Wikidata の公開データを利用しています。データベースに載っていない生物や、和名が登録されていない生物もあります。

■ プライバシー
調べる学名だけを GBIF と Wikimedia（Wikidata / Commons）に送信します。閲覧しているページの URL や閲覧履歴、個人情報は送信・保存しません。広告や解析ツールも使っていません。
詳しくはプライバシーポリシーをご覧ください。
```

### 説明（英語）

```
Look up common names, classification and photos for scientific names (Danio rerio, Arabidopsis thaliana, ...) right where you read them. Shows both English and Japanese common names.

HOW TO USE
1. Right-click
   Select a scientific name, right-click and choose "Look up common name". A card shows the common names, classification and a photo.

2. Highlight names on the page
   Click the toolbar icon and press the highlight button. Italicized scientific names on the page get a dotted underline; hover over one to see its common names.
   - Abbreviated names like "D. rerio" are resolved from the genus used earlier on the page.
   - It only runs when you press the button, so it never gets in the way of normal browsing.

WHAT YOU GET
- English and Japanese common names (Wikidata, GBIF)
- Kingdom, phylum, class, order and family
- A photo from Wikimedia Commons, with author and license
- Links to Wikipedia (English / Japanese), GBIF and Wikidata
- Synonyms point to the currently accepted name; misspellings are matched to the closest name

DATA
Names are looked up in the open data of GBIF (Global Biodiversity Information Facility) and Wikidata. Some organisms, especially less well-known ones, may have no common name recorded.

PRIVACY
Only the scientific name being looked up is sent to GBIF and Wikimedia (Wikidata / Commons). The extension does not send or store the pages you visit, your browsing history or any personal information, and contains no ads or analytics.
```

### スクリーンショット・画像
- 日本語の掲載情報：store/images/screenshot-1〜4.png（1280×800）
- 英語の掲載情報：store/images/en/screenshot-1〜4.png（1280×800）
- プロモーション タイル（共通）：store/images/promo-small-440x280.png
- マーキー（任意・共通）：store/images/promo-marquee-1400x560.png

---

## プライバシー タブ

### 単一用途の説明（Single purpose）

```
ウェブページ上の生物の学名から、その一般名（和名・英名）・分類・写真を調べて表示します。
Looks up and displays the common names (English and Japanese), classification and photo for scientific names of organisms found on web pages.
```

### 権限が必要な理由

**activeTab**
```
ユーザーが右クリックメニューまたはツールバーのボタンを操作したときに限り、表示中のタブに結果のカードやハイライトを表示するために使用します。それ以外のときはページにアクセスしません。
Used only when the user chooses the context menu item or presses the toolbar button, to show the result card or highlight scientific names in the current tab. The extension does not access pages otherwise.
```

**contextMenus**
```
選択したテキストを右クリックしたときに「学名から一般名を調べる」メニューを表示するために使用します。
Adds the "Look up common name" item to the right-click menu for selected text.
```

**scripting**
```
ユーザーの操作（右クリックメニュー、ツールバーのボタン）があったときに、拡張機能に同梱したスクリプト（content.js）を現在のタブに挿入し、結果のカードやハイライトを表示するために使用します。外部のコードは読み込みません。
Injects the extension's own bundled script (content.js) into the current tab after a user action (context menu or toolbar button) to show the result card and highlights. No remote code is loaded.
```

**ホスト権限（api.gbif.org, query.wikidata.org, www.wikidata.org, commons.wikimedia.org）**
```
学名の検索に使う公開データベースへの問い合わせに使用します。
・api.gbif.org：学名の照合、分類、一般名の取得
・query.wikidata.org / www.wikidata.org：和名・英名、写真、Wikipedia へのリンクの取得
・commons.wikimedia.org：写真の作者とライセンスの取得
これ以外のサイトへのアクセス権限は要求していません。
Used to query the public databases the names are looked up in:
- api.gbif.org: name matching, classification and common names
- query.wikidata.org / www.wikidata.org: English/Japanese names, photos and Wikipedia links
- commons.wikimedia.org: photo author and license
No other host permissions are requested.
```

### リモートコードの使用
「いいえ、リモートコードを使用していません」を選択。
（すべての JavaScript は拡張機能のパッケージに含まれています。外部から受け取るのは JSON データのみです）

### データの使用（チェックする項目）
- [x] **ウェブサイトのコンテンツ（Website content）**
  — ユーザーが選択した、またはマウスを乗せた学名のテキストを、検索のために GBIF / Wikimedia に送信するため
- それ以外（個人を特定できる情報、健康情報、金融情報、認証情報、個人的な通信、位置情報、ウェブ履歴、ユーザーのアクティビティ）はすべてチェックしない

### 開示に関する同意（3つともチェック）
- [x] 承認されている以外の用途で第三者にユーザーデータを販売、転送しません
- [x] アイテムの単一用途と関係のない目的でユーザーデータを使用、転送しません
- [x] 信用力の判断や融資の目的でユーザーデータを使用、転送しません

### プライバシー ポリシーの URL
https://piroyon.github.io/sc2cn/privacy-policy.html
（ソース：docs/privacy-policy.md。GitHub Pages で main ブランチの /docs を公開）
