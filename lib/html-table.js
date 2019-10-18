/**
 * html-table
 * ver. 1.0.2
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

  async list(url) {
    console.log(`list ${url}`);
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

    var tables = await this.page.evaluate(() => {
      return [...document.querySelectorAll('table')].map((el) => {
        if (!(el instanceof Element))
            return;
        var path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            var selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
            } else {
                if (el.classList.length > 0) {
                  selector += "." + [...el.classList].join(".");
                }
                var sib = el, nth = 1;
                while (sib = sib.previousElementSibling) {
                    if (sib.nodeName.toLowerCase() == selector)
                        nth++;
                }
                if (nth != 1)
                    selector += ":nth-of-type("+nth+")";
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(" > ");
      });
    });
    if (tables.length > 0) {
      console.log('----------------------');
      tables.forEach((t) => console.log(t));
    } else {
      console.log("table is not found.");
    }
  }

  async goto(url, selector, pagination_selector) {
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
    if (pagination_selector) {
      await this._pagination(title, selector, pagination_selector);
    }
  }

  async _pagination(title, selector, pagination_selector) {
    var page = 1;
    while (true) {
      try {
        let hasSelector = await this.page.evaluate((pagination_selector) => {
          return document.querySelectorAll(pagination_selector).length > 0;
        }, pagination_selector);
        if (!hasSelector) {
          throw new Error(`Could not find selector element for pagination. \nselector:  ${pagination_selector}`);
        }
        await this.page.click(pagination_selector);
        await this.page.waitFor(this.waitFor);
        page++;
        await this.appendCsv(title, selector, page);
      } catch (error) {
        console.error(error);
        console.log("Finish!");
        break;
      }
    }
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
          data_csv += table.rows[i].cells[j].innerText.replace(/\n/g, '\\n');
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

  async appendCsv(title, selector, page) {
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
        if ([...table.rows[i].cells].filter((e) => e.tagName.toUpperCase !== 'TH').length === 0) {
          continue;
        }
        for (var j = 0; j < table.rows[i].cells.length; j++) {
          data_csv += table.rows[i].cells[j].innerText.replace(/\n/g, '\\n');
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
    fs.appendFileSync(`${process.cwd()}/${title}.csv`, data);
    console.log(`Append: Page.${page} ${process.cwd()}/${title}.csv`);
  }

  async close() {
    await this.browser.close();
  }
}