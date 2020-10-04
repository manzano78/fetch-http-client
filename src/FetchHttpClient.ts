import {
  CancelError,
  HttpClient,
  HttpError,
  RequestConfig,
  Cancel,
  CancelToken,
  RemoveInterceptor, BasicCredentials
} from '@manzano/http-client'
import fetchIntercept from 'fetch-intercept'
import {  encode } from 'js-base64'
import { FetchDelegate, FetchHttpClientConfig } from './FetchHttpClient-types'

export class FetchHttpClient extends HttpClient<FetchDelegate> {
  constructor(config: FetchHttpClientConfig = {}) {
    super({
      fetch,
      fetchIntercept,
      config,
      createAbortController: () => new AbortController()
    })
    this.toFinalURL = this.toFinalURL.bind(this)
    this.toFinalHeaders = this.toFinalHeaders.bind(this)
    this.toFetchRequest = this.toFetchRequest.bind(this)
  }

  private toFinalURL(requestBaseURL?: string, requestURL = '') {
    const { baseURL: defaultBaseURL = '' } = this.delegate.config

    return `${requestBaseURL ?? defaultBaseURL}${requestURL}`
  }

  private static throwFinalError(error: any) {
    if (Axios.isCancel(error)) {
      throw new CancelError('Request cancelled')
    }

    if (FetchHttpClient.isAxiosError(error)) {
      const { config, request, response, code } = error

      throw new HttpError(config, response, code, request)
    }

    throw error
  }

  private static toBasicAuthHeaderValue(auth: BasicCredentials) {
    const { username, password } = auth

    return `Basic ${encode(`${username}:${password}`)}`
  }

  private static isFetchCancelError(error: any) {
    return !!error && error['name'] === 'AbortError'
  }

  private toFetchRequest(config: RequestConfig): [string, RequestInit] {
    const {
      baseURL: requestBaseURL,
      url: requestURL,
      method,
      headers: requestHeaders,
      auth,
      data: body,
      cancelToken: signal
    } = config
    const url = this.toFinalURL(requestBaseURL, requestURL)
    const headers = this.toFinalHeaders(requestHeaders, auth)
    const requestInit: RequestInit = {
      method,
      headers,
      body,
      signal
    }

    return [url, requestInit]
  }

  private toFinalHeaders(requestHeaders: any, auth?: BasicCredentials) {
    if (requestHeaders || auth) {
      const { headers: defaultHeaders } = this.delegate.config

      if (auth) {
        requestHeaders = requestHeaders
          ? { ...requestHeaders }
          : {}

        requestHeaders['Authorization'] = FetchHttpClient.toBasicAuthHeaderValue(auth)
      }

      return defaultHeaders
        ? { ...defaultHeaders, ...requestHeaders }
        : requestHeaders
    }

    return undefined
  }

  async exchange<T = any>(config: RequestConfig): Promise<Response<T>> {
    try {
      const [url, requestInit] = this.toFetchRequest(config)
      const response = await this.delegate.fetch(url, requestInit)

      if (response.ok) {
        const data = await response.json()
      }
    } catch (error) {
      if (FetchHttpClient.isFetchCancelError(error)) {
        throw new CancelError('Request cancelled')
      }

      throw error
    }


  }
  //
  // addResponseInterceptor(
  //   onSuccess?: (response: Response) => Response | Promise<Response>,
  //   onError?: (error: any) => Response | Promise<Response>
  // ): RemoveInterceptor {
  //
  //   const errorHandler =
  //     onError &&
  //     ((error: any) => {
  //       const errorResult = onError(error)
  //
  //       return errorResult instanceof Promise
  //         ? errorResult.catch(FetchHttpClient.throwFinalError)
  //         : errorResult
  //     })
  //
  //   const interceptorId = this.delegate.interceptors.response.use(
  //     onSuccess,
  //     errorHandler
  //   )
  //
  //   const response = onSuccess && ((response: Response) => {
  //
  //   }
  //
  //   return fetchIntercept.register({ response })
  // }
  //
  // addRequestInterceptor(
  //   onSuccess?: (
  //     response: RequestConfig
  //   ) => RequestConfig | Promise<RequestConfig>,
  //   onError?: (error: any) => RequestConfig | Promise<RequestConfig>
  // ): RemoveInterceptor {
  //
  //   return () => {
  //     this.delegate.interceptors.request.eject(interceptorId)
  //   }
  // }

  createCancelToken(): [CancelToken, Cancel] {
    const abortController = this.delegate.createAbortController()
    const cancel = () => abortController.abort()

    return [abortController.signal, cancel]
  }
}
