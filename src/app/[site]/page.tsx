import { redirect } from 'next/navigation'

export default function SiteRoot({ params }: { params: { site: string } }) {
    redirect(`/${params.site}/login`)
}
