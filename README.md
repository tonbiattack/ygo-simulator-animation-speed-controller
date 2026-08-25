# YGO Simulator Animation Speed Controller

**JunkBlade Simulator と DogmaBlade Simulator 専用の Chrome 拡張機能**です。`https://tsd0313.github.io/ygo-JunkBlade/dist/` および `https://tsd0313.github.io/ygo-DogmaBlade/dist/` 上で使われる CreateJS のトゥイーンを、**1x〜16x** の倍率で高速化します。動画の再生速度を変える拡張機能では対応できない、Canvas 内のカード移動・フェード・待機演出を対象にしています。

> 推奨設定は **4x** です。演出の確認を残したい場合は 2x、周回・検証用途には 8x を試してください。16x は画面遷移が急になり、操作や表示を見落とす可能性があります。

|項目|内容|
|---|---|
|対応サイト|[JunkBlade Simulator](https://tsd0313.github.io/ygo-JunkBlade/dist/)、[DogmaBlade Simulator](https://tsd0313.github.io/ygo-DogmaBlade/dist/)|
|対象処理|CreateJS/TweenJS による Canvas 内のアニメーションと待機|
|倍率|1x / 2x / 4x / 8x / 16x（スライダーで選択）|
|推奨ブラウザ|Chrome 95 以降|
|権限|アクティブなタブ、対象サイトのスクリプト実行、設定値のローカル保存のみ|

## 使い方

まず ZIP ファイルを任意の場所へ**展開**します。Chrome のアドレスバーに `chrome://extensions` と入力して拡張機能の管理画面を開き、画面右上の **デベロッパー モード**を有効にしてください。続いて **パッケージ化されていない拡張機能を読み込む**を押し、展開した `ygo-junkblade-speed-controller` フォルダを選択します。Chrome の公式手順でも、ローカル拡張機能はこの方法で読み込むよう案内されています。[1]

導入後、JunkBlade Simulator または DogmaBlade Simulator を開き、ツールバーの拡張機能アイコンから **YGO Simulator Animation Speed** を開いてください。倍率を選び、**「この倍率を適用」**を押します。以降に開始する操作と、新たに発生する演出がその倍率になります。動いている最中の CreateJS 演出がある場合にも、その時点で反映を試みます。

|用途|推奨倍率|補足|
|---|---:|---|
|通常プレイ|2x|演出やカードの移動を確認しやすい設定です。|
|周回・検証|4x|速度と視認性のバランスが良い標準設定です。|
|結果だけ早く見たい|8x|ボタンや選択肢の見落としに注意してください。|
|極端な短縮|16x|描画負荷や演出の連続性次第で操作しにくくなります。|

## 仕組み

両サイトはカード UI を Canvas 上に描画し、CreateJS の `Tween` を使って演出を進めています。実行時に各ページで `createjs.Tween` と `createjs.Ticker` を確認し、TweenJS の `timeScale` プロパティを 4 にしたテストでは、100ms の進行が通常約99ms相当から約399ms相当へ進みました。TweenJS の公式 API でも `timeScale` はトゥイーンの設定項目として定義されています。[2]

この拡張機能は、ページの JavaScript と同じ実行環境で `createjs.Tween.get()` をラップします。新しく生成されるトゥイーンへ選択倍率の `timeScale` を設定し、ページ側で管理中のトゥイーンにも同倍率を設定します。Chrome は `chrome.scripting.executeScript()` による実行時の関数注入と、ページ本体と共有する `MAIN` 実行環境を提供しているため、この方式でページ内の CreateJS オブジェクトを対象にできます。[3]

## 制約と注意事項

この拡張機能は、ゲームのロジック、乱数、カードの効果、セーブデータ、ネットワーク通信を変更しません。Canvas 内の CreateJS 演出の時間だけを倍率化します。そのため、CreateJS を通らない処理や、ブラウザ・端末の描画性能が原因の遅延そのものは高速化できません。

倍率を高くし過ぎると、複数の画面遷移や選択肢が短い間隔で表示されます。自動クリックは行わないため意図しないゲーム操作にはなりませんが、**8x 以上は結果確認向け**と考えてください。また、サイト側が将来 CreateJS の実装を大きく変更した場合には動かなくなる可能性があります。その場合は拡張機能を無効にするか、ページを再読み込みすれば通常状態に戻ります。

この ZIP は Chrome ウェブストア公開版ではなく、ローカル読み込み用です。ソースコードはすべて同梱され、外部へデータを送信する処理は含みません。

## 検証結果

|検証項目|JunkBlade|DogmaBlade|
|---|---|---|
|対象ページの実装|`#canv` 等の Canvas と `createjs.Tween` を確認|`#canv` 等の Canvas と `createjs.Tween` を確認|
|ティッカー設定|20fps を確認|20fps を確認|
|速度制御の根拠|TweenJS の `timeScale` を確認|TweenJS の `timeScale` を確認|
|倍率動作の簡易検証|100msで 1x は約99、4x は約399 に進行|100msで 1x は約99、4x は約399 に進行|
|新規トゥイーンへの適用|4x が自動設定されることを確認|同じCreateJS APIのため同方式を適用可能|

## 参考文献

[1] [Chrome Developers, “Hello World extension — Load an unpacked extension”](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world)

[2] [CreateJS, “TweenJS v1.0.0 API Documentation: AbstractTween”](https://createjs.com/docs/tweenjs/classes/AbstractTween.html)

[3] [Chrome Developers, “chrome.scripting API”](https://developer.chrome.com/docs/extensions/reference/api/scripting)
