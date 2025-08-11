---
title: How to Use QuickJS in Flutter
published: 2023-11-02
description: This article explains how to embed QuickJS in Flutter, including how to build runtime libraries for Windows and Android, and how to execute JavaScript code via QuickJS.
tags:
  - Programming
  - Computer Science
  - Flutter
  - QuickJS
draft: false
lang: 'en'
---

> [!Note]
> This article was translated by ChatGPT.

## 1. Introduction to QuickJS

The following excerpt is from the [QuickJS official website](https://bellard.org/quickjs/).

QuickJS is a small and embeddable JavaScript engine. It supports the ES2020 specification, including modules, async generators, proxies, and BigInt. It optionally supports mathematical extensions such as BigDecimal, BigFloat, and operator overloading.

Key features:

* **Compact and embeddable** – only a few C source files, no external dependencies. For a simple “Hello World” program, the x86 code size is only 210 KiB.
* **Fast interpreter with extremely short startup time** – On a single desktop CPU core, it can run 75,000 ECMAScript tests from the Test262 suite in around 100 seconds. A runtime instance’s full lifecycle takes under 300 microseconds.
* **Near-complete ES2020 support** – includes modules, async generators, and full Annex B support for legacy web compatibility.
* **High compliance with Test262** – when ES2020 features are enabled, QuickJS passes close to 100% of the ECMAScript test suite.
* **AOT compilation** – JavaScript source can be compiled into standalone executables with no external dependencies.
* **Deterministic garbage collection** – uses reference counting with cycle removal to minimize memory usage.
* **Math extensions** – BigDecimal, BigFloat, operator overloading, bigint mode, math mode.
* **Small built-in standard library** – basic C library wrappers.
* **CLI interpreter** – implemented in JavaScript with syntax highlighting support.

## 2. How Dart Interacts with C

Flutter apps are written in Dart. To interface with C libraries, Dart uses the `dart:ffi` library.

`dart:ffi` is designed for calling native C APIs. **FFI** stands for [Foreign Function Interface](https://en.wikipedia.org/wiki/Foreign_function_interface). For detailed usage, refer to the [official documentation](https://dart.dev/guides/libraries/c-interop).

## 3. Building QuickJS for Different Platforms

Since Flutter is cross-platform, you need to compile QuickJS into platform-specific dynamic libraries.

* On Windows: build a `.dll` file.
* On Linux/Android: build a `.so` file.

This section focuses on building for **Windows** and **Android** (Linux builds are simpler and omitted).

### 3.1 Building QuickJS for Windows

1. Install [MSYS2](https://www.msys2.org/) – compilation requires the MINGW toolchain inside MSYS2.
2. Launch the **MINGW64** terminal (or MINGW32 for 32-bit) and install the toolchain:

* **For 64-bit builds**:

```shell
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-make mingw-w64-x86_64-dlfcn
echo "#! /bin/sh" > /mingw64/bin/make
echo "\"mingw32-make\" \"\$@\"" >> /mingw64/bin/make
```

* **For 32-bit builds**:

```shell
pacman -S mingw-w64-i686-gcc mingw-w64-i686-make mingw-w64-i686-dlfcn
echo "#! /bin/sh" > /mingw32/bin/make
echo "\"mingw32-make\" \"\$@\"" >> /mingw32/bin/make
```

3. Clone the QuickJS repository:

```shell
git clone https://github.com/bellard/quickjs.git
```

4. Compile QuickJS:

```shell
cd quickjs && make
```

5. After `make` finishes, you’ll get `libquickjs.a`. Create the DLL:

```shell
gcc -shared -o libquickjs.dll -static -s -Wl,--whole-archive libquickjs.a -lm -Wl,--no-whole-archive
```

### 3.2 Building QuickJS for Android

For Android, you’ll need a `CMakeLists.txt` to compile the C code:

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

Place this file under `android/src/main/cpp` in your Flutter project, and put the QuickJS source in the project root.
When building for Android, Flutter will compile and package `libquickjs.so` automatically.

For details, see the [official guide on adding C/C++ code to Android](https://developer.android.com/studio/projects/add-native-code).

## 4. Generating Bindings with ffigen

To call C/C++ functions from Dart, you must first **declare** them in Dart.
For example, given a C function:

```c
int add(int a, int b) {
  return a + b;
}
```

You’d declare it in Dart as:

```dart
import 'dart:ffi' as ffi;

final nativeAddFunc =
  dynamicLibrary.lookup<ffi.NativeFunction<ffi.Int Function(ffi.Int, ffi.Int)>>('add');
```

> `dynamicLibrary.lookup` finds a C function by its name, return type, and parameter types.

Declaring foreign functions in another language is known as **language bindings**.

Manually declaring every QuickJS function is tedious. Fortunately, Dart provides the `ffigen` package, which **automatically generates bindings from header files**.

Steps to generate QuickJS bindings:

1. Install ffigen:

```shell
flutter pub add ffigen
```

2. Add configuration in `pubspec.yaml`:

```yaml
ffigen:
  name: QuickJSBindings
  description: generate bindings for quick js
  output: lib/bindings.dart
  headers:
    entry-points:
      - quickjs/quickjs.h
      - quickjs/quickjs-libc.h
```

3. Run:

```shell
dart run ffigen
```

## 5. Using QuickJS

1. Open the QuickJS dynamic library:

```dart
final _lib = DynamicLibrary.open(libquickjs);
final _ = QuickJSBindings(_lib);
```

2. Create a `JSRuntime` and `JSContext`:

```dart
final _runtime = _.JS_NewRuntime();
final _context = _.JS_NewContext(_runtime);
```

3. Execute JavaScript with `JS_Eval`:

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

That’s the basic usage. Handling promises, implementing event loops, and other advanced topics are beyond the scope of this introductory article.

## References

* [A JavaScript engine for Flutter using QuickJS on Android and JavaScriptCore on iOS](https://github.com/abner/flutter_js)
* [A QuickJS engine for Flutter](https://github.com/ekibun/flutter_qjs)
* [Build QuickJS on Windows](https://github.com/mengmo/QuickJS-Windows-Build)
* [How to compile and use QuickJS on Windows (Chinese)](https://zhuanlan.zhihu.com/p/623863082)
