/**
 * html-table
 * ver. 1.0.1
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

module.exports = class HtmlTable {
  constructor(headless) {
    this.url = 'https://supership.jp/';
    if (headless === false) {
      this.headless = false;
    } else {
      this.headless = true;
    }
    this.waitFor = 3000;
    this.click = [];
  }

  async init() {
    this.browser = await puppeteer.launch({ headless: this.headless, args: ['--lang=ja,en-US,en'] });
    this.page = await this.browser.newPage();
    this.page.setViewport({ width: 1920, height: 1080 });
  }

  async goto(url, selector) {
    console.log(`goto ${url}`);
    if (!url) {
      return;
    }
    if (url.startsWith('http')) {
      await this.page.goto(url, { waitUntil: 'networkidle0', timeout: 5000 });
    } else {
      let filepath = 'file://' + path.resolve(url);
      await this.page.goto(filepath, { waitUntil: 'networkidle0', timeout: 5000 });
    }
    await this._intercept();

    const title = await this.page.title();
    await this.createCsv(title, selector);
  }

  async _intercept() {
    await this.page.waitFor(this.waitFor);

    if (this.click.length > 0) {
      for (var i = 0; i < this.click.length; i++) {
        console.log(`click ${this.click[i]}`); CHA
        await this.page.click(this.click[i]);
      }
      await this.page.waitFor(this.waitFor);
    }
  }

  async createCsv(title, selector) {
    if (!selector) {
      selector = "table";
    }
    let data = await this.page.evaluate((selector) => {
      let table = document.querySelector(selector);
      if (!table) {
        return null;
      }
      let data_csv = "";
      for (var i = 0; i < table.rows.length; i++) {
        for (var j = 0; j < table.rows[i].cells.length; j++) {
          data_csv += table.rows[i].cells[j].innerText;
          if (j == table.rows[i].cells.length - 1) data_csv += "\n";
          else data_csv += ",";
        }
      }
      return data_csv;
    }, selector);
    if (!data) {
      console.log(`table is not found.`);
      return;
    }
    fs.writeFileSync(`${process.cwd()}/${title}.csv`, data);
    console.log(`Create: ${process.cwd()}/${title}.csv`);
  }

  async close() {
    await this.browser.close();
  }
}