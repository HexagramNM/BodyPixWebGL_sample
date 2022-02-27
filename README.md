# BodyPixWebGL_sample
BodyPixで背景マスクをした映像をWebGLのテクスチャとして流すサンプル

[こんな感じ](https://hexagramnm.github.io/BodyPixWebGL_sample/index.html)に動きます。背景マスクされたWebカメラ映像が少し奥行き方向に傾いた状態で表示されます。

BodyPixで背景を消した映像を非表示キャンバスに送り、そのキャンバスからWebGLのテクスチャを作成することで、WebGL上にも表示しています。
[このQiita記事](https://qiita.com/HexagramNM/items/b967dfd3733ecee1a084)で解説をしております。

WebGLでの行列計算に[minMatrix.js](https://wgld.org/d/library/l001.html)を使用しております。minMatrix.jsはライセンスについて完全にフリーだそうなので、このリポジトリ内のコードは自由に使用していただいて大丈夫です。
