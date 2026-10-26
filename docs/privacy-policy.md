---
title: Privacy Policy – Sc2Common
---

# プライバシーポリシー / Privacy Policy

**Sc2Common** Chrome 拡張機能 / Chrome extension

最終更新日 / Last updated: 2026-10-26

[English version below](#english)

---

## 日本語

この拡張機能（以下「本拡張機能」）は、ウェブページ上の生物の学名から一般名・分類・写真を調べて表示するものです。本拡張機能が扱う情報について、以下のとおり説明します。

### 1. 送信する情報
本拡張機能は、ユーザーが次の操作をしたときに限り、**調べる学名のテキスト**を下記の公開データベースに送信します。

- 学名を選択して右クリックメニューの「学名から一般名を調べる」を選んだとき
- ハイライト機能を使用中に、下線の付いた学名にマウスを乗せたとき

学名の形式（例：「Danio rerio」）に当てはまらないテキストは送信しません。

| 送信先 | 送信する内容 | 目的 |
|---|---|---|
| GBIF（api.gbif.org） | 学名、GBIF の分類 ID | 学名の照合、分類、一般名の取得 |
| Wikidata（query.wikidata.org, www.wikidata.org） | 学名、GBIF の分類 ID | 和名・英名、写真、Wikipedia リンクの取得 |
| Wikimedia Commons（commons.wikimedia.org） | 写真のファイル名 | 写真の表示、作者とライセンスの取得 |

通常のウェブ通信と同様に、これらのサービスには IP アドレスやブラウザの種類（User-Agent）が伝わります。これらの情報の扱いは各サービスのプライバシーポリシーに従います。

- GBIF: <https://www.gbif.org/terms/privacy-policy>
- Wikimedia Foundation: <https://foundation.wikimedia.org/wiki/Policy:Privacy_policy>

### 2. 送信・収集しない情報
本拡張機能は次の情報を送信・収集しません。

- 閲覧しているページの URL、タイトル、学名以外の本文
- 閲覧履歴
- 氏名、メールアドレスなどの個人情報
- Cookie、ログイン情報

ハイライト機能では、ページ内の斜体の学名を探す処理をすべてお使いのブラウザの中で行います。ページの内容を外部に送ることはありません。
写真は Referer（閲覧中のページの URL）を送らない設定で読み込みます。

### 3. 保存する情報
検索結果は、同じ学名を何度も問い合わせないように、ブラウザのメモリ上に一時的に保持します。ページの再読み込みや拡張機能の停止で消え、ディスクには保存しません。設定や履歴の保存もしていません。

### 4. 第三者への提供
本拡張機能の開発者は、ユーザーの情報を受け取りません。また、第三者への販売・提供は行いません。広告や解析ツール（アクセス解析など）も使用していません。

### 5. 外部リンク
結果のカードには Wikipedia、GBIF、Wikidata、Wikimedia Commons へのリンクがあります。リンク先のサイトでの情報の扱いは、各サイトのポリシーに従います。

### 6. 変更
本ポリシーを変更する場合は、このページを更新し、最終更新日を改めます。

### 7. お問い合わせ
ご質問・ご要望は GitHub の Issues へお寄せください：<https://github.com/piroyon/sc2cn/issues>

---

<a id="english"></a>

## English

This Chrome extension ("the extension") looks up common names, classification and photos for scientific names of organisms on web pages. This policy explains what information it handles.

### 1. Information sent
Only when you do one of the following, the extension sends **the text of the scientific name being looked up** to the public databases listed below:

- You select text and choose "Look up common name" (「学名から一般名を調べる」) from the right-click menu.
- While highlighting is on, you hover over an underlined scientific name.

Text that does not look like a scientific name (e.g. "Danio rerio") is not sent.

| Sent to | What is sent | Purpose |
|---|---|---|
| GBIF (api.gbif.org) | Scientific name, GBIF taxon IDs | Name matching, classification, common names |
| Wikidata (query.wikidata.org, www.wikidata.org) | Scientific name, GBIF taxon IDs | English/Japanese names, photo, Wikipedia links |
| Wikimedia Commons (commons.wikimedia.org) | Photo file name | Showing the photo, its author and license |

As with any web request, these services receive your IP address and browser type (User-Agent). They handle this according to their own privacy policies:

- GBIF: <https://www.gbif.org/terms/privacy-policy>
- Wikimedia Foundation: <https://foundation.wikimedia.org/wiki/Policy:Privacy_policy>

### 2. Information not sent or collected
The extension does not send or collect:

- The URL, title or any other text of the pages you visit
- Your browsing history
- Personal information such as your name or email address
- Cookies or login information

When highlighting, the search for italicized scientific names runs entirely inside your browser; page content is never sent anywhere.
Photos are loaded without a Referer, so the page you are viewing is not revealed.

### 3. Information stored
To avoid repeating the same lookup, results are kept temporarily in memory. They are discarded when the page is reloaded or the extension is stopped, and are never written to disk. No settings or history are stored.

### 4. Sharing with third parties
The developer of the extension does not receive any of your information, and does not sell or share it with anyone. The extension contains no ads and no analytics.

### 5. External links
Result cards link to Wikipedia, GBIF, Wikidata and Wikimedia Commons. Those sites handle information according to their own policies.

### 6. Changes
If this policy changes, this page will be updated along with the "Last updated" date.

### 7. Contact
Questions and requests are welcome on GitHub Issues: <https://github.com/piroyon/sc2cn/issues>
