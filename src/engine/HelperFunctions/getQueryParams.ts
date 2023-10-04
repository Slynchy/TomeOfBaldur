export function getQueryParams(url: string) {
    const queryParams: Record<string, string> = {};
    // Extract the query string from the URL
    const queryString = url.split('?')[1];
    if (!queryString) {
        return queryParams;
    }

    // Split the query string into individual key-value pairs
    let pairs = queryString.split('&');

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        const key = decodeURIComponent(pair[0]);
        const value = decodeURIComponent(pair[1] || '');
        queryParams[key] = value;
    }

    return queryParams;
}