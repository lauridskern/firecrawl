import { EngineScrapeResult } from '..';
import { Meta } from '../..';
import { TimeoutError } from '../../error';
import { specialtyScrapeCheck } from '../utils/specialtyHandler';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

export async function scrapeURLWithFetch(
  meta: Meta
): Promise<EngineScrapeResult> {
  const timeout = 20000;

  // Configure proxy from environment variables
  const proxyServer = process.env.PROXY_SERVER;
  const proxyUsername = process.env.PROXY_USERNAME;
  const proxyPassword = process.env.PROXY_PASSWORD;

  const proxyUrl = `http://${proxyUsername}:${proxyPassword}@${proxyServer}`;
  const proxyAgent = new HttpsProxyAgent(proxyUrl);

  const response = await Promise.race([
    fetch(meta.url, {
      redirect: 'follow',
      headers: meta.options.headers,
      agent: proxyAgent,
    }),
    (async () => {
      await new Promise((resolve) => setTimeout(() => resolve(null), timeout));
      throw new TimeoutError(
        'Fetch was unable to scrape the page before timing out',
        { cause: { timeout } }
      );
    })(),
  ]);

  specialtyScrapeCheck(
    meta.logger.child({ method: 'scrapeURLWithFetch/specialtyScrapeCheck' }),
    Object.fromEntries(response.headers as any)
  );

  return {
    url: response.url,
    html: await response.text(),
    statusCode: response.status,
  };
}
