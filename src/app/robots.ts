import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: ['/', '/liga/*', '/*'], // Allow everything by default (Next.js is safe)
            disallow: [
                '/dashboard/',
                '/admin/',
                '/api/',
                '/_next/',
            ],
        },
        sitemap: 'https://ligaon.com.br/sitemap.xml',
    }
}
