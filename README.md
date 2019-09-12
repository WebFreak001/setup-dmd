# setup-dmd

Automatically downloads and installs [DMD](https://dlang.org/download.html) on Windows, Linux and OSX in a GitHub Action.

## Usage

Simply add setup-dmd with a given dmd-version to install dmd somewhere into your virtual environment and automatically add it to the PATH environment variable.

The installed path will be available as environment variable in D_HOME.

Valid DMD version string examples are:
- `2.088.0`
- `2.088.0-beta.2`
- `2.064` (this syntax only for <= 2.064)
- `master`

Use `master` to download the nightly build from the D homepage.

You can check for release numbers and pre-releases in http://downloads.dlang.org/pre-releases/2.x/

Basic:
```yaml
steps:
- uses: actions/checkout@v1
- uses: WebFreak001/setup-dmd@v1
  with:
    dmd-version: 2.088.0
- name: Test
  run: dub test
```

Matrix Testing:
```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        dmd_version: [2.088.0, 2.087.1, 2.087.0, 2.086.1, 2.085.1, 2.084.1, 2.083.1]
        os: [ubuntu-latest, windows-latest, macOS-latest]

    steps:
    - uses: actions/checkout@v1
    - name: Install DMD ${{ matrix.dmd_version }}
      uses: WebFreak001/setup-dmd@v1
      with:
        dmd-version: ${{ matrix.dmd_version }}
    - name: Test
      run: dub test
```
