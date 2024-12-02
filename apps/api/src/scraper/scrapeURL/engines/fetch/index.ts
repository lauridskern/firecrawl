import { EngineScrapeResult } from '..';
import { Meta } from '../..';
import { TimeoutError } from '../../error';
import { specialtyScrapeCheck } from '../utils/specialtyHandler';
import axios from 'axios';

export async function scrapeURLWithFetch(
  meta: Meta
): Promise<EngineScrapeResult> {
  const timeout = 20000;

  try {
    const response = await axios({
      method: 'get',
      url: meta.url,
      headers: meta.options.headers,
      timeout,
      proxy: {
        host: 'gw.dataimpulse.com',
        port: 823,
        auth: {
          username: 'b10bffb8a44bcba3bfb1__cr.nl,be,at,de',
          password: '9465fa2ce4dd6d2d',
        },
      },
      maxRedirects: 5,
    });

    specialtyScrapeCheck(
      meta.logger.child({ method: 'scrapeURLWithFetch/specialtyScrapeCheck' }),
      Object.fromEntries(
        Object.entries(response.headers).map(([key, value]) => [
          key,
          String(value),
        ])
      )
    );

    return {
      url: response.request.res.responseUrl || meta.url,
      html: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError(
        'Fetch was unable to scrape the page before timing out',
        { cause: { timeout } }
      );
    }
    throw error;
  }
}
