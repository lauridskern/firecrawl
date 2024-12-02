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
        host: process.env.PROXY_SERVER?.split(':')[0] || '',
        port: parseInt(process.env.PROXY_SERVER?.split(':')[1] || '0'),
        auth: {
          username: process.env.PROXY_USERNAME || '',
          password: process.env.PROXY_PASSWORD || '',
        },
      },
      maxRedirects: 5,
    });

    specialtyScrapeCheck(
      meta.logger.child({ method: 'scrapeURLWithAxios/specialtyScrapeCheck' }),
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
        'Axios was unable to scrape the page before timing out',
        { cause: { timeout } }
      );
    }
    throw error;
  }
}
