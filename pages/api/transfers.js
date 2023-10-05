
const HttpsAgent = require('https').Agent;
const cheerio = require('cheerio');
const { gotScraping } = require('got-scraping');
const { readLogsFromDatabase, writeLogToDatabase, isDuplicateLog } = require('../../app/utils/database.js');

export default async function handler(req, res) {

  try {
    const url = 'https://www.hltv.org/transfers';

    const defaultAgent = new HttpsAgent()
    // Make an HTTP GET request to the page
    const response = await gotScraping({ url, agent: { http: defaultAgent, https: defaultAgent } }).then(
      (res) => res.body
    );

    const $ = cheerio.load(response);
    let transferRows = $('.col-box-con .transfer-row');

    let transfers = [];

    for (const element of transferRows) {
      if (transfers.length >= 49) break;

      const transfer = {};
      const player = $(element).find('img.transfer-player-image').attr('alt');
      const team_from = $(element).find('.transfer-teams-container a:first-child').find('img').attr('alt');
      const team_to = $(element).find('.transfer-teams-container a:eq(1)').find('img').attr('alt');
      const date = $(element).find('.transfer-date').text().trim();
      const movement = $(element).find('.transfer-movement').text().trim();
      const data_unix = $(element).find('.transfer-date').attr('data-unix');

      const id = (player + team_from + team_to + data_unix + movement).replace(/'/g, '');

      transfer.id = id;
      transfer.player = player;
      transfer.teamFrom = team_from;
      transfer.teamTo = team_to;
      transfer.date = date;
      transfer.dateUnix = data_unix / 1;
      transfer.movement = movement;

      transfers.push(transfer);

    }

    transfers = Array.from(transfers).reverse();

    for (const transfer of transfers) {

      const existingLogs = await isDuplicateLog(transfer.id);

      if (!existingLogs) {

        await writeLogToDatabase(transfer.id);
        return res.json(transfer);
      }
    }

    // If no new transfers are found
    return res.json({ result: 'No new transfers' });
  } catch (error) {
    console.error('An error occurred while fetching the page:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}