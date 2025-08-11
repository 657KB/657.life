---
title: 如何在 Flutter 中使用 QuickJS
published: 2023-11-02
description: 这篇文章介绍如何在 Flutter 中嵌入 QuickJS，包括如何编 Windows 和 Android 的运行库以及调用 QuickJs 运行 JavaScript 代码。
tags:
  - 编程
  - 计算机
  - Flutter
  - QuickJS
draft: false
lang: 'zh'
---

## 1. QuickJS 介绍

以下内容来自 [QuickJS 官方网站](https://bellard.org/quickjs/)。

QuickJS 是一个小型且可嵌入的JavaScript引擎。它支持 ES2020 规范，包括模块、异步生成器、代理和 BigInt。它还可选择性地支持数学扩展，如大十进制浮点数（BigDecimal）、大二进制浮点数（BigFloat）和运算符重载。

主要特点：

- 小巧且易于嵌入：只需几个 C 文件，没有外部依赖，对于一个简单的"Hello World"程序，x86 代码仅占 210 KiB；
- 快速的解释器，启动时间非常短：在桌面 PC 的单核心上，可以在大约 100 秒内运行 ECMAScript 测试套件的 75000 个测试。运行时实例的完整生命周期不到300微秒；
- 几乎完整支持 ES2020，包括模块、异步生成器和完整的附录B支持（用于遗留 Web 兼容性）；
- 当选择 ES2020 功能时，通过了接近 100％ 的 ECMAScript 测试套件测试。测试概要可在 Test262 报告中找到；
- 可以将 JavaScript 源代码编译为可执行文件，无需外部依赖；
- 使用引用计数进行垃圾回收（以减少内存使用并具有确定性行为），并带有循环删除功能；
- 数学扩展：BigDecimal、BigFloat、运算符重载、bigint 模式、math 模式；
- 具有基本的C库包装的小型内置标准库；
- 带有 JavaScript 实现的命令行解释器，带有上下文着色功能。

## 2. 了解 Dart 如何与 C 交互

Flutter 应用使用 Dart 开发，与 C 库交互，就得使用 `dart:ffi` 库。

`dart:ffi` 是专门用来与原生 C APIs 进行交互的库，**FFI** 代表 [foreign function interface](https://en.wikipedia.org/wiki/Foreign_function_interface)，即外部函数接口。该库的详细使用方式可以参阅 [官方文档](https://dart.dev/guides/libraries/c-interop)。

## 3. 为不同平台编译 QuickJS

Flutter 是跨平台的 UI 框架，要在不同平台使用 QuickJS，就需要为不同平台编译 QuickJS 的动态库。在 Windows 上，需要编译出 `.dll` 文件；在 Linux 和 Android 上，需要编译出 `.so` 文件。

编译不同平台的动态库是在 Flutter 中使用 QuickJS 的前期准备，这里主要介绍 Windows 和 Android 平台的编译步骤，编译 Linux 平台的动态库较简单所以省略。

### 3.1 为 Windows 平台编译 QuickJS 动态库

安装 [MYSYS2](https://www.msys2.org/)，编译 QuickJS 需要使用 MYSYS2 中的 MINGW。

安装完成后，运行 MYSYS2 中的 MINGW64（32 位运行 MINGW32），执行下面的命令安装编译所需工具链：

- 如果想要编译 64 位的 QuickJS，则安装 `x86_64-toolchain`：

```shell
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-make mingw-w64-x86_64-dlfcn
echo "#! /bin/sh" > /mingw64/bin/make
echo "\"mingw32-make\" \"\$@\"" >> /mingw64/bin/make
```

- 如果想要编译 32 位的 QuickJS，则安装 `i686-toolchain`：

```shell
pacman -S mingw-w64-i686-gcc mingw-w64-i686-make mingw-w64-i686-dlfcn
echo "#! /bin/sh" > /mingw32/bin/make
echo "\"mingw32-make\" \"\$@\"" >> /mingw32/bin/make
```

之后，继续使用 MYSYS2 打开的 MINGW 终端 clone QuickJS 的仓库：

```shell
git clone https://github.com/bellard/quickjs.git
```

切换到 QuickJS 仓库下，执行命令进行编译：

```shell
cd quickjs && make
```

运行完 `make` 命令后可以得到 `libquickjs.a`，此时再运行下面的命令即可得到 `libquickjs.dll`：

```shell
gcc -shared -o libquickjs.dll -static -s -Wl,--whole-archive libquickjs.a -lm -Wl,--no-whole-archive
```

### 3.2 为 Android 平台编译 QuickJS 动态库

Android 中使用 C/C++ 库需要编写一个 `CMakeLists.txt`：

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

这个 `CMakeLists.txt` 位于 Flutter 项目目录的 `android/src/main/cpp` 文件夹下，将 QuickJS 仓库放置于 Flutter 项目根目录，当 Flutter 编译 Android 平台应用时，会自动生成一个 `libquickjs.so` 并打包进安装包中。

关于 Android 平台集成 C/C++ 的详细介绍，请参阅[官方文档](https://developer.android.com/studio/projects/add-native-code?hl=zh-cn)。

## 4. 使用 ffigen 生成函数绑定

要调用 C/C++ 库中的函数，首先要在 Dart 侧进行“声明”，例如在 C 中有这样一个函数：

```c
int add(int a, int b) {
  return a + b;
}
```
那么在 Dart 中，我们就要有一个对应的函数声明，以供 Dart 代码调用这个函数：

```dart
import 'dart:ffi' as ffi;

final nativAddFunc = dynamicLibrary.lookup<ffi.NativeFunction<ffi.Int Function(ffi.Int, ffi.Int)>>('add');
```

> 这里的 dynamicLibrary.lookup 方法会通过函数名、返回类型、参数类型去查找对应的 C 函数。

在一个编程语言中对另一个编程语言的函数/变量进行声明，专业术语称之为 **语言绑定（language bindings）**。

那么问题来了，QuickJS 里有那么多函数，每一个都要在 Dart 侧声明一遍吗？

答案是确实如此，虽然我们大多数时候用不到所有函数和变量，但我们也要编写相当多的代码来使用 QuickJS。

然而 Dart 的官方开发人员非常给力，开发了 `ffigen` 这个库，**该库可以通过头文件自动生成 bindings**，大大提高了开发效率！

要生成 QuickJS 的 bindings 只需要：

i. 在 Flutter 项目中安装 `ffigen`：

```shell
flutter pub add ffigen
```

ii. 配置 `pubspecs.yaml`：

```yaml
...
# 增加下面的配置
ffigen:
  name: QuickJSBindings
  description: generate bindings for quick js
  output: lib/bindings.dart
  headers:
    entry-points:
      - quickjs/quickjs.h
      - quickjs/quickjs-libc.h
```

iii. 运行 `dart run ffigen`。

仅需三步，即可生成完整的 bindings（生成前记得将 QuickJS 的仓库放置于项目根目录）。

## 5. 使用 QuickJS

首先，打开 libquickjs 动态库：

```dart
final _lib = DynamicLibrary.open(libquickjs);
final _ = QuickJSBindings(_lib);
```

然后，创建 JSContext 和 JSRuntime：

```dart
final _runtime = _.JS_NewRuntime();
final _context = _.JS_NewContext(_runtime);
```

最后，调用 JS_Eval 方法执行 JS 代码：

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

以上便是使用 QuickJS 的方法，当然，还有一些细节问题需要处理，例如如何处理 Promise 类型的返回值，如何创建事件循环等等。但这篇文章主要介绍如何接入 QuickJS，所以在此不再详细展开。

## 参考链接

- [A Javascript engine to use with flutter. It uses quickjs on Android and JavascriptCore on IOS](https://github.com/abner/flutter_js)
- [A quickjs engine for flutter.](https://github.com/ekibun/flutter_qjs)
- [Build QuickJS on Windows](https://github.com/mengmo/QuickJS-Windows-Build)
- [如何在Windows编译和使用QuickJS](https://zhuanlan.zhihu.com/p/623863082)
