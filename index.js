const { default: puppeteer } = require("puppeteer");

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

(async () => {
  // Start browser
  const browser = await puppeteer.launch({
    headless: false
  })
  // Get pages
  const pages = await browser.pages()
  // Load Devblogs
  const page = pages[0]
  
  /**
   * Development Blogs
  */
 page.goto(urls.devblogs)
 await page.waitForSelector('.section')
})()