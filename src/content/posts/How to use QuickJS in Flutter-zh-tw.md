---
title: 如何在 Flutter 中使用 QuickJS
published: 2023-11-02
description: 這篇文章介紹如何在 Flutter 中嵌入 QuickJS，包括如何編 Windows 和 Android 的運行庫以及調用 QuickJs 運行 JavaScript 代碼。
tags:
  - 編程
  - 計算機
  - Flutter
  - QuickJS
draft: false
lang: 'zh-tw'
---

## 1. QuickJS 介紹

以下內容來自 [QuickJS 官方網站](https://bellard.org/quickjs/)。

QuickJS 是一個小型且可嵌入的JavaScript引擎。它支持 ES2020 規範，包括模塊、異步生成器、代理和 BigInt。它還可選擇性地支持數學擴展，如大十進製浮點數（BigDecimal）、大二進製浮點數（BigFloat）和運算符重載。

主要特點：

- 小巧且易於嵌入：隻需幾個 C 文件，沒有外部依賴，對於一個簡單的"Hello World"程序，x86 代碼僅佔 210 KiB；
- 快速的解釋器，啟動時間非常短：在桌麵 PC 的單核心上，可以在大約 100 秒內運行 ECMAScript 測試套件的 75000 個測試。運行時實例的完整生命週期不到300微秒；
- 幾乎完整支持 ES2020，包括模塊、異步生成器和完整的附錄B支持（用於遺留 Web 兼容性）；
- 當選擇 ES2020 功能時，通過了接近 100％ 的 ECMAScript 測試套件測試。測試概要可在 Test262 報告中找到；
- 可以將 JavaScript 源代碼編譯爲可執行文件，無需外部依賴；
- 使用引用計數進行垃圾回收（以減少內存使用並具有確定性行爲），並帶有循環刪除功能；
- 數學擴展：BigDecimal、BigFloat、運算符重載、bigint 模式、math 模式；
- 具有基本的C庫包裝的小型內置標準庫；
- 帶有 JavaScript 實現的命令行解釋器，帶有上下文着色功能。

## 2. 了解 Dart 如何與 C 交互

Flutter 應用使用 Dart 開髮，與 C 庫交互，就得使用 `dart:ffi` 庫。

`dart:ffi` 是專門用來與原生 C APIs 進行交互的庫，**FFI** 代表 [foreign function interface](https://en.wikipedia.org/wiki/Foreign_function_interface)，即外部函數接口。該庫的詳細使用方式可以參閱 [官方文檔](https://dart.dev/guides/libraries/c-interop)。

## 3. 爲不同平颱編譯 QuickJS

Flutter 是跨平颱的 UI 框架，要在不同平颱使用 QuickJS，就需要爲不同平颱編譯 QuickJS 的動態庫。在 Windows 上，需要編譯出 `.dll` 文件；在 Linux 和 Android 上，需要編譯出 `.so` 文件。

編譯不同平颱的動態庫是在 Flutter 中使用 QuickJS 的前期準備，這裡主要介紹 Windows 和 Android 平颱的編譯步驟，編譯 Linux 平颱的動態庫較簡單所以省略。

### 3.1 爲 Windows 平颱編譯 QuickJS 動態庫

安裝 [MYSYS2](https://www.msys2.org/)，編譯 QuickJS 需要使用 MYSYS2 中的 MINGW。

安裝完成後，運行 MYSYS2 中的 MINGW64（32 位運行 MINGW32），執行下麵的命令安裝編譯所需工具鏈：

- 如果想要編譯 64 位的 QuickJS，則安裝 `x86_64-toolchain`：

```shell
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-make mingw-w64-x86_64-dlfcn
echo "#! /bin/sh" > /mingw64/bin/make
echo "\"mingw32-make\" \"\$@\"" >> /mingw64/bin/make
```

- 如果想要編譯 32 位的 QuickJS，則安裝 `i686-toolchain`：

```shell
pacman -S mingw-w64-i686-gcc mingw-w64-i686-make mingw-w64-i686-dlfcn
echo "#! /bin/sh" > /mingw32/bin/make
echo "\"mingw32-make\" \"\$@\"" >> /mingw32/bin/make
```

之後，繼續使用 MYSYS2 打開的 MINGW 終端 clone QuickJS 的倉庫：

```shell
git clone https://github.com/bellard/quickjs.git
```

切換到 QuickJS 倉庫下，執行命令進行編譯：

```shell
cd quickjs && make
```

運行完 `make` 命令後可以得到 `libquickjs.a`，此時再運行下麵的命令即可得到 `libquickjs.dll`：

```shell
gcc -shared -o libquickjs.dll -static -s -Wl,--whole-archive libquickjs.a -lm -Wl,--no-whole-archive
```

### 3.2 爲 Android 平颱編譯 QuickJS 動態庫

Android 中使用 C/C++ 庫需要編冩一個 `CMakeLists.txt`：

```cmake
cmake_minimum_required(VERSION 3.4.1)

project(quickjs LANGUAGES C)

include_directories(quickjs)

set(QUICK_JS_DIR ${CMAKE_CURRENT_LIST_DIR}/../../../../quickjs)

set(
  SOURCE_DIR
  ${QUICK_JS_DIR}/cutils.c
  ${QUICK_JS_DIR}/libbf.c
  ${QUICK_JS_DIR}/libregexp.c
  ${QUICK_JS_DIR}/libunicode.c
  ${QUICK_JS_DIR}/quickjs.c
  ${QUICK_JS_DIR}/quickjs-libc.c
)

file(STRINGS "${QUICK_JS_DIR}/VERSION" CONFIG_VERSION)

add_definitions(-DCONFIG_VERSION="${CONFIG_VERSION}")
add_definitions(-DCONFIG_BIGNUM)
add_definitions(-D_GNU_SOURCE)
add_definitions(-DCONFIG_CC="gcc")
add_definitions(-DCONFIG_PREFIX="/usr/local")

add_library(
  ${PROJECT_NAME}
  SHARED
  ${SOURCE_DIR}
)

target_include_directories(${PROJECT_NAME} PUBLIC .)
```

這個 `CMakeLists.txt` 位於 Flutter 項目目錄的 `android/src/main/cpp` 文件夾下，將 QuickJS 倉庫放置於 Flutter 項目根目錄，當 Flutter 編譯 Android 平颱應用時，會自動生成一個 `libquickjs.so` 並打包進安裝包中。

關於 Android 平颱集成 C/C++ 的詳細介紹，請參閱[官方文檔](https://developer.android.com/studio/projects/add-native-code?hl=zh-cn)。

## 4. 使用 ffigen 生成函數綁定

要調用 C/C++ 庫中的函數，首先要在 Dart 側進行“聲明”，例如在 C 中有這樣一個函數：

```c
int add(int a, int b) {
  return a + b;
}
```
那麼在 Dart 中，我們就要有一個對應的函數聲明，以供 Dart 代碼調用這個函數：

```dart
import ''dart:ffi'' as ffi;

final nativAddFunc = dynamicLibrary.lookup<ffi.NativeFunction<ffi.Int Function(ffi.Int, ffi.Int)>>(''add'');
```

> 這裡的 dynamicLibrary.lookup 方法會通過函數名、返回類型、參數類型去查找對應的 C 函數。

在一個編程語言中對另一個編程語言的函數/變量進行聲明，專業術語稱之爲 **語言綁定（language bindings）**。

那麼問題來了，QuickJS 裡有那麼多函數，每一個都要在 Dart 側聲明一遍嗎？

答案是確實如此，雖然我們大多數時候用不到所有函數和變量，但我們也要編冩相當多的代碼來使用 QuickJS。

然而 Dart 的官方開髮人員非常給力，開髮了 `ffigen` 這個庫，**該庫可以通過頭文件自動生成 bindings**，大大提高了開髮效率！

要生成 QuickJS 的 bindings 隻需要：

i. 在 Flutter 項目中安裝 `ffigen`：

```shell
flutter pub add ffigen
```

ii. 配置 `pubspecs.yaml`：

```yaml
...
# 增加下麵的配置
ffigen:
  name: QuickJSBindings
  description: generate bindings for quick js
  output: lib/bindings.dart
  headers:
    entry-points:
      - quickjs/quickjs.h
      - quickjs/quickjs-libc.h
```

iii. 運行 `dart run ffigen`。

僅需三步，即可生成完整的 bindings（生成前記得將 QuickJS 的倉庫放置於項目根目錄）。

## 5. 使用 QuickJS

首先，打開 libquickjs 動態庫：

```dart
final _lib = DynamicLibrary.open(libquickjs);
final _ = QuickJSBindings(_lib);
```

然後，創建 JSContext 和 JSRuntime：

```dart
final _runtime = _.JS_NewRuntime();
final _context = _.JS_NewContext(_runtime);
```

最後，調用 JS_Eval 方法執行 JS 代碼：

```dart
const flag = JS_EVAL_FLAG_STRICT;
final input = code.toNativeUtf8().cast<Char>();
final name = filename.toNativeUtf8().cast<Char>();
final inputLen = _getPtrCharLen(input);
final jsValue = _.JS_Eval(_context, input, inputLen, name, flag);
calloc.free(input);
calloc.free(name);
final result = _js2Dart(_context, jsValue);
_jsStdLoop(_context);
_jsFreeValue(_context, jsValue);
if (result is Exception) {
  throw ret;
}
```

以上便是使用 QuickJS 的方法，當然，還有一些細節問題需要處理，例如如何處理 Promise 類型的返回值，如何創建事件循環等等。但這篇文章主要介紹如何接入 QuickJS，所以在此不再詳細展開。

## 參考鏈接

- [A Javascript engine to use with flutter. It uses quickjs on Android and JavascriptCore on IOS](https://github.com/abner/flutter_js)
- [A quickjs engine for flutter.](https://github.com/ekibun/flutter_qjs)
- [Build QuickJS on Windows](https://github.com/mengmo/QuickJS-Windows-Build)
- [如何在Windows編譯和使用QuickJS](https://zhuanlan.zhihu.com/p/623863082)
