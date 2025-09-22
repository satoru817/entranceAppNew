// =================================================================================
//           inner functions
// =================================================================================
const _fetch = async(url, method, data, callIfFailed) => {
    const stringBody = !!data ? JSON.stringify(data) : null;
    console.log(`Fetch initialized with url = ${url}, data = ${stringBody}, method = ${method}`);
    const requestBody = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    // GET method shouldn't have a body field.
    if (method !== 'GET') {
        requestBody.body = stringBody;
    }

    try {
        const response = await fetch(url, requestBody);
        if (!response.ok) {
            throw new Error(`Response Status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');

        // TODO: if you increase the variety of contentType used in this app, you must handle it below
        let fetchedData;
        if (contentType.includes('text/plain')) {
            fetchedData = await response.text();
        }
        else {
            fetchedData = await response.json();
        }

        console.log(`Fetch finished with url = ${url}, fetchedData = ${JSON.stringify(fetchedData)}, method = ${method}`);

        return fetchedData;
    }
    catch (error) {
        console.error(`Error: ${error}`);
        alert("エラー発生：必要であれば管理者に連絡してください。");
        if (callIfFailed) {
            callIfFailed();
        }
    }
}

const _fetchWithCallback = async(url, method, data, callback, callIfFailed) => {
    const fetchedData = await _fetch(url, method, data, callIfFailed);
    callback(fetchedData);
}

// =================================================================================
//              functions for export
// =================================================================================

export async function doFetch(url, method, data, callback, callIfFailed = null)
{
    await _fetchWithCallback(url, method, data, callback, callIfFailed);
}
export async function doPost(url, data)
{
    return await _fetch(url, 'POST', data);
}

export const doGet = async(url) => {
    return await _fetch(url, 'GET', null);
}

export async function fetchRelatedSchools(cramSchoolId) {
    const response = await fetch(
        `/api/school-by-cramSchoolId?cramSchoolId=${encodeURIComponent(cramSchoolId)}`
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Schools not found");
        } else if (response.status === 400) {
            throw new Error("Invalid request");
        } else {
            throw new Error("Server error occurred");
        }
    }

    return await response.json();
}
