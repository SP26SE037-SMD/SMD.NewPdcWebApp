
async function checkPLOs() {
    const email = 'huyntdse184870@fpt.edu.vn';
    const password = 'huy12345';
    const curriculumId = 'e9f5d1cb-15ff-4cd3-b58f-746581d330b7';
    const baseUrl = 'http://43.207.156.116';

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const loginData = await loginRes.json();
    const token = loginData.data?.token || loginData.token;

    const ploRes = await fetch(`${baseUrl}/api/plos/curriculum/${curriculumId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const ploData = await ploRes.json();
    console.log('KEYS:', Object.keys(ploData));
    if (ploData.data && ploData.data.length > 0) {
        console.log('FIRST ITEM KEYS:', Object.keys(ploData.data[0]));
        console.log('FIRST ITEM:', JSON.stringify(ploData.data[0], null, 2));
    } else if (Array.isArray(ploData) && ploData.length > 0) {
        console.log('FIRST ITEM KEYS (ARRAY):', Object.keys(ploData[0]));
        console.log('FIRST ITEM (ARRAY):', JSON.stringify(ploData[0], null, 2));
    } else {
        console.log('FULL DATA:', JSON.stringify(ploData, null, 2));
    }
}

checkPLOs();
