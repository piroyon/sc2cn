# 学名 → 一般名 (Scientific Name to Common Name)

ウェブページ上の生物の学名から、和名・英名・分類・写真を調べる Chrome 拡張機能です。
A Chrome extension that looks up English and Japanese common names, classification and photos for scientific names on web pages.

## 使い方 / Usage

- **右クリック / Right-click**：学名を選択して右クリック →「学名から一般名を調べる」
  Select a scientific name, right-click and choose "Look up common name".
- **ハイライト / Highlight**：ツールバーのアイコン →「このページの学名をハイライト」。斜体の学名に下線が付き、マウスを乗せると結果が出ます。
  Click the toolbar icon and press the highlight button; hover over an underlined name to see the result.

## データ / Data

- [GBIF](https://www.gbif.org/)：学名の照合、分類、一般名 / name matching, classification, common names
- [Wikidata](https://www.wikidata.org/)：和名・英名、写真、Wikipedia リンク / names, photos, Wikipedia links
- [Wikimedia Commons](https://commons.wikimedia.org/)：写真と作者・ライセンス / photos with author and license

## プライバシー / Privacy

調べる学名だけを上記のサービスに送信します。詳しくは [プライバシーポリシー](https://piroyon.github.io/sc2cn/privacy-policy.html) をご覧ください。
Only the scientific name being looked up is sent to the services above. See the [privacy policy](https://piroyon.github.io/sc2cn/privacy-policy.html).

## 開発 / Development

`chrome://extensions` でデベロッパーモードをオンにし、「パッケージ化されていない拡張機能を読み込む」でこのフォルダを選びます。
Enable Developer mode at `chrome://extensions` and load this folder with "Load unpacked".

ストア提出用の zip には `docs/`、`store/`、`README.md` を含めません。
The store zip excludes `docs/`, `store/` and `README.md`:

```bash
zip -r -X sc2cn.zip manifest.json background.js lookup.js content.js popup.html popup.js images _locales -x '*.DS_Store'
```
