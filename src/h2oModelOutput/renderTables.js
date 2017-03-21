import renderPlot from './renderPlot';

export default function renderTables(_, _model) {
  let tableName;
  let output;
  let table;
  const tableNames = _.ls(_model);
  console.log('tableNames from renderTables', tableNames);
  for (let i = 0; i < tableNames.length; i++) {
    tableName = tableNames[i];
    if (!(tableName !== 'parameters')) {
      continue;
    }
    // Skip confusion matrix tables for multinomial models
    let output;
    if (_model !== 'undefined') {
      if (_model.output !== 'undefined') {
        if (_model.output.model_category === 'Multinomial') {
          output = true;
        }
      }
    }
    if (output) {
      if (tableName.indexOf('output - training_metrics - cm') === 0) {
        continue;
      } else if (tableName.indexOf('output - validation_metrics - cm') === 0) {
        continue;
      } else if (tableName.indexOf('output - cross_validation_metrics - cm') === 0) {
        continue;
      }
    }
    console.log('_ from renderTable', _);
    console.log('_model from renderTable', _model);
    console.log('tableName from renderTable', tableName);
    table = _.inspect(tableName, _model);

    console.log('table from renderTables', table);
    if (typeof table !== 'undefined') {
      let plotTitle = tableName;
      // if there is a table description, use it in the plot title
      if (typeof table.metadata !== 'undefined') {
        if (
          typeof table.metadata.description !== 'undefined' &&
          table.metadata.description.length > 0
        ) {
          plotTitle = `${tableName} (${table.metadata.description})`
        }
      }

      // set the gFunction
      let gFunction;
      if (table.indices.length > 1) {
        // lightning.js domain specific language
        gFunction = g => g(
          g.select(),
          g.from(table)
        );
      } else {
        // lightning.js domain specific language
         gFunction = g => g(
          g.select(0),
          g.from(table)
        )
      }

      const plotFunction = _.plot(gFunction);
      renderPlot(
        _,
        plotTitle,
        true,
        plotFunction
      );
    }
  }
}
