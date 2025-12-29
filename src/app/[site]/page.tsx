import { redirect } from 'next/navigation'

export default function SiteRoot() {
    // Redireciona para /login relativo ao domínio atual
    // Ex: sub.dominio.com/ -> sub.dominio.com/login (que o middleware reescreve corretamente)
    redirect('/login')
}
