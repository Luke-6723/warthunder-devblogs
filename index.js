const { default: axios } = require("axios");
const { writeFile } = require("fs/promises");
const puppeteer = require("puppeteer");
const warthunderLogo = 'https://raw.githubusercontent.com/Luke-6723/warthunder-devblogs/master/warthunder.png';
const embedColor = 0xE10000;
console.time('Warthunder News Fetcher');

/**
 * Get environment variables based on NODE_ENV
 * Webhook URL is discord url
 */
let webhookURL = null;
require('dotenv').config();
webhookURL = process.env.WEBHOOK_URL;

if (!webhookURL) throw Error('Missing webhook URL');

/**
 * Import stored updates if any.
 */
let storeUpdates = {};
try {
  storeUpdates = require('./warthunder.json');
} catch {
  console.log('Error importing stored updates. Leaving object empty...');
}

/**
 * Dev Blogs: https://warthunder.com/en/news/?tags=Development
 * Events: https://warthunder.com/en/news/?tags=Event 
 * Changelog: https://warthunder.com/en/game/changelog/
 */
const urls = {
  devblogs: 'https://warthunder.com/en/news/?tags=Development',
  events: 'https://warthunder.com/en/news/?tags=Event',
  changelogs: 'https://warthunder.com/en/game/changelog/'
};

const widgetSelector = '.showcase__item';

const updates = {
  devblogs: {},
  events: {},
  changelogs: {}
};

/**
 * @param {'devblogs' | 'events' | 'changelogs'} type 
 */
function handlePosts (type, page) {
  return new Promise(async (resolve, reject) => {
    const posts = (await page.$$(widgetSelector)).splice(0, 3);
    posts.forEach(async (p, index) => {
      // Create devblog id if it doesnt exist already
      if (!updates[type][index]) updates[type][index] = {};
      // Get link
      const linkElement = await p.$('.widget__link');
      updates[type][index].link = await (await linkElement.getProperty('href')).jsonValue();
      // Get poster image
      const posterElement = await p.$('.widget__poster img');
      updates[type][index].banner = await (await posterElement.getProperty('src')).jsonValue();
      // Get title
      const titleElement = await p.$('.widget__content .widget__title');
      updates[type][index].title = await (await titleElement.getProperty('textContent')).jsonValue();
      // Santitize title
      updates[type][index].title = updates[type][index].title.replace(/\\n/g, '').trim();
      // Get description
      const descElement = await p.$('.widget__content .widget__comment');
      updates[type][index].description = await (await descElement.getProperty('textContent')).jsonValue();
      // Santitize title
      updates[type][index].description = updates[type][index].description.replace(/\\n/g, '').trim();

      if (index === 2) {
        resolve();
      }
    });
  });
}

(async () => {
  // Start browser
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: '/usr/bin/chromium-browser'
  });
  // Load Devblogs
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0); 

  await page.setJavaScriptEnabled(true);
  await page.setViewport({
    width: 1200,
    height: 700,
    deviceScaleFactor: 1,
  });

  /**
   * Development Blogs
  */

  await page.goto(urls.devblogs);
  await page.waitForSelector(widgetSelector, {
    timeout: 5000
  });

  await handlePosts('devblogs', page);

  if (storeUpdates?.devblogs?.[0]?.title !== updates?.devblogs[0]?.title) {
    console.log('Update on DevBlogs');

    await axios.post(webhookURL, {
      embeds: [{
        author: {
          name: 'War Thunder News'
        },
        url: updates?.devblogs[0]?.link,
        title: `[Dev Blog] ${updates?.devblogs[0]?.title}`,
        description: `
${updates?.devblogs[0]?.description}

[Link to update](${updates?.devblogs[0]?.link})`,
        color: embedColor,
        thumbnail: {
          url: warthunderLogo
        },
        image: {
          url: updates?.devblogs[0]?.banner
        }
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
    * Changelogs
   */

  await page.goto(urls.changelogs);
  await page.waitForSelector(widgetSelector, {
    timeout: 5000
  });

  await handlePosts('changelogs', page);

  const embeds = [];
  // Major update check
  if (storeUpdates?.changelogs?.[0]?.title !== updates?.changelogs[0]?.title) {
    console.log('Update on Changelogs [Major Update]');
    embeds.push({
      author: {
        name: 'War Thunder News'
      },
      url: updates?.changelogs[0]?.link,
      title: `[Major] ${updates?.changelogs[0]?.title}`,
      description: `
${updates?.changelogs[0]?.description}

[Link to update](${updates?.changelogs[0]?.link})`,
      color: embedColor,
      thumbnail: {
        url: warthunderLogo
      },
      image: {
        url: updates?.changelogs[0]?.banner
      }
    });
  }

  if (storeUpdates?.changelogs?.[1]?.title !== updates?.changelogs[1]?.title) {
    console.log('Update on Changelogs [Minor Update]');

    embeds.push({
      author: {
        name: 'War Thunder News'
      },
      url: updates?.changelogs[1]?.link,
      title: `[Minor] ${updates?.changelogs[1]?.title}`,
      description: `
${updates?.changelogs[1]?.description}

[Link to update](${updates?.changelogs[1]?.link})`,
      color: embedColor,
      thumbnail: {
        url: warthunderLogo
      },
      image: {
        url: updates?.changelogs[1]?.banner
      }
    });
  }

  if (embeds.length > 0) {
    await axios.post(webhookURL, {
      embeds: embeds
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Events
   */

  await page.goto(urls.events);
  await page.waitForSelector(widgetSelector, {
    timeout: 5000
  });

  await handlePosts('events', page);

  if (storeUpdates?.events?.[0]?.title !== updates?.events[0]?.title) {
    console.log('Update on events');

    axios.post(webhookURL, {
      embeds: [{
        author: {
          name: 'War Thunder News'
        },
        url: updates?.events[0]?.link,
        title: `[Event] ${updates?.events[0]?.title}`,
        description: `
${updates?.events[0]?.description}

[Link to update](${updates?.events[0]?.link})`,
        color: embedColor,
        thumbnail: {
          url: warthunderLogo
        },
        image: {
          url: updates?.events[0]?.banner
        }
      }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Update json file and close browser
  writeFile('./warthunder.json', JSON.stringify(updates, null, 2)).then(_ => {
    browser.close();
    console.timeEnd('Warthunder News Fetcher');
    process.exit(0)
  });

})();
