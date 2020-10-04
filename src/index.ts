import { HttpClient } from '@manzano/http-client'

import { FetchHttpClient } from './FetchHttpClient'
import { FetchDelegate, FetchHttpClientConfig } from './FetchHttpClient-types'

export function createFetchHttpClient(
  config?: FetchHttpClientConfig
): HttpClient<FetchDelegate> {
  return new FetchHttpClient(config)
}
