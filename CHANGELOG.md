# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [0.2.80] - 2015-03-13
### Added
- Split frames using rapids.

### Fixed
- PUBDEV-785 Add getFrameSummary() The default frame display now uses /frame/id/summary to fetch summary information.

## [0.2.79] - 2015-04-02
### Fixed
- Remove CM inspection from binomial prediction output.

## [0.2.78] - 2015-03-25
### Added
- Display basic prediction outputs in predict-output

## [0.2.77] - 2015-03-25
### Added
- Add logloss to predictions outputs

## [0.2.76] - 2015-03-24
### Fixed
- Adapt model builder response handling to changes in the API (HEXDEV-121)
- Fix rendering failure in RDDs-output
- Remove horizontal scrollbars from parse input data preview

## [0.2.75] - 2015-03-13
### Fixed
- Fix failure while viewing CM for multinomial predictions (HEXDEV-204)


## [0.2.74] - 2015-03-13
### Fixed
- Send user-specified column types correctly through to /Parse
- Refresh parse preview when column types are changed

## [0.2.73] - 2015-03-12
### Fixed
- Fix failures while running parseFiles()

## [0.2.72] - 2015-03-12
- Auto-refresh data preview when parse setup input parameters are changed (PUBDEV-532)

## [0.2.71] - 2015-03-12
### Added
- Flow now displays a playbar at the bottom of the screen while running a flow.
- You can now stop/cancel a running flow.
- Quick toggle button to show/hide the sidebar.

### Changed
- Flows now stop running when an error occurs.

## [0.2.70] - 2015-03-11
### Added
- Enable DRF model outputs

## [0.2.69] - 2015-03-11
### Added
- Add New, Open toolbar buttons.
- Add ability to upload and parse datasets via browser (PUBDEV-299)

### Changed
- setupParse() and parseFiles() now expect an argument that explicitly indicates what needs to be parsed: either a { path: [] } or a { source_keys: [] }

### Fixed
- Fix autosizing of non-code cell inputs when opening saved flows.
- Fix display of object-valued model parameters (PUBDEV-505)

## [0.2.68] - 2015-03-11

### Added
- Integrate and display help content inside the help sidebar (PUBDEV-108)

## [0.2.67] - 2015-03-10

### Changed
- Display point layer for tree vs mse plots in GBM output (PUBDEV-504)

### Fixed
- Fix categorical axis label rendering when adequate space is available

## [0.2.66] - 2015-03-10

### Added
- Add 'Clear cell' and 'Run all cells' toolbar buttons
- Add 'Clear cell' and 'Clear all cells' commands

### Changed
- 'Run' button selects next cell after running

### Fixed
- Implement 'Clear cell' and 'Clear all cells'

## [0.2.65] - 2015-03-09

### Added
- Scan and load Flow packs (HEXDEV-190)

### Fixed
- Display GLM coefficients only if available (PUBDEV-466)

## [0.2.64] - 2015-03-09

### Added
- Add random chance line to RoC chart HEXDEV-168

### Changed
- Upgrade to Lightning 0.1.11

## [0.2.63] - 2015-03-05

### Changed
- parseRaw() is now parseFiles() - it now accepts filenames instead of keys.

### Removed
- Remove notion of "imported keys" from importFiles(), setupParse() and parseRaw()

## [0.2.62] - 2015-03-04

### Added
- Add network test PUBDEV-462

### Removed
- Remove notion of job tracking when called via parse() or buildModel() (PUBDEV-449)

## [0.2.61] - 2015-03-04

### Changed
- Prefill model and prediction destination keys.

## [0.2.60] - 2015-03-02

### Added
- Enable model summary and scoring history for DL AutoEncoder models

## [0.2.59] - 2015-03-02

### Added
- Add deleteAll() api
- Add deleteModels()
- Add deleteFrames()
- Add deleteModel() api
- Add deleteFrame() api
- Add ability to select and delete multiple models
- Add ability to select and delete multiple frames
- Add Delete action to model-output
- Add Delete action to frame-output
- Add output view for deleteFrame()/deleteFrames()
- Add start / end / run time to jobs-output
- Add ability to name predictions PUBDEV-233

### Changed
- Upgrade to Lightning 0.1.10

## [0.2.58] - 2015-02-25

### Added
- Reload notebook list when a notebook is uploaded
- Reload notebook list when current notebook is saved.
- Add ability to open notebooks from local disk (via File -> Open)
- Add ability to export (download) notebooks locally.
- Display growl notification when notebook is saved
- Confirm before overwriting notebooks with same names
- Hook up clips to node persistent storage
- Implement save/restore using node persistent storage api

### Changed
- Confirm before deleting notebooks
- Support multiline text on alert and confirm dialogs.
- Upgrade to Lightning 0.1.8
- Always add generated cells to the bottom of the flow

## [0.2.57] - 2015-02-18

### Added
- Add confirm/alert dialogs

### Changed
- Warn before loading notebooks

### Fixed
- Fix ip/port in cloud-status HEXDEV-159
