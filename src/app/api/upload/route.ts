import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob;
        
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Using user provided credentials
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dubimcllz';
        const apiKey = process.env.CLOUDINARY_API_KEY || '827841446353976';
        const apiSecret = process.env.CLOUDINARY_API_SECRET || 'nWhDRn8iZPPY8qehYxyJNHwcM2Y';

        const timestamp = Math.round(new Date().getTime() / 1000);
        
        // Generate signature: SHA1(timestamp=123456789<api_secret>)
        const signatureString = `timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

        // Create new form data to push to Cloudinary
        const cloudFormData = new FormData();
        cloudFormData.append('file', file);
        cloudFormData.append('api_key', apiKey);
        cloudFormData.append('timestamp', timestamp.toString());
        cloudFormData.append('signature', signature);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: cloudFormData,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Cloudinary error:', data);
            return NextResponse.json({ error: data.error?.message || 'Upload failed' }, { status: response.status });
        }

        return NextResponse.json({ url: data.secure_url });
    } catch (error: any) {
        console.error('API Upload error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
