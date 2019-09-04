#!/usr/bin/env node

/**
 * html-table
 * ver. 1.0.0
 */

 const program = require('commander');
 const HtmlTable = require('./lib/html-table');

 function collect(value, previous) {
   return previous.concat([value]);
 }

 program
   .version('1.0.0')
   .option('-s, --selector <string>', 'The target table\'s selector.')
   .option('-w, --wait-for <number>', 'The time that waits for loading.', parseInt, 3000)
   .option('-c, --click <query>', 'click selector', collect, [])
   .parse(process.argv);

if (!program.args[0]) {
  program.outputHelp();
  return;
}

(async () => {
  const htmlTable = new HtmlTable();
  await htmlTable.init();
  htmlTable.waitFor = program.waitFor;
  htmlTable.click = program.click;
  await htmlTable.goto(program.args[0], program.selector);
  await htmlTable.close();
})();