import fetchIntercept from 'fetch-intercept'

export interface FetchHttpClientConfig {
  baseURL?: string
  headers?: any
}

export interface FetchDelegate {
  fetch: typeof fetch
  fetchIntercept: typeof fetchIntercept
  config: FetchHttpClientConfig
  createAbortController: () => AbortController
}
